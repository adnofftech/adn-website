class_name SectorBuilder
extends RefCounted
## Transforme un SectorData en nœuds Godot (maillage + collisions).
## Le nœud racine est placé à l'origine du secteur : tout est local, ce qui
## préserve la précision flottante loin de l'origine du monde.

const BUILDING_COLORS: Array[Color] = [
	Color("e8d9b5"), Color("d9825b"), Color("f2c14e"),
	Color("8ec5b5"), Color("c9c9c9"), Color("e07a9a"),
]
const ROAD_LIFT := 0.08
const LAYER_WORLD := 1

static var _terrain_mat: StandardMaterial3D
static var _road_mat: StandardMaterial3D
static var _building_mats: Array[StandardMaterial3D] = []
static var _roof_mat: StandardMaterial3D


static func build(data: SectorData) -> Node3D:
	_ensure_materials()
	var root := Node3D.new()
	root.name = "Sector_%d_%d" % [data.coord.x, data.coord.y]
	var origin := data.origin()
	root.position = origin

	var terrain_mesh := build_terrain_mesh(data)
	var terrain := MeshInstance3D.new()
	terrain.name = "Terrain"
	terrain.mesh = terrain_mesh
	terrain.material_override = _terrain_mat
	root.add_child(terrain)

	var body := StaticBody3D.new()
	body.name = "TerrainBody"
	body.collision_layer = LAYER_WORLD
	body.collision_mask = 0
	var shape := CollisionShape3D.new()
	shape.shape = terrain_mesh.create_trimesh_shape()
	body.add_child(shape)
	root.add_child(body)

	if not data.roads.is_empty():
		var roads := MeshInstance3D.new()
		roads.name = "Roads"
		roads.mesh = build_road_mesh(data)
		roads.material_override = _road_mat
		root.add_child(roads)

	for i in data.buildings.size():
		root.add_child(_build_building(data.buildings[i], origin, i))
	return root


static func build_terrain_mesh(data: SectorData) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var cs := SectorData.CELL_SIZE
	for iz in SectorData.CELLS:
		for ix in SectorData.CELLS:
			var p00 := Vector3(ix * cs, data.get_height(ix, iz), iz * cs)
			var p10 := Vector3((ix + 1) * cs, data.get_height(ix + 1, iz), iz * cs)
			var p01 := Vector3(ix * cs, data.get_height(ix, iz + 1), (iz + 1) * cs)
			var p11 := Vector3((ix + 1) * cs, data.get_height(ix + 1, iz + 1), (iz + 1) * cs)
			var avg := (p00.y + p10.y + p01.y + p11.y) * 0.25
			var slope := absf(p10.y - p00.y) + absf(p01.y - p00.y)
			var col := Color("5f9f4a").lerp(Color("9a8a5a"), clampf((avg - 8.0) / 22.0, 0.0, 1.0))
			col = col.lerp(Color("6e6a5c"), clampf(slope / 14.0, 0.0, 0.6))
			var shade := 1.0 + float((ix * 7 + iz * 13) % 5 - 2) * 0.025
			col = Color(col.r * shade, col.g * shade, col.b * shade)
			for v in [p00, p10, p01, p10, p11, p01]:
				st.set_color(col)
				st.add_vertex(v)
	st.generate_normals()
	return st.commit()


static func build_road_mesh(data: SectorData) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var origin := data.origin()
	var asphalt := Color("2b2b30")
	var line := Color("e8dd8a")
	for road in data.roads:
		var pts: PackedVector3Array = road["points"]
		var hw: float = float(road["width"]) * 0.5
		var first_index: int = road["first_index"]
		for i in pts.size() - 1:
			var a := pts[i] - origin + Vector3(0, ROAD_LIFT, 0)
			var b := pts[i + 1] - origin + Vector3(0, ROAD_LIFT, 0)
			var dir := Vector3(b.x - a.x, 0.0, b.z - a.z).normalized()
			var side := dir.cross(Vector3.UP) # (0,0,1) pour dir=(1,0,0)
			_quad_up(st, a - side * hw, b - side * hw, b + side * hw, a + side * hw, asphalt)
			if (first_index + i) % 2 == 0: # ligne centrale en pointillés
				var lift := Vector3(0, 0.02, 0)
				_quad_up(st, a - side * 0.12 + lift, b - side * 0.12 + lift,
					b + side * 0.12 + lift, a + side * 0.12 + lift, line)
	return st.commit()


## Quad visible de dessus. Ordre (a_l, b_l, a_r) puis (b_l, b_r, a_r).
static func _quad_up(st: SurfaceTool, a_l: Vector3, b_l: Vector3, b_r: Vector3, a_r: Vector3, col: Color) -> void:
	for v in [a_l, b_l, a_r, b_l, b_r, a_r]:
		st.set_normal(Vector3.UP)
		st.set_color(col)
		st.add_vertex(v)


static func _build_building(b: Dictionary, origin: Vector3, index: int) -> Node3D:
	var size: Vector3 = b["size"]
	var sink := 1.5 # enfoui sous le sol pour absorber la pente
	var body := StaticBody3D.new()
	body.name = "Building_%d" % index
	body.collision_layer = LAYER_WORLD
	body.collision_mask = 0
	var pos: Vector3 = b["position"] - origin
	body.position = pos + Vector3(0, size.y * 0.5 - sink * 0.5, 0)
	body.rotation.y = b["yaw"]
	var full := Vector3(size.x, size.y + sink, size.z)
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = full
	mi.mesh = bm
	mi.material_override = _building_mats[int(b["color_id"]) % _building_mats.size()]
	body.add_child(mi)
	var roof := MeshInstance3D.new()
	var rm := BoxMesh.new()
	rm.size = Vector3(size.x + 0.8, 0.4, size.z + 0.8)
	roof.mesh = rm
	roof.position = Vector3(0, full.y * 0.5 + 0.2, 0)
	roof.material_override = _roof_mat
	body.add_child(roof)
	var cs := CollisionShape3D.new()
	var bs := BoxShape3D.new()
	bs.size = full
	cs.shape = bs
	body.add_child(cs)
	return body


static func _ensure_materials() -> void:
	if _terrain_mat != null:
		return
	_terrain_mat = StandardMaterial3D.new()
	_terrain_mat.vertex_color_use_as_albedo = true
	_terrain_mat.roughness = 1.0
	_road_mat = StandardMaterial3D.new()
	_road_mat.vertex_color_use_as_albedo = true
	_road_mat.roughness = 0.9
	_roof_mat = StandardMaterial3D.new()
	_roof_mat.albedo_color = Color("5a4a44")
	for c in BUILDING_COLORS:
		var m := StandardMaterial3D.new()
		m.albedo_color = c
		m.roughness = 0.9
		_building_mats.append(m)
