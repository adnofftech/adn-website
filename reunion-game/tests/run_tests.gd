extends Node
## Tests automatisés (headless) :
##   godot --headless --path . res://tests/test_runner.tscn
## Premier lancement sur un clone neuf : exécuter d'abord `godot --headless --path . --import`.
## Code de sortie 0 = tout passe. Les erreurs "mesh_get_surface_count" du rendu
## "dummy" de Godot en headless sont connues et sans effet.

var _failures := 0
var _checks := 0
var _main: Node3D
var gs: Node
var _look_total := Vector2.ZERO


func _ready() -> void:
	gs = get_node("/root/GameState")
	await _run()


func _run() -> void:
	await get_tree().process_frame # laisse la scène de test finir son initialisation
	var only := OS.get_cmdline_user_args() # ex. : -- physics   (data|physics|touch|mission)
	if only.is_empty() or "data" in only:
		_test_provider_consistency()
		_test_mesh_orientation()
		_test_real_provider_roundtrip()
	if only.is_empty() or "physics" in only:
		await _test_physics_and_controls()
	if only.is_empty() or "touch" in only:
		await _test_touch_controls()
	if only.is_empty() or "mission" in only:
		await _test_mission_and_streaming()
	print("\n==== %d vérifications, %d échec(s) ====" % [_checks, _failures])
	get_tree().quit(1 if _failures > 0 else 0)


func check(cond: bool, label: String, detail: String = "") -> void:
	_checks += 1
	if cond:
		print("  OK   ", label)
	else:
		_failures += 1
		print("  FAIL ", label, "  ", detail)


func _frames(n: int) -> void:
	for i in n:
		await get_tree().physics_frame


func _new_game() -> void:
	if _main != null:
		gs.current_vehicle = null
		_main.queue_free()
		await get_tree().process_frame
	gs.money = 0
	gs.interact_hint = ""
	for a in ["move_forward", "move_back", "move_left", "move_right", "interact", "handbrake"]:
		Input.action_release(a)
	_main = load("res://scenes/main.tscn").instantiate()
	get_tree().root.add_child(_main)
	await _frames(2)


# ---------------------------------------------------------------- données ---
func _test_provider_consistency() -> void:
	print("[Données du monde]")
	var p := SyntheticProvider.new()
	var a := p.get_sector_data(Vector2i(0, 0))
	var b := p.get_sector_data(Vector2i(1, 0))
	var c := p.get_sector_data(Vector2i(0, 1))
	check(a.is_valid(), "secteur valide (33x33 altitudes)")
	var seam_x := 0.0
	var seam_z := 0.0
	for i in SectorData.CELLS + 1:
		seam_x = maxf(seam_x, absf(a.get_height(SectorData.CELLS, i) - b.get_height(0, i)))
		seam_z = maxf(seam_z, absf(a.get_height(i, SectorData.CELLS) - c.get_height(i, 0)))
	check(seam_x < 0.001 and seam_z < 0.001, "pas de couture d'altitude entre secteurs", "dx=%f dz=%f" % [seam_x, seam_z])
	check(a.roads.size() >= 1, "le secteur (0,0) contient une route")
	var total_segments := 0
	var gap := 0.0
	var prev_end := Vector3.INF
	for sx in range(-3, 4): # la route est continue d'un secteur à l'autre (suit z de la route)
		for sz in range(-1, 2):
			var d := p.get_sector_data(Vector2i(sx, sz))
			for r in d.roads:
				total_segments += (r["points"] as PackedVector3Array).size() - 1
	check(total_segments == int(7 * SectorData.SIZE / SyntheticProvider.ROAD_STEP),
		"chaque segment de route appartient à un seul secteur", "segments=%d" % total_segments)
	check(a.buildings.size() > 0, "bâtiments générés dans le secteur (0,0)", str(a.buildings.size()))
	var d1 := p.get_sector_data(Vector2i(2, -1))
	var d2 := p.get_sector_data(Vector2i(2, -1))
	check(d1.buildings.size() == d2.buildings.size() and d1.heights == d2.heights, "génération déterministe")
	check(not p.get_info()["is_real_data"], "le monde synthétique se déclare non réel")


