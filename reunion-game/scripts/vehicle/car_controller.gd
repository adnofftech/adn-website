class_name CarController
extends VehicleBody3D
## Voiture à propulsion (VehicleBody3D). L'avant est +Z (sens de poussée d'un
## engine_force positif dans Godot 4 : vérifié par les tests).
## Entrée : move_forward = accélérer, move_back = freiner puis marche arrière,
## move_left/right = direction (analogique), handbrake = frein à main.

const MAX_ENGINE_FORCE := 2400.0
const MAX_SPEED := 30.0            # m/s (~108 km/h)
const MAX_REVERSE_SPEED := 8.0
const MAX_BRAKE := 38.0
const MAX_STEER := 0.5             # rad à l'arrêt
const MIN_STEER := 0.16            # rad à pleine vitesse
const STEER_SPEED := 3.5           # rad/s
const EXIT_MAX_SPEED := 6.0        # m/s : on ne descend pas à toute vitesse

# Modèle 3D réel (monospace low-poly, CC0/MIT, issu des démos officielles
# Godot "Truck Town" : https://github.com/godotengine/godot-demo-projects).
const BODY_MESH: ArrayMesh = preload("res://assets/vehicles/minivan.res")
const WHEEL_MESH: ArrayMesh = preload("res://assets/vehicles/wheel.res")
const BODY_TARGET_LENGTH := 4.2    # m : aligné sur la forme de collision existante
const BODY_GROUND_CLEARANCE := -0.22
const BODY_MODEL_YAW := PI         # à corriger si le modèle apparaît à l'envers
const WHEEL_TARGET_DIAMETER := 0.72 # 2 * wheel_radius

var driver: PlayerController
var is_driven := false
var forward_speed := 0.0           # m/s le long de l'avant (négatif en marche arrière)

var _wheels: Array[VehicleWheel3D] = []
var _rear_wheels: Array[VehicleWheel3D] = []
var _cooldown := 0.0
var _flipped_time := 0.0


func _ready() -> void:
	add_to_group("vehicle")
	mass = 900.0
	collision_layer = 4
	collision_mask = 1 | 2 | 4
	center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM
	center_of_mass = Vector3(0, -0.15, 0)
	linear_damp = 0.03
	angular_damp = 0.8
	_build_body()
	_build_wheels()


func _build_body() -> void:
	var shape := CollisionShape3D.new()
	var bs := BoxShape3D.new()
	bs.size = Vector3(1.9, 0.7, 4.2)
	shape.shape = bs
	shape.position = Vector3(0, 0.15, 0)
	add_child(shape)
	var cabin_shape := CollisionShape3D.new()
	var cs := BoxShape3D.new()
	cs.size = Vector3(1.7, 0.6, 2.0)
	cabin_shape.shape = cs
	cabin_shape.position = Vector3(0, 0.75, -0.3)
	add_child(cabin_shape)

	add_child(_fit_mesh(BODY_MESH, BODY_TARGET_LENGTH, Vector3(0, 0, 1), BODY_MODEL_YAW, BODY_GROUND_CLEARANCE))


## Instancie `mesh`, le met à l'échelle pour que son étendue le long de
## `axis` vaille `target_length`, puis le recentre et le pose au sol
## (quel que soit le lacet `yaw` appliqué) à la hauteur `ground_y`.
func _fit_mesh(mesh: ArrayMesh, target_length: float, axis: Vector3, yaw: float, ground_y: float) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	var aabb := mesh.get_aabb()
	var extent := aabb.size.dot(axis.abs())
	var scale_factor := target_length / maxf(extent, 0.001)
	mi.scale = Vector3.ONE * scale_factor
	mi.rotation.y = yaw
	var centroid := (aabb.position + aabb.size * 0.5) * scale_factor
	centroid.y = aabb.position.y * scale_factor # pose sur le point le plus bas, pas le centre
	var rotated := Basis(Vector3.UP, yaw) * centroid
	mi.position = Vector3(-rotated.x, ground_y - rotated.y, -rotated.z)
	return mi


