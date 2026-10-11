extends Node3D
## Point d'entrée : assemble le monde, le joueur, la voiture, la caméra, les
## missions et l'interface. Chaque système vit dans son propre script.

const SPAWN_S := 0.0   # abscisse sur la route de test

var provider: WorldDataProvider
var sector_manager: SectorManager
var player: PlayerController
var car: CarController
var cam: FollowCamera
var missions: MissionManager
var touch: TouchControls
var hud: Hud


func _ready() -> void:
	# --- Données du monde : à remplacer par CompositeProvider(Real, Synthetic) plus tard
	provider = SyntheticProvider.new()
	_setup_environment()

	sector_manager = SectorManager.new()
	sector_manager.name = "SectorManager"
	add_child(sector_manager)
	sector_manager.setup(provider)
	if OS.has_feature("mobile"):
		sector_manager.view_radius = 1 # 3x3 secteurs visibles (25 gardés en mémoire) : budget mobile

	var road0 := provider.get_road_point(SPAWN_S)
	sector_manager.load_immediately(road0, 1)

	# --- Voiture sur la route, orientée dans le sens de la route (+X)
	car = CarController.new()
	car.name = "Car"
	add_child(car)
	var car_pos := provider.get_road_point(14.0) + Vector3(0, 1.0, 0)
	var tangent := (provider.get_road_point(15.0) - provider.get_road_point(13.0)).normalized()
	car.global_transform = Transform3D(Basis(Vector3.UP, atan2(tangent.x, tangent.z)), car_pos)

	# --- Joueur près de la voiture, à côté du cercle de départ de la mission
	player = PlayerController.new()
	player.name = "Player"
	add_child(player)
	var p0 := provider.get_road_point(-8.0)
	player.global_position = Vector3(p0.x - 4.0, provider.height_at(p0.x - 4.0, p0.z + 15.0) + 0.3, p0.z + 15.0)

	cam = FollowCamera.new()
	cam.name = "Camera"
	cam.provider = provider
	add_child(cam)
	cam.current = true
	cam.set_target(player, false)

	sector_manager.focus = player
	sector_manager.anchors = [car]

	missions = MissionManager.new()
	missions.name = "Missions"
	add_child(missions)
	missions.setup(provider, player)
	missions.add_mission(_first_mission())

	touch = TouchControls.new()
	touch.name = "TouchControls"
	add_child(touch)
	touch.look_delta.connect(cam.add_look)

	hud = Hud.new()
	hud.name = "Hud"
	add_child(hud)
	hud.bind(missions, cam, provider)

	GameState.mode_changed.connect(_on_mode_changed)
	GameState.notify("Marche jusqu'au cercle vert pour commencer")


func _first_mission() -> MissionDef:
	var m := MissionDef.new()
	m.id = "livraison_01"
	m.title = "Première livraison"
	m.briefing = "Récupère la voiture et livre le colis au point indiqué."
	m.reward_money = 500
	var start := provider.get_road_point(-8.0)
	m.giver_position = Vector3(start.x, 0.0, start.z + 8.0)
	var dest := provider.get_road_point(700.0)
	m.add_step(MissionDef.StepType.ENTER_VEHICLE, "Monte dans la voiture rouge (bouton ACTION).")
	m.add_step(MissionDef.StepType.REACH_IN_VEHICLE, "Conduis jusqu'au point de livraison.", dest, 7.0)
	return m


func _on_mode_changed(in_vehicle: bool) -> void:
	if in_vehicle:
		cam.set_target(car, true)
		sector_manager.focus = car
	else:
		cam.set_target(player, false)
		sector_manager.focus = player


func _setup_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	sky.sky_material = ProceduralSkyMaterial.new()
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.6
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.fog_enabled = true
	env.fog_light_color = Color("b9d3e6")
	env.fog_density = 0.0016 if OS.has_feature("mobile") else 0.0009
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, -30, 0)
	sun.light_energy = 0.85
	sun.shadow_enabled = not OS.has_feature("mobile") # ombres coûteuses sur mobile
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	sun.directional_shadow_max_distance = 90.0
	add_child(sun)