func _test_mesh_orientation() -> void:
	print("[Maillages]")
	var p := SyntheticProvider.new()
	var data := p.get_sector_data(Vector2i(0, 0))
	var mesh := SectorBuilder.build_terrain_mesh(data)
	var arrays := mesh.surface_get_arrays(0)
	var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	var normals: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL]
	var min_ny := 1.0
	for n in normals:
		min_ny = minf(min_ny, n.y)
	check(verts.size() == SectorData.CELLS * SectorData.CELLS * 6, "nombre de sommets du terrain", str(verts.size()))
	check(min_ny > 0.0, "normales du terrain orientées vers le haut", "min y=%f" % min_ny)
	var up_facing := 0
	for i in range(0, verts.size(), 3):
		var geo := (verts[i + 1] - verts[i]).cross(verts[i + 2] - verts[i])
		if geo.y < 0.0: # sens horaire de Godot : normale géométrique vers le bas = face visible du dessus
			up_facing += 1
	check(up_facing == verts.size() / 3, "enroulement des triangles visibles du dessus", "%d/%d" % [up_facing, verts.size() / 3])
	var rmesh := SectorBuilder.build_road_mesh(data)
	var rv: PackedVector3Array = rmesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
	var r_ok := 0
	for i in range(0, rv.size(), 3):
		if (rv[i + 1] - rv[i]).cross(rv[i + 2] - rv[i]).y < 0.0:
			r_ok += 1
	check(r_ok == rv.size() / 3 and rv.size() > 0, "enroulement de la route", "%d/%d" % [r_ok, rv.size() / 3])
	var node := SectorBuilder.build(data)
	check(node.get_node_or_null("TerrainBody") != null and node.get_node_or_null("Roads") != null, "nœuds terrain/collision/route créés")
	node.free()


func _test_real_provider_roundtrip() -> void:
	print("[Fournisseur de données réelles (format de fichier)]")
	# Fixture SYNTHÉTIQUE servant uniquement à tester le format ; aucune donnée réelle.
	var syn := SyntheticProvider.new().get_sector_data(Vector2i(0, 0))
	var dict := {"source": "fixture de test synthétique", "heights": Array(syn.heights), "roads": [], "buildings": []}
	for r in syn.roads:
		dict["roads"].append({"points": _pts(r["points"]), "width": r["width"], "first_index": r["first_index"]})
	var json := JSON.stringify(dict)
	var parsed: Dictionary = JSON.parse_string(json)
	var back := RealDataProvider.parse_sector(Vector2i(0, 0), parsed)
	check(back != null and back.is_valid() and back.is_real_data, "secteur JSON relu")
	check(back.roads.size() == syn.roads.size(), "routes relues")
	var worst := 0.0
	for i in syn.heights.size():
		worst = maxf(worst, absf(syn.heights[i] - back.heights[i]))
	check(worst < 0.001, "altitudes identiques après aller-retour JSON")
	check(RealDataProvider.parse_sector(Vector2i.ZERO, {"heights": [1, 2, 3]}) == null, "secteur invalide rejeté")
	var rp := RealDataProvider.new("res://data/reunion/sectors")
	check(not rp.has_sector(Vector2i(0, 0)), "aucune donnée réelle fournie dans le dépôt (honnêteté)")


func _pts(pts: PackedVector3Array) -> Array:
	var out := []
	for p in pts:
		out.append([p.x, p.y, p.z])
	return out