func _build_wheels() -> void:
	# (x, z, direction, traction)
	var layout := [
		[-0.88, 1.35, true, false], [0.88, 1.35, true, false],
		[-0.88, -1.3, false, true], [0.88, -1.3, false, true],
	]
	for entry in layout:
		var w := VehicleWheel3D.new()
		w.position = Vector3(entry[0], -0.05, entry[1])
		w.use_as_steering = entry[2]
		w.use_as_traction = entry[3]
		w.wheel_radius = 0.36
		w.wheel_rest_length = 0.2
		w.suspension_travel = 0.25
		w.suspension_stiffness = 45.0
		w.suspension_max_force = 9000.0
		w.damping_compression = 2.0
		w.damping_relaxation = 2.6
		w.wheel_friction_slip = 3.2
		w.wheel_roll_influence = 0.25
		var mi := _fit_mesh(WHEEL_MESH, WHEEL_TARGET_DIAMETER, Vector3(1, 0, 0), 0.0, -WHEEL_TARGET_DIAMETER * 0.5)
		mi.position.y += WHEEL_TARGET_DIAMETER * 0.5 # roue centrée sur l'essieu, pas posée au sol
		w.add_child(mi)
		add_child(w)
		_wheels.append(w)
		if entry[3]:
			_rear_wheels.append(w)


func enter(player: PlayerController) -> void:
	if is_driven:
		return
	driver = player
	is_driven = true
	_cooldown = 0.5
	player.set_active(false)
	GameState.set_vehicle(self)


func exit() -> void:
	if not is_driven:
		return
	is_driven = false
	var side := global_transform.basis.x
	side.y = 0.0
	driver.global_position = global_position - side.normalized() * 2.4 + Vector3(0, 0.6, 0)
	driver.set_active(true)
	driver = null
	GameState.set_vehicle(null)


func speed_kmh() -> float:
	return linear_velocity.length() * 3.6


func _physics_process(delta: float) -> void:
	forward_speed = global_transform.basis.z.dot(linear_velocity)
	_check_flipped(delta)
	if not is_driven:
		engine_force = 0.0
		brake = 6.0
		steering = move_toward(steering, 0.0, 2.0 * delta)
		return

	driver.global_position = global_position
	_cooldown -= delta

	var accel := Input.get_action_strength("move_forward")
	var back := Input.get_action_strength("move_back")
	var steer_in := Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
	var force := 0.0
	var brk := 0.0
	if accel > 0.05 and accel >= back:
		if forward_speed < -1.0:
			brk = MAX_BRAKE * accel
		else:
			var limit := clampf(1.0 - maxf(forward_speed, 0.0) / MAX_SPEED, 0.0, 1.0)
			force = MAX_ENGINE_FORCE * accel * limit
	elif back > 0.05:
		if forward_speed > 1.0:
			brk = MAX_BRAKE * back
		else:
			var limit := clampf(1.0 - maxf(-forward_speed, 0.0) / MAX_REVERSE_SPEED, 0.0, 1.0)
			force = -MAX_ENGINE_FORCE * 0.6 * back * limit
	else:
		brk = 4.0 # frein moteur
	var hand := Input.is_action_pressed("handbrake")
	if hand:
		brk = maxf(brk, MAX_BRAKE)
	for w in _rear_wheels:
		w.wheel_friction_slip = 1.4 if hand else 3.2
	engine_force = force
	brake = brk

	var t := clampf(absf(forward_speed) / MAX_SPEED, 0.0, 1.0)
	var steer_limit := lerpf(MAX_STEER, MIN_STEER, t)
	steering = move_toward(steering, -steer_in * steer_limit, STEER_SPEED * delta)

	var can_exit := absf(forward_speed) < EXIT_MAX_SPEED
	GameState.interact_hint = "Sortir de la voiture" if can_exit else "Ralentis pour sortir"
	if _cooldown <= 0.0 and can_exit and Input.is_action_just_pressed("interact"):
		exit()


## Remet la voiture sur ses roues si elle reste retournée.
func _check_flipped(delta: float) -> void:
	if global_transform.basis.y.y < 0.25:
		_flipped_time += delta
		if _flipped_time > 3.0:
			_flipped_time = 0.0
			var p := global_position + Vector3(0, 1.2, 0)
			var yaw := global_rotation.y
			linear_velocity = Vector3.ZERO
			angular_velocity = Vector3.ZERO
			global_transform = Transform3D(Basis(Vector3.UP, yaw), p)
	else:
		_flipped_time = 0.0
