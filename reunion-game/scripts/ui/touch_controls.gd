class_name TouchControls
extends CanvasLayer
## Commandes tactiles multi-touch : joystick flottant (moitié gauche), boutons
## (droite), glisser ailleurs = orbite caméra. Tout passe par les actions
## d'entrée (move_*, interact, handbrake) : clavier et tactile sont équivalents.
## Dessiné par code : aucun asset graphique requis.

signal look_delta(delta: Vector2)

const JOY_RADIUS := 100.0
const DEADZONE := 0.18
const TAP_HOLD_MS := 120

var joystick_active := false
var joystick_vector := Vector2.ZERO

var _canvas: Control
var _joy_index := -1
var _joy_center := Vector2.ZERO
var _look_index := -1
var _buttons: Array[Dictionary] = []
var _touch_actions: Dictionary = {}    # action -> true si pressée par le tactile
var _release_at: Dictionary = {}       # action -> instant (ms) de relâchement différé


func _ready() -> void:
	layer = 10
	_canvas = Control.new()
	_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_canvas)
	_canvas.draw.connect(_on_draw)
	_buttons = [
		{"id": "interact", "label": "ACTION", "action": "interact", "tap": true, "vehicle": false, "r": 62.0, "touch": -1},
		{"id": "gas", "label": "GAZ", "action": "move_forward", "tap": false, "vehicle": true, "r": 84.0, "touch": -1},
		{"id": "brake", "label": "FREIN", "action": "move_back", "tap": false, "vehicle": true, "r": 66.0, "touch": -1},
		{"id": "hand", "label": "F.MAIN", "action": "handbrake", "tap": false, "vehicle": true, "r": 46.0, "touch": -1},
		{"id": "exit", "label": "SORTIR", "action": "interact", "tap": true, "vehicle": true, "r": 50.0, "touch": -1},
	]
	GameState.mode_changed.connect(_on_mode_changed)


func _on_mode_changed(_in_vehicle: bool) -> void:
	_release_everything()


func _release_everything() -> void:
	for b in _buttons:
		b["touch"] = -1
	_joy_index = -1
	joystick_active = false
	joystick_vector = Vector2.ZERO
	for a in _touch_actions.keys():
		Input.action_release(a)
	_touch_actions.clear()
	_release_at.clear()


func _view_size() -> Vector2:
	return get_viewport().get_visible_rect().size


func _button_center(id: String) -> Vector2:
	var s := _view_size()
	match id:
		"interact": return Vector2(s.x - 120, s.y - 130)
		"gas": return Vector2(s.x - 130, s.y - 150)
		"brake": return Vector2(s.x - 310, s.y - 110)
		"hand": return Vector2(s.x - 320, s.y - 250)
		"exit": return Vector2(s.x - 90, s.y - 320)
	return Vector2.ZERO


func _button_visible(b: Dictionary) -> bool:
	return b["vehicle"] == GameState.is_in_vehicle()


func _joystick_zone(p: Vector2) -> bool:
	var s := _view_size()
	return p.x < s.x * 0.45 and p.y > s.y * 0.3


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			_press(event.index, event.position)
		else:
			_release(event.index)
	elif event is InputEventScreenDrag:
		_drag(event.index, event.position, event.relative)


func _press(index: int, pos: Vector2) -> void:
	for b in _buttons:
		if not _button_visible(b):
			continue
		if pos.distance_to(_button_center(b["id"])) <= float(b["r"]) * 1.15:
			b["touch"] = index
			_set_action(b["action"], 1.0)
			_release_at.erase(b["action"])
			get_viewport().set_input_as_handled()
			return
	if _joy_index == -1 and _joystick_zone(pos):
		_joy_index = index
		_joy_center = pos
		joystick_active = true
		joystick_vector = Vector2.ZERO
		get_viewport().set_input_as_handled()
	elif _look_index == -1:
		_look_index = index


func _release(index: int) -> void:
	for b in _buttons:
		if b["touch"] == index:
			b["touch"] = -1
			if b["tap"]:
				# Relâchement différé : garantit au moins une frame "pressée".
				_release_at[b["action"]] = Time.get_ticks_msec() + TAP_HOLD_MS
			else:
				_set_action(b["action"], 0.0)
	if index == _joy_index:
		_joy_index = -1
		joystick_active = false
		joystick_vector = Vector2.ZERO
		_apply_axes(Vector2.ZERO)
	if index == _look_index:
		_look_index = -1


func _drag(index: int, pos: Vector2, relative: Vector2) -> void:
	if index == _joy_index:
		var v := (pos - _joy_center) / JOY_RADIUS
		joystick_vector = v.limit_length(1.0)
		_apply_axes(joystick_vector)
	elif index == _look_index:
		look_delta.emit(relative)


func _apply_axes(v: Vector2) -> void:
	var x := v.x
	var y := v.y
	if absf(x) < DEADZONE:
		x = 0.0
	if absf(y) < DEADZONE:
		y = 0.0
	_set_action("move_right", maxf(x, 0.0))
	_set_action("move_left", maxf(-x, 0.0))
	if GameState.is_in_vehicle():
		return # en voiture : accélération/frein par les boutons, joystick = direction
	_set_action("move_back", maxf(y, 0.0))
	_set_action("move_forward", maxf(-y, 0.0))


func _set_action(action: String, strength: float) -> void:
	if strength > 0.001:
		Input.action_press(action, strength)
		_touch_actions[action] = true
	elif _touch_actions.has(action):
		Input.action_release(action)
		_touch_actions.erase(action)


func _process(_delta: float) -> void:
	var now := Time.get_ticks_msec()
	for a in _release_at.keys():
		if now >= int(_release_at[a]):
			_set_action(a, 0.0)
			_release_at.erase(a)
	_canvas.queue_redraw()


func _on_draw() -> void:
	var idle := Color(1, 1, 1, 0.18)
	var active := Color(1, 1, 1, 0.45)
	var font := ThemeDB.fallback_font
	# Joystick
	var s := _view_size()
	var base := _joy_center if joystick_active else Vector2(150, s.y - 150)
	_canvas.draw_circle(base, JOY_RADIUS, idle)
	_canvas.draw_arc(base, JOY_RADIUS, 0, TAU, 48, Color(1, 1, 1, 0.35), 3.0)
	var knob := base + joystick_vector * JOY_RADIUS
	_canvas.draw_circle(knob, 38.0, active if joystick_active else idle)
	# Boutons
	for b in _buttons:
		if not _button_visible(b):
			continue
		var c := _button_center(b["id"])
		var r: float = b["r"]
		var enabled := true
		if b["id"] == "interact":
			enabled = GameState.interact_hint != ""
		var pressed: bool = b["touch"] != -1
		var col := active if pressed else idle
		if not enabled:
			col.a *= 0.5
		_canvas.draw_circle(c, r, col)
		_canvas.draw_arc(c, r, 0, TAU, 40, Color(1, 1, 1, 0.5 if enabled else 0.2), 3.0)
		var label: String = b["label"]
		var fs := 22 if r > 55.0 else 15
		var tw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
		_canvas.draw_string(font, c + Vector2(-tw * 0.5, fs * 0.35), label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs,
			Color(1, 1, 1, 0.95 if enabled else 0.4))