# ------------------------------------------------- physique et commandes ---
func _test_physics_and_controls() -> void:
	print("[Joueur, voiture, collisions, entrée/sortie]")
	await _new_game()
	var player: PlayerController = _main.player
	var car: CarController = _main.car
	var prov: WorldDataProvider = _main.provider
	await _frames(120)
	var ground := prov.height_at(player.global_position.x, player.global_position.z)
	check(player.is_on_floor(), "le joueur repose sur le sol")
	check(absf(player.global_position.y - ground) < 0.35, "altitude du joueur = terrain", "y=%f sol=%f" % [player.global_position.y, ground])
	check(car.linear_velocity.length() < 0.5, "la voiture est posée sans bouger", "v=%f" % car.linear_velocity.length())
	var road_y := prov.get_road_point(car.global_position.x).y
	check(car.global_position.y > road_y and car.global_position.y < road_y + 1.5, "la voiture repose sur la route", "y=%f route=%f" % [car.global_position.y, road_y])

	# Marche (la caméra regarde vers -Z au départ)
	var p0 := player.global_position
	Input.action_press("move_forward")
	await _frames(60)
	Input.action_release("move_forward")
	var moved := player.global_position.distance_to(p0)
	check(moved > 3.0 and moved < 8.0, "marche ~5,5 m/s", "distance=%f" % moved)

	# Entrer dans la voiture (téléportation à côté, puis action "interact")
	player.global_position = car.global_position + Vector3(2.5, 0.5, 0)
	await _frames(5)
	check(gs.interact_hint == "Entrer dans la voiture", "aide contextuelle près de la voiture", gs.interact_hint)
	Input.action_press("interact")
	await _frames(3)
	Input.action_release("interact")
	await _frames(2)
	check(gs.is_in_vehicle() and car.is_driven, "entrée dans la voiture")
	check(not player.visible and not player.active, "joueur masqué en voiture")
	check(_main.cam.target == car and _main.cam.vehicle_mode, "la caméra suit la voiture")

	# Accélération : l'avant (-Z du modèle) doit coïncider avec le sens de marche
	var x0 := car.global_position.x
	Input.action_press("move_forward")
	await _frames(240)
	var v_fwd := car.forward_speed
	check(v_fwd > 8.0, "accélération vers l'avant", "vitesse=%f m/s" % v_fwd)
	check(car.global_position.x - x0 > 15.0, "la voiture avance dans le sens de son avant", "dx=%f" % (car.global_position.x - x0))
	Input.action_release("move_forward")

	# Direction : braquer à droite => virage à droite (rotation horaire vue du dessus)
	var yaw0 := car.global_rotation.y
	Input.action_press("move_forward", 0.6)
	Input.action_press("move_right")
	await _frames(90)
	var dyaw := wrapf(car.global_rotation.y - yaw0, -PI, PI)
	Input.action_release("move_right")
	check(dyaw < -0.15, "direction droite = virage à droite", "dyaw=%f" % dyaw)
	yaw0 = car.global_rotation.y
	Input.action_press("move_left")
	await _frames(90)
	dyaw = wrapf(car.global_rotation.y - yaw0, -PI, PI)
	Input.action_release("move_left")
	check(dyaw > 0.15, "direction gauche = virage à gauche", "dyaw=%f" % dyaw)
	Input.action_release("move_forward")

	# Freinage
	var v_before := car.linear_velocity.length()
	Input.action_press("move_back")
	await _frames(150)
	check(absf(car.forward_speed) < 1.5 or car.forward_speed < 0.0, "freinage", "avant=%f après=%f" % [v_before, car.forward_speed])
	await _frames(60)
	Input.action_release("move_back")
	# Marche arrière
	Input.action_press("move_back")
	await _frames(150)
	check(car.forward_speed < -2.0, "marche arrière", "vitesse=%f" % car.forward_speed)
	Input.action_release("move_back")
	await _frames(240)

	# Collision contre un mur ajouté pour le test
	var fwd := car.global_transform.basis.z
	fwd.y = 0.0
	fwd = fwd.normalized()
	var wall := StaticBody3D.new()
	var ws := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(1.0, 8.0, 40.0)
	ws.shape = box
	wall.add_child(ws)
	_main.add_child(wall)
	var wall_pos := car.global_position + fwd * 35.0
	wall.global_transform = Transform3D(Basis(Vector3.UP, atan2(fwd.x, fwd.z) + PI * 0.5), wall_pos + Vector3(0, 3, 0))
	Input.action_press("move_forward")
	await _frames(420)
	Input.action_release("move_forward")
	var gap_to_wall := (wall_pos - car.global_position).dot(fwd)
	check(gap_to_wall > 0.2, "la voiture ne traverse pas le mur", "écart=%f" % gap_to_wall)
	check(car.linear_velocity.length() < 5.0, "la collision arrête la voiture", "v=%f" % car.linear_velocity.length())
	wall.queue_free()

	# Sortie refusée à vitesse élevée, acceptée à l'arrêt
	Input.action_press("move_back")
	await _frames(150)
	Input.action_release("move_back")
	check(gs.interact_hint == "Ralentis pour sortir" or absf(car.forward_speed) < 6.0, "sortie bloquée si trop rapide", gs.interact_hint)
	await _frames(300)
	check(absf(car.forward_speed) < 1.0, "la voiture s'arrête d'elle-même au lâcher", "v=%f" % car.forward_speed)
	Input.action_press("interact")
	await _frames(3)
	Input.action_release("interact")
	await _frames(3)
	check(not gs.is_in_vehicle() and player.active and player.visible, "sortie de la voiture")
	check(player.global_position.distance_to(car.global_position) < 4.5, "le joueur sort à côté de la voiture")
	await _frames(60)
	check(player.is_on_floor(), "le joueur est au sol après la sortie")
	check(_main.cam.target == player, "la caméra suit de nouveau le joueur")


