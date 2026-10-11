class_name FollowCamera
extends Camera3D
## Caméra à la troisième personne. À pied : orbite libre (glisser le doigt).
## En voiture : se replace derrière le véhicule quand on ne touche plus l'écran.

var target: Node3D
var vehicle_mode := false
var provider: WorldDataProvider
var yaw := 0.0
var pitch := deg_to_rad(20.0)
var distance := 5.5

var _idle := 99.0
var _placed := false


func _ready() -> void:
	near = 0.3
	far = 1400.0
	fov = 70.0


func set_target(t: Node3D, is_vehicle: bool) -> void:
	target = t
	vehicle_mode = is_vehicle
	distance = 8.5 if is_vehicle else 5.5
	_idle = 99.0 if is_vehicle else 0.0
	if is_vehicle:
		var f := t.global_transform.basis.z # l'avant de la voiture est +Z
		yaw = atan2(-f.x, -f.z)


func add_look(delta: Vector2) -> void:
	yaw -= delta.x * 0.006
	pitch = clampf(pitch + delta.y * 0.004, 0.05, 1.25)
	_idle = 0.0


func _process(delta: float) -> void:
	if target == null:
		return
	_idle += delta
	if vehicle_mode and _idle > 1.5:
		var f := target.global_transform.basis.z
		f.y = 0.0
		if f.length() > 0.1:
			yaw = lerp_angle(yaw, atan2(-f.x, -f.z), 1.0 - exp(-3.0 * delta))
	var focus := target.global_position + Vector3(0, 1.3, 0)
	var fwd := Vector3(-sin(yaw), 0.0, -cos(yaw))
	var desired := focus - fwd * cos(pitch) * distance + Vector3(0, sin(pitch) * distance, 0)
	if provider != null:
		desired.y = maxf(desired.y, provider.height_at(desired.x, desired.z) + 0.8)
	if _placed:
		global_position = global_position.lerp(desired, 1.0 - exp(-12.0 * delta))
	else:
		global_position = desired
		_placed = true
	if global_position.distance_to(focus) > 0.1:
		look_at(focus)
