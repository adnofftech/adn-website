class_name SyntheticProvider
extends WorldDataProvider
## Monde SYNTHÉTIQUE de test : collines pseudo-aléatoires et une route sinueuse.
## Ce n'est PAS La Réunion et ne prétend pas l'être. Il sert à développer et
## tester le moteur de secteurs en attendant les données géographiques réelles.

const ROAD_STEP := 8.0
const ROAD_WIDTH := 9.0
const ROAD_FLAT_HALF := 14.0   # largeur aplanie de part et d'autre de l'axe
const ROAD_BLEND := 70.0       # distance où le relief naturel reprend le dessus
const SPAWN_CLEAR := 50.0      # pas de bâtiment à moins de 50 m du point d'apparition

var _noise := FastNoiseLite.new()


func _init() -> void:
	_noise.seed = 1337
	_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	_noise.frequency = 0.004


func get_info() -> Dictionary:
	return {
		"name": "Monde synthétique (non géographique)",
		"is_real_data": false,
		"license": "Généré par code, aucune donnée externe",
	}


static func road_z(x: float) -> float:
	return 60.0 * sin(x / 220.0)


static func road_y(x: float) -> float:
	return 10.0 + 5.0 * sin(x / 350.0)


func height_at(x: float, z: float) -> float:
	var natural := _noise.get_noise_2d(x, z) * 14.0 + 12.0
	var d := absf(z - road_z(x))
	var w := smoothstep(ROAD_FLAT_HALF, ROAD_BLEND, d)
	return lerpf(road_y(x), natural, w)


func get_road_point(s: float) -> Vector3:
	return Vector3(s, road_y(s), road_z(s))


func get_sector_data(coord: Vector2i) -> SectorData:
	var data := SectorData.new()
	data.coord = coord
	data.source = get_info()["name"]
	data.is_real_data = false
	var o := data.origin()
	data.heights.resize((SectorData.CELLS + 1) * (SectorData.CELLS + 1))
	for iz in SectorData.CELLS + 1:
		for ix in SectorData.CELLS + 1:
			data.heights[data.height_index(ix, iz)] = height_at(
				o.x + ix * SectorData.CELL_SIZE, o.z + iz * SectorData.CELL_SIZE)
	_add_roads(data)
	_add_buildings(data)
	return data


## Chaque segment de route appartient au secteur qui contient son milieu :
## pas de doublon, pas de trou entre secteurs voisins.
func _add_roads(data: SectorData) -> void:
	var o := data.origin()
	var first_i := floori(o.x / ROAD_STEP)
	var last_i := ceili((o.x + SectorData.SIZE) / ROAD_STEP)
	var run: PackedVector3Array = PackedVector3Array()
	var run_first := 0
	for i in range(first_i, last_i):
		var xa := i * ROAD_STEP
		var xb := (i + 1) * ROAD_STEP
		var mid := Vector2((xa + xb) * 0.5, (road_z(xa) + road_z(xb)) * 0.5)
		var owned := mid.x >= o.x and mid.x < o.x + SectorData.SIZE \
			and mid.y >= o.z and mid.y < o.z + SectorData.SIZE
		if owned:
			if run.is_empty():
				run_first = i
				run.append(get_road_point(xa))
			run.append(get_road_point(xb))
		elif not run.is_empty():
			data.roads.append({"points": run, "width": ROAD_WIDTH, "first_index": run_first})
			run = PackedVector3Array()
	if not run.is_empty():
		data.roads.append({"points": run, "width": ROAD_WIDTH, "first_index": run_first})


func _add_buildings(data: SectorData) -> void:
	var o := data.origin()
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(Vector2i(data.coord.x * 7919 + 13, data.coord.y * 104729 + 7))
	var x := o.x + rng.randf_range(10.0, 30.0)
	while x < o.x + SectorData.SIZE - 10.0:
		var side := -1.0 if rng.randf() < 0.5 else 1.0
		var dist := rng.randf_range(22.0, 38.0)
		var cx := x
		var cz := road_z(x) + side * dist
		var near_spawn := Vector2(cx, cz).distance_to(Vector2(0.0, road_z(0.0))) < SPAWN_CLEAR + 15.0
		if not near_spawn and cz > o.z + 12.0 and cz < o.z + SectorData.SIZE - 12.0:
			var size := Vector3(rng.randf_range(8.0, 15.0), rng.randf_range(5.0, 18.0), rng.randf_range(8.0, 15.0))
			var tangent := Vector2(1.0, (road_z(x + 1.0) - road_z(x - 1.0)) * 0.5)
			var yaw := atan2(-tangent.y, tangent.x) # aligne le bâtiment sur la route
			var base := minf(minf(height_at(cx - 6, cz - 6), height_at(cx + 6, cz - 6)),
				minf(height_at(cx - 6, cz + 6), height_at(cx + 6, cz + 6)))
			data.buildings.append({
				"position": Vector3(cx, base, cz), "size": size, "yaw": yaw,
				"color_id": rng.randi_range(0, 5),
			})
		x += rng.randf_range(34.0, 60.0)
