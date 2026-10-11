class_name MissionManager
extends Node3D
## Exécute les missions : disponible -> en cours (étape par étape) -> terminée.
## Ne connaît ni l'interface ni les contrôleurs : il lit GameState et la
## position de l'acteur (joueur ou véhicule conduit) fournie par `actor`.

signal state_changed
signal mission_started(def: MissionDef)
signal mission_completed(def: MissionDef)

const START_RADIUS := 2.5

var provider: WorldDataProvider
var actor: Node3D            # nœud dont la position compte (joueur ; suit le véhicule)
var missions: Array[MissionDef] = []
var active: MissionDef = null
var step_index := 0
var completed_ids: Array[String] = []

var _giver_markers: Dictionary = {}   # id -> MissionMarker
var _target_marker: MissionMarker


func setup(p: WorldDataProvider, actor_node: Node3D) -> void:
	provider = p
	actor = actor_node


func add_mission(def: MissionDef) -> void:
	missions.append(def)
	var m := MissionMarker.new()
	m.setup(Color("3ddc6a"), START_RADIUS)
	m.position = _grounded(def.giver_position)
	add_child(m)
	_giver_markers[def.id] = m
	state_changed.emit()


func _grounded(p: Vector3) -> Vector3:
	return Vector3(p.x, provider.height_at(p.x, p.z) + 0.05, p.z)


func current_step() -> Dictionary:
	if active == null or step_index >= active.steps.size():
		return {}
	return active.steps[step_index]


func title() -> String:
	if active != null:
		return active.title
	for m in missions:
		if not completed_ids.has(m.id):
			return m.title
	return "Aucune mission"


func objective_text() -> String:
	if active != null:
		return str(current_step().get("text", ""))
	for m in missions:
		if not completed_ids.has(m.id):
			return "Rejoins le cercle vert pour commencer."
	return "Toutes les missions sont terminées."


## Position à afficher sur le HUD (cercle de départ ou objectif), ou null.
func target_position() -> Variant:
	if active != null:
		var s := current_step()
		if s.get("type") != MissionDef.StepType.ENTER_VEHICLE:
			return _grounded(s["position"])
		# Étape "monter dans le véhicule" : viser le véhicule le plus proche.
		var v := get_tree().get_first_node_in_group("vehicle")
		return v.global_position if v != null else null
	for m in missions:
		if not completed_ids.has(m.id):
			return _grounded(m.giver_position)
	return null


func _physics_process(_delta: float) -> void:
	if actor == null:
		return
	var pos := _actor_position()
	if active == null:
		for m in missions:
			if completed_ids.has(m.id):
				continue
			var g := _grounded(m.giver_position)
			if Vector2(pos.x - g.x, pos.z - g.z).length() <= START_RADIUS and absf(pos.y - g.y) < 6.0:
				_start(m)
				break
		return
	_evaluate_step(pos)


func _actor_position() -> Vector3:
	return GameState.current_vehicle.global_position if GameState.is_in_vehicle() else actor.global_position


func _start(def: MissionDef) -> void:
	active = def
	step_index = 0
	_giver_markers[def.id].visible = false
	GameState.notify("Mission : %s" % def.title)
	mission_started.emit(def)
	_enter_step()


func _enter_step() -> void:
	if _target_marker != null:
		_target_marker.queue_free()
		_target_marker = null
	var s := current_step()
	if not s.is_empty() and s["type"] != MissionDef.StepType.ENTER_VEHICLE:
		_target_marker = MissionMarker.new()
		_target_marker.setup(Color("ffb02e"), float(s["radius"]))
		_target_marker.position = _grounded(s["position"])
		add_child(_target_marker)
	state_changed.emit()


func _evaluate_step(pos: Vector3) -> void:
	var s := current_step()
	if s.is_empty():
		return
	var done := false
	match s["type"]:
		MissionDef.StepType.ENTER_VEHICLE:
			done = GameState.is_in_vehicle()
		MissionDef.StepType.REACH_IN_VEHICLE:
			done = GameState.is_in_vehicle() and _near(pos, s)
		MissionDef.StepType.REACH_ON_FOOT:
			done = (not GameState.is_in_vehicle()) and _near(pos, s)
	if done:
		step_index += 1
		if step_index >= active.steps.size():
			_complete()
		else:
			_enter_step()


func _near(pos: Vector3, s: Dictionary) -> bool:
	var t: Vector3 = s["position"]
	return Vector2(pos.x - t.x, pos.z - t.z).length() <= float(s["radius"])


func _complete() -> void:
	var def := active
	completed_ids.append(def.id)
	GameState.add_money(def.reward_money)
	GameState.notify("Mission terminée ! +%d €" % def.reward_money)
	active = null
	step_index = 0
	if _target_marker != null:
		_target_marker.queue_free()
		_target_marker = null
	mission_completed.emit(def)
	state_changed.emit()
