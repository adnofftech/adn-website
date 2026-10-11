extends Node3D
## Point d'entrée : assemble le monde, le joueur, la voiture, la caméra, les
## missions et l'interface. Chaque système vit dans son propre script.

## --- Point de départ réel (Saint-Denis) -----------------------------------
## RealDataProvider n'a pas de courbe paramétrée comme le monde synthétique :
## ces points ont été choisis hors-jeu (voir docs/osm_pipeline), sur une vraie
## rue (way OSM 31130832, "tertiary") qui n'est pas dans un bâtiment.
## Repère : mètres, X = est, Y = altitude, Z = sud (origine = coin NO de la
## zone téléchargée ; voir data/reunion/LICENSES.md).
const SD_ROAD_START := Vector3(798.35, 8.774, -152.11)   # début de la rue (abscisse 0)
const SD_CAR_POS := Vector3(801.959, 10.05, -138.594)     # abscisse ~14 m
const SD_CAR_TANGENT_X := 0.2365
const SD_CAR_TANGENT_Z := 0.9716
const SD_MISSION_DEST := Vector3(1139.34, 38.731, 986.992) # ~1191 m plus loin sur la même rue

var provider: WorldDataProvider
var sector_manager: SectorManager
var player: PlayerController
var car: CarController
var cam: FollowCamera
var missions: MissionManager
var touch: TouchControls
var hud: Hud


func _ready() -> void:
	# --- Données du monde : réel (OpenStreetMap, Saint-Denis) si le secteur
	# existe, sinon le monde synthétique de secours (hors de la zone couverte).
	provider = CompositeProvider.new(RealDataProvider.new(), SyntheticProvider.new())
	_setup_environment()

	sector_manager = SectorManager.new()
	sector_manager.name = "SectorManager"
	add_child(sector_manager)
	sector_manager.setup(provider)
	if OS.has_feature("mobile"):
		sector_manager.view_radius = 1 # 3x3 secteurs visibles (25 gardés en mémoire) : budget mobile

	sector_manager.load_immediately(SD_ROAD_START, 1)

	# --- Voiture sur la route, orientée dans le sens de la route réelle
	car = CarController.new()
	car.name = "Car"
	add_child(car)
	var car_pos := SD_CAR_POS + Vector3(0, 1.0, 0)
	var tangent := Vector3(SD_CAR_TANGENT_X, 0.0, SD_CAR_TANGENT_Z)
	car.global_transform = Transform3D(Basis(Vector3.UP, atan2(tangent.x, tangent.z)), car_pos)

	# --- Joueur près de la voiture, à côté du cercle de départ de la mission
	player = PlayerController.new()
	player.name = "Player"
	add_child(player)
	var p0 := SD_ROAD_START
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
	var start := SD_ROAD_START
	m.giver_position = Vector3(start.x, 0.0, start.z + 8.0)
	var dest := SD_MISSION_DEST
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
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color("3d7fc9")
	sky_mat.sky_horizon_color = Color("bfd9e8")
	sky_mat.sky_curve = 0.14
	sky_mat.ground_bottom_color = Color("5a6a55")
	sky_mat.ground_horizon_color = Color("bfd9e8")
	sky_mat.sun_angle_max = 25.0
	sky_mat.sun_curve = 0.2
	sky.sky_material = sky_mat
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.7
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.fog_enabled = true
	env.fog_light_color = Color("b9d3e6")
	env.fog_density = 0.0016 if OS.has_feature("mobile") else 0.0009
	env.glow_enabled = true
	env.glow_intensity = 0.45
	env.glow_bloom = 0.05
	env.glow_hdr_threshold = 1.1
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, -30, 0)
	sun.light_energy = 1.05
	sun.light_color = Color("fff3de")
	sun.shadow_enabled = not OS.has_feature("mobile") # ombres coûteuses sur mobile
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	sun.directional_shadow_max_distance = 90.0
	add_child(sun)