# ------------------------------------------------------------- tactile ---
func _test_touch_controls() -> void:
	print("[Commandes tactiles]")
	await _new_game()
	var tc: TouchControls = _main.touch
	_look_total = Vector2.ZERO
	tc.look_delta.connect(func(d: Vector2) -> void: _look_total += d)
	var vs := get_tree().root.get_visible_rect().size
	# Joystick : toucher en bas à gauche puis glisser vers la droite et le haut
	_touch(0, Vector2(150, vs.y - 150), true)
	_drag(0, Vector2(150 + 80, vs.y - 150 - 80), Vector2(80, -80))
	await _frames(2)
	check(tc.joystick_active, "joystick activé")
	check(Input.get_action_strength("move_right") > 0.5 and Input.get_action_strength("move_forward") > 0.5,
		"joystick -> actions (droite + avant)", "r=%f f=%f" % [Input.get_action_strength("move_right"), Input.get_action_strength("move_forward")])
	_touch(0, Vector2(230, vs.y - 230), false)
	await _frames(2)
	check(Input.get_action_strength("move_right") == 0.0 and Input.get_action_strength("move_forward") == 0.0, "relâchement du joystick")
	# Caméra : glisser sur la moitié droite, en dehors des boutons
	_touch(1, Vector2(vs.x * 0.6, vs.y * 0.2), true)
	_drag(1, Vector2(vs.x * 0.6 + 50, vs.y * 0.2), Vector2(50, 0))
	_touch(1, Vector2(vs.x * 0.6 + 50, vs.y * 0.2), false)
	check(_look_total.x == 50.0, "glisser = rotation de caméra", str(_look_total))
	# Multi-touch : joystick + caméra simultanés
	_touch(0, Vector2(150, vs.y - 150), true)
	_touch(1, Vector2(vs.x * 0.6, vs.y * 0.2), true)
	_drag(0, Vector2(150, vs.y - 150 + 90), Vector2(0, 90))
	_drag(1, Vector2(vs.x * 0.6 + 10, vs.y * 0.2), Vector2(10, 0))
	await _frames(2)
	check(Input.get_action_strength("move_back") > 0.5 and _look_total.x == 60.0, "multi-touch joystick + caméra")
	_touch(0, Vector2(150, vs.y - 150 + 90), false)
	_touch(1, Vector2.ZERO, false)
	await _frames(2)
	# Boutons en mode véhicule : GAZ / FREIN
	gs.set_vehicle(_main.car)
	await _frames(2)
	var gas := Vector2(vs.x - 130, vs.y - 150)
	_touch(2, gas, true)
	await _frames(2)
	check(Input.is_action_pressed("move_forward"), "bouton GAZ maintenu")
	_touch(2, gas, false)
	await _frames(2)
	check(not Input.is_action_pressed("move_forward"), "bouton GAZ relâché")
	_touch(3, Vector2(vs.x - 90, vs.y - 320), true) # SORTIR (tap)
	_touch(3, Vector2(vs.x - 90, vs.y - 320), false)
	check(Input.is_action_pressed("interact"), "tap SORTIR : action maintenue ≥ 1 frame")
	await _frames(10)
	check(not Input.is_action_pressed("interact"), "tap SORTIR relâché ensuite")
	gs.current_vehicle = null


func _touch(index: int, pos: Vector2, pressed: bool) -> void:
	var e := InputEventScreenTouch.new()
	e.index = index
	e.position = pos
	e.pressed = pressed
	_main.touch._input(e) # direct : le viewport headless met les coordonnées à l'échelle


func _drag(index: int, pos: Vector2, rel: Vector2) -> void:
	var e := InputEventScreenDrag.new()
	e.index = index
	e.position = pos
	e.relative = rel
	_main.touch._input(e) # direct : le viewport headless met les coordonnées à l'échelle


