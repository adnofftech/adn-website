class_name Hud
extends CanvasLayer
## Interface de jeu : mission en cours, boussole vers l'objectif, argent,
## vitesse, aide contextuelle, messages, et bandeau d'origine des données.

var missions: MissionManager
var camera: Camera3D
var provider: WorldDataProvider

var _title: Label
var _objective: Label
var _distance: Label
var _money: Label
var _speed: Label
var _prompt: Label
var _toast: Label
var _data_banner: Label
var _compass: Control
var _toast_time := 0.0


func _ready() -> void:
	layer = 5
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	# Panneau mission (haut gauche)
	var panel := PanelContainer.new()
	panel.position = Vector2(16, 16)
	panel.custom_minimum_size = Vector2(380, 0)
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(panel)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	panel.add_child(row)
	_compass = Control.new()
	_compass.custom_minimum_size = Vector2(56, 56)
	_compass.draw.connect(_draw_compass)
	row.add_child(_compass)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(col)
	_title = _label(22, col)
	_objective = _label(17, col)
	_objective.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_objective.custom_minimum_size = Vector2(290, 0)
	_distance = _label(15, col)

	# Argent et vitesse (haut droite)
	var right := VBoxContainer.new()
	right.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT, Control.PRESET_MODE_MINSIZE, 16)
	right.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	root.add_child(right)
	_money = _label(28, right)
	_money.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_speed = _label(24, right)
	_speed.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

	# Aide contextuelle (bas centre) et messages (haut centre)
	_prompt = _label(22, root)
	_prompt.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM, Control.PRESET_MODE_MINSIZE, 190)
	_prompt.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_toast = _label(30, root)
	_toast.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP, Control.PRESET_MODE_MINSIZE, 90)
	_toast.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_toast.modulate.a = 0.0

	_data_banner = _label(12, root)
	_data_banner.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT, Control.PRESET_MODE_MINSIZE, 8)
	_data_banner.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_data_banner.modulate = Color(1, 1, 1, 0.7)

	GameState.money_changed.connect(_on_money)
	GameState.toast_requested.connect(show_toast)
	_on_money(GameState.money)


func _label(size: int, parent: Node) -> Label:
	var l := Label.new()
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_outline_color", Color.BLACK)
	l.add_theme_constant_override("outline_size", 5)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(l)
	return l


func bind(m: MissionManager, cam: Camera3D, p: WorldDataProvider) -> void:
	missions = m
	camera = cam
	provider = p
	m.state_changed.connect(_refresh_mission)
	var info := p.get_info()
	_data_banner.text = "Données : %s%s" % [info["name"], "" if info["is_real_data"] else "  —  ne représente PAS La Réunion"]
	_refresh_mission()


func _refresh_mission() -> void:
	_title.text = missions.title()
	_objective.text = missions.objective_text()


func _on_money(amount: int) -> void:
	_money.text = "%d €" % amount


func show_toast(text: String) -> void:
	_toast.text = text
	_toast_time = 3.5


func _process(delta: float) -> void:
	_prompt.text = GameState.interact_hint
	_toast_time = maxf(_toast_time - delta, 0.0)
	_toast.modulate.a = clampf(_toast_time, 0.0, 1.0)
	var v := GameState.current_vehicle
	_speed.visible = v != null
	if v is CarController:
		_speed.text = "%d km/h" % int(round(v.speed_kmh()))
	if missions != null and camera != null:
		var t: Variant = missions.target_position()
		if t == null:
			_distance.text = ""
		else:
			var from := _actor_pos()
			_distance.text = "Distance : %d m" % int(round(Vector2(t.x - from.x, t.z - from.z).length()))
	_compass.queue_redraw()


func _actor_pos() -> Vector3:
	if GameState.is_in_vehicle():
		return GameState.current_vehicle.global_position
	return missions.actor.global_position if missions != null and missions.actor != null else Vector3.ZERO


func _draw_compass() -> void:
	var c := _compass.size * 0.5
	_compass.draw_circle(c, 26.0, Color(0, 0, 0, 0.45))
	if missions == null or camera == null:
		return
	var t: Variant = missions.target_position()
	if t == null:
		return
	var from := _actor_pos()
	var to_t := Vector2(t.x - from.x, t.z - from.z)
	if to_t.length() < 0.5:
		return
	var cam_fwd := -camera.global_transform.basis.z
	var cam_angle := atan2(cam_fwd.x, -cam_fwd.z)     # 0 = vers -Z, horaire
	var tgt_angle := atan2(to_t.x, -to_t.y)
	var a := tgt_angle - cam_angle                    # 0 = droit devant (haut de l'écran)
	var dir := Vector2(sin(a), -cos(a))
	var perp := Vector2(-dir.y, dir.x)
	var tip := c + dir * 22.0
	_compass.draw_colored_polygon(PackedVector2Array([tip, c - dir * 12.0 + perp * 12.0, c - dir * 5.0, c - dir * 12.0 - perp * 12.0]),
		Color("ffb02e"))
