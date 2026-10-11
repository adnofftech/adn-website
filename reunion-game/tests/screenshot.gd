extends Node
## Capture d'écrans (nécessite un rendu réel, ex. xvfb-run) :
##   xvfb-run -a -s "-screen 0 1280x720x24" godot --path . --rendering-driver opengl3 res://tests/screenshot.tscn -- <dossier>
var _out := "user://shots"

func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() > 0:
		_out = args[0]
	DirAccess.make_dir_recursive_absolute(_out)
	await get_tree().process_frame
	var m: Node3D = load("res://scenes/main.tscn").instantiate()
	get_tree().root.add_child(m)
	await _wait(2.0)
	_shot("01_depart_a_pied")
	# Rejoint la voiture et monte
	m.player.global_position = m.car.global_position + Vector3(2.5, 0.5, 0)
	await _wait(0.5)
	_shot("02_pres_de_la_voiture")
	m.car.enter(m.player)
	Input.action_press("move_forward")
	await _wait(3.0)
	_shot("03_en_conduite")
	Input.action_release("move_forward")
	get_tree().quit()

func _wait(seconds: float) -> void:
	await get_tree().create_timer(seconds).timeout

func _shot(name: String) -> void:
	var img := get_viewport().get_texture().get_image()
	var path := "%s/%s.png" % [_out, name]
	img.save_png(path)
	print("capture : ", path, " ", img.get_size())