# -------------------------------------------------- mission + streaming ---
func _test_mission_and_streaming() -> void:
	print("[Mission complète et chargement de secteurs]")
	await _new_game()
	var player: PlayerController = _main.player
	var car: CarController = _main.car
	var missions: MissionManager = _main.missions
	var sm: SectorManager = _main.sector_manager
	await _frames(90)
	check(missions.active == null and missions.title() == "Première livraison", "mission disponible au départ")
	check(sm.loaded_count() >= 9 and sm.loaded_count() <= 25, "secteurs chargés au départ", str(sm.loaded_count()))
	check(sm.is_loaded(Vector2i(-2, -1)), "secteur lointain (-2,-1) chargé au départ")

	# Marcher vers le cercle de départ avec le joystick clavier (vers la cible)
	var giver: Vector3 = missions.missions[0].giver_position
	var steps := 0
	while missions.active == null and steps < 600:
		var to := giver - player.global_position
		to.y = 0.0
		var cam_fwd: Vector3 = -_main.cam.global_transform.basis.z
		cam_fwd.y = 0.0
		cam_fwd = cam_fwd.normalized()
		var cam_right: Vector3 = _main.cam.global_transform.basis.x
		cam_right.y = 0.0
		cam_right = cam_right.normalized()
		_set_axis("move_forward", maxf(to.normalized().dot(cam_fwd), 0.0))
		_set_axis("move_back", maxf(-to.normalized().dot(cam_fwd), 0.0))
		_set_axis("move_right", maxf(to.normalized().dot(cam_right), 0.0))
		_set_axis("move_left", maxf(-to.normalized().dot(cam_right), 0.0))
		await get_tree().physics_frame
		steps += 1
	for a in ["move_forward", "move_back", "move_left", "move_right"]:
		Input.action_release(a)
	check(missions.active != null, "la mission démarre en entrant dans le cercle vert", "frames=%d" % steps)
	check(missions.current_step().get("type") == MissionDef.StepType.ENTER_VEHICLE, "étape 1 : monter dans la voiture")

	# Rejoindre la voiture puis entrer
	steps = 0
	while not gs.is_in_vehicle() and steps < 600:
		var to2 := car.global_position - player.global_position
		to2.y = 0.0
		if to2.length() < 3.0:
			Input.action_press("interact")
		else:
			var cf: Vector3 = -_main.cam.global_transform.basis.z
			cf.y = 0.0
			cf = cf.normalized()
			var cr: Vector3 = _main.cam.global_transform.basis.x
			cr.y = 0.0
			cr = cr.normalized()
			_set_axis("move_forward", maxf(to2.normalized().dot(cf), 0.0))
			_set_axis("move_back", maxf(-to2.normalized().dot(cf), 0.0))
			_set_axis("move_right", maxf(to2.normalized().dot(cr), 0.0))
			_set_axis("move_left", maxf(-to2.normalized().dot(cr), 0.0))
		await get_tree().physics_frame
		steps += 1
		Input.action_release("interact")
	for a in ["move_forward", "move_back", "move_left", "move_right", "interact"]:
		Input.action_release(a)
	await _frames(3)
	check(gs.is_in_vehicle(), "le joueur monte dans la voiture", "frames=%d" % steps)
	check(missions.step_index == 1, "étape 2 : conduire jusqu'à la livraison", str(missions.step_index))

	# Pilote automatique : suit la route, vitesse ~14 m/s
	var dest: Vector3 = missions.current_step()["position"]
	var money_before: int = gs.money
	steps = 0
	var max_off_road := 0.0
	while missions.active != null and steps < 60 * 90:
		var cp := car.global_position
		var ahead: Vector3 = _main.provider.get_road_point(cp.x + 22.0)
		var fwd := car.global_transform.basis.z
		fwd.y = 0.0
		var to3: Vector3 = ahead - cp
		to3.y = 0.0
		var ang := fwd.signed_angle_to(to3, Vector3.UP) # >0 : cible à gauche
		_set_axis("move_right", clampf(-ang * 2.0, 0.0, 1.0))
		_set_axis("move_left", clampf(ang * 2.0, 0.0, 1.0))
		_set_axis("move_forward", 1.0 if car.forward_speed < 14.0 else 0.0)
		_set_axis("move_back", 1.0 if car.forward_speed > 17.0 else 0.0)
		max_off_road = maxf(max_off_road, absf(cp.z - SyntheticProvider.road_z(cp.x)))
		await get_tree().physics_frame
		steps += 1
	for a in ["move_forward", "move_back", "move_left", "move_right"]:
		Input.action_release(a)
	print("    (trajet : %.1f s simulées, écart max à l'axe de la route %.1f m)" % [steps / 60.0, max_off_road])
	check(missions.active == null and missions.completed_ids.has("livraison_01"), "mission terminée à l'arrivée", "frames=%d pos=%s" % [steps, str(car.global_position)])
	check(gs.money == money_before + 500, "récompense de 500 € versée", str(gs.money))
	check(missions.title() == "Aucune mission", "plus de mission disponible ensuite", missions.title())

	# Streaming : après 700 m, les secteurs lointains sont déchargés et les nouveaux chargés
	await _frames(60)
	var fc := WorldDataProvider.coord_for_position(car.global_position)
	check(not sm.is_loaded(Vector2i(-2, -1)), "secteur d'origine déchargé après 700 m")
	check(sm.is_loaded(fc + Vector2i(1, 0)), "secteur devant la voiture chargé")
	check(sm.loaded_count() <= 49, "nombre de secteurs borné (7x7 max avec hystérésis)", str(sm.loaded_count()))
	print("    secteurs chargés : %d" % sm.loaded_count())


func _set_axis(action: String, strength: float) -> void:
	if strength > 0.01:
		Input.action_press(action, strength)
	else:
		Input.action_release(action)
