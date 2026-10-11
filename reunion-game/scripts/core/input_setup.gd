class_name InputSetup
extends RefCounted
## Déclare les actions d'entrée par code (clavier = secours pour tester sur PC).
## Les touches sont "physiques" : WASD sur QWERTY correspond à ZQSD sur AZERTY.

static func register() -> void:
	if InputMap.has_action("move_forward"):
		return
	_add("move_forward", [KEY_W, KEY_UP])
	_add("move_back", [KEY_S, KEY_DOWN])
	_add("move_left", [KEY_A, KEY_LEFT])
	_add("move_right", [KEY_D, KEY_RIGHT])
	_add("interact", [KEY_E, KEY_F, KEY_ENTER])
	_add("handbrake", [KEY_SPACE])


static func _add(action: StringName, keys: Array) -> void:
	InputMap.add_action(action, 0.2)
	for k in keys:
		var ev := InputEventKey.new()
		ev.physical_keycode = k as Key
		InputMap.action_add_event(action, ev)
