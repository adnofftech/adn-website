class_name PlayerController
extends CharacterBody3D
## Personnage à pied : déplacement relatif à la caméra, gravité, interaction
## avec les véhicules proches. Désactivé (caché, sans collision) en voiture.

const WALK_SPEED := 5.5
const ACCEL := 28.0
const GRAVITY := 22.0
const ENTER_DISTANCE := 4.5
const VOID_Y := -80.0

var active := true
var respawn_point := Vector3.ZERO

var _visual: Node3D
var _shape: CollisionShape3D
var _interact_lock := 0.0 # évite de re-monter dans la même frame que la sortie


func _ready() -> void:
	collision_layer = 2
	collision_mask = 1 | 4   # monde + véhicules
	floor_snap_length = 0.5
	floor_max_angle = deg_to_rad(50.0)
	_shape = CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.35
	cap.height = 1.8
	_shape.shape = cap
	_shape.position = Vector3(0, 0.9, 0)
	add_child(_shape)
	_build_visual()


func _build_visual() -> void:
	_visual = Node3D.new()
	add_child(_visual)
	var skin := Color("e0b48c")
	var shirt := Color("2f6fb5")
	var pants := Color("2b2f3a")
	var shoes := Color("1a1a1a")

	# Jambes (de la cheville à la hanche)
	for side in [-1.0, 1.0]:
		var leg := MeshInstance3D.new()
		var lm := CapsuleMesh.new()
		lm.radius = 0.11
		lm.height = 0.9
		leg.mesh = lm
		leg.position = Vector3(side * 0.13, 0.45, 0)
		leg.material_override = _mat(pants)
		_visual.add_child(leg)
		var shoe := MeshInstance3D.new()
		var shm := BoxMesh.new()
		shm.size = Vector3(0.16, 0.12, 0.28)
		shoe.mesh = shm
		shoe.position = Vector3(side * 0.13, 0.06, 0.04)
		shoe.material_override = _mat(shoes)
		_visual.add_child(shoe)

	# Torse
	var body := MeshInstance3D.new()
	var cm := CapsuleMesh.new()
	cm.radius = 0.28
	cm.height = 1.0
	body.mesh = cm
	body.position = Vector3(0, 1.22, 0)
	body.material_override = _mat(shirt)
	_visual.add_child(body)

	# Bras
	for side in [-1.0, 1.0]:
		var arm := MeshInstance3D.new()
		var am := CapsuleMesh.new()
		am.radius = 0.09
		am.height = 0.72
		arm.mesh = am
		arm.position = Vector3(side * 0.37, 1.1, 0)
		arm.rotation.z = side * 0.08
		arm.material_override = _mat(shirt if side < 0 else skin)
		_visual.add_child(arm)
		# avant-bras (teinte peau)
		var forearm := MeshInstance3D.new()
		var fm := CapsuleMesh.new()
		fm.radius = 0.08
		fm.height = 0.3
		forearm.mesh = fm
		forearm.position = Vector3(side * 0.39, 0.78, 0)
		forearm.material_override = _mat(skin)
		_visual.add_child(forearm)

	# Tête + cheveux
	var head := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.2
	sm.height = 0.4
	head.mesh = sm
	head.position = Vector3(0, 1.85, 0)
	head.material_override = _mat(skin)
	_visual.add_child(head)
	var hair := MeshInstance3D.new()
	var hm := SphereMesh.new()
	hm.radius = 0.205
	hm.height = 0.42
	hair.mesh = hm
	hair.position = Vector3(0, 1.9, -0.02)
	var hair_mat := _mat(Color("2a1d14"))
	hair.material_override = hair_mat
	# ne couvre que le dessus/l'arrière (on recoupe via une échelle non uniforme simple)
	hair.scale = Vector3(1.0, 0.75, 1.0)
	_visual.add_child(hair)

	var nose := MeshInstance3D.new() # repère l'avant du personnage (-Z)
	var bm := BoxMesh.new()
	bm.size = Vector3(0.1, 0.1, 0.22)
	nose.mesh = bm
	nose.position = Vector3(0, 1.1, -0.34)
	nose.material_override = _mat(Color("f2c14e"))
	_visual.add_child(nose)


func _mat(c: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	return m


func set_active(value: bool) -> void:
	active = value
	visible = value
	_shape.disabled = not value
	velocity = Vector3.ZERO
	if value:
		respawn_point = global_position
		_interact_lock = 0.4


func _physics_process(delta: float) -> void:
	if not active:
		return
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var dir := Vector3.ZERO
	var cam := get_viewport().get_camera_3d()
	if cam != null:
		var fwd := -cam.global_transform.basis.z
		fwd.y = 0.0
		fwd = fwd.normalized()
		var right := cam.global_transform.basis.x
		right.y = 0.0
		right = right.normalized()
		dir = right * input.x + fwd * -input.y
	var target := dir * WALK_SPEED
	velocity.x = move_toward(velocity.x, target.x, ACCEL * delta)
	velocity.z = move_toward(velocity.z, target.z, ACCEL * delta)
	if is_on_floor():
		velocity.y = -1.0
	else:
		velocity.y -= GRAVITY * delta
	move_and_slide()

	if dir.length() > 0.1:
		var want := atan2(-dir.x, -dir.z)
		_visual.rotation.y = lerp_angle(_visual.rotation.y, want, 1.0 - exp(-14.0 * delta))
	if is_on_floor():
		respawn_point = global_position
	if global_position.y < VOID_Y:
		global_position = respawn_point + Vector3(0, 2, 0)
		velocity = Vector3.ZERO
	_update_interaction()


func nearest_vehicle() -> CarController:
	var best: CarController = null
	var best_d := ENTER_DISTANCE
	for v in get_tree().get_nodes_in_group("vehicle"):
		var d := global_position.distance_to(v.global_position)
		if d < best_d and v is CarController:
			best_d = d
			best = v
	return best


func _update_interaction() -> void:
	_interact_lock = maxf(_interact_lock - get_physics_process_delta_time(), 0.0)
	var car := nearest_vehicle()
	if car == null:
		GameState.interact_hint = ""
		return
	GameState.interact_hint = "Entrer dans la voiture"
	if _interact_lock <= 0.0 and Input.is_action_just_pressed("interact"):
		car.enter(self)
