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

# Textures réelles (CC0, démo officielle Godot "Truck Town").
const GRASS_TEX: Texture2D = preload("res://assets/textures/grass.webp")
const CEMENT_TEX: Texture2D = preload("res://assets/textures/cement.webp")
# Arbre basse-poly (CC-BY-4.0, Ricardo Sanchez via Sketchfab — voir README).
const TREE_SCENE: PackedScene = preload("res://assets/tree/scene.gltf")
const TREES_PER_SECTOR := 9
const TREE_BUILDING_MARGIN := 7.0

static var _terrain_mat: StandardMaterial3D
static var _road_mat: StandardMaterial3D
static var _building_mats: Array[StandardMaterial3D] = []
static var _roof_mat: StandardMaterial3D
static var _window_tex: ImageTexture


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

	_scatter_trees(root, data, origin)
	return root


## Plante quelques arbres par secteur, à l'écart des bâtiments et de la route,
## avec une position/échelle/rotation déterministes (seed = coordonnées du secteur).
static func _scatter_trees(root: Node3D, data: SectorData, origin: Vector3) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(data.coord)
	for i in TREES_PER_SECTOR:
		var lx := rng.randf_range(8.0, SectorData.SIZE - 8.0)
		var lz := rng.randf_range(8.0, SectorData.SIZE - 8.0)
		var world := Vector3(origin.x + lx, 0.0, origin.z + lz)
		var too_close := false
		for b in data.buildings:
			if (Vector2(world.x, world.z) - Vector2(b["position"].x, b["position"].z)).length() < TREE_BUILDING_MARGIN:
				too_close = true
				break
		if too_close:
			continue
		var cell_x := int(lx / SectorData.CELL_SIZE)
		var cell_z := int(lz / SectorData.CELL_SIZE)
		cell_x = clampi(cell_x, 0, SectorData.CELLS)
		cell_z = clampi(cell_z, 0, SectorData.CELLS)
		var h := data.get_height(cell_x, cell_z)
		var tree := TREE_SCENE.instantiate()
		tree.position = Vector3(lx, h, lz)
		tree.rotation.y = rng.randf_range(0.0, TAU)
		var s := rng.randf_range(0.8, 1.4)
		tree.scale = Vector3.ONE * s
		root.add_child(tree)


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
	mi.gi_mode = GeometryInstance3D.GI_MODE_STATIC
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
	_window_tex = _build_window_texture()

	# Le sol garde ses teintes procédurales (herbe/roche/pente) tout en
	# recevant le détail de la vraie texture d'herbe, via mapping triplanaire
	# (pas besoin d'UV sur le maillage généré) multiplié par la couleur du sommet.
	_terrain_mat = StandardMaterial3D.new()
	_terrain_mat.vertex_color_use_as_albedo = true
	_terrain_mat.albedo_texture = GRASS_TEX
	_terrain_mat.uv1_triplanar = true
	_terrain_mat.uv1_world_triplanar = true
	_terrain_mat.uv1_scale = Vector3.ONE * 0.22
	_terrain_mat.roughness = 1.0

	_road_mat = StandardMaterial3D.new()
	_road_mat.vertex_color_use_as_albedo = true
	_road_mat.albedo_texture = CEMENT_TEX
	_road_mat.uv1_triplanar = true
	_road_mat.uv1_world_triplanar = true
	_road_mat.uv1_scale = Vector3.ONE * 0.6
	_road_mat.roughness = 0.9

	_roof_mat = StandardMaterial3D.new()
	_roof_mat.albedo_color = Color("5a4a44")
	_roof_mat.roughness = 0.85

	for c in BUILDING_COLORS:
		var m := StandardMaterial3D.new()
		m.albedo_color = c
		m.albedo_texture = _window_tex
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		m.uv1_scale = Vector3(0.6, 0.6, 0.6)
		m.roughness = 0.65
		_building_mats.append(m)


## Génère (en code, sans fichier externe) une texture de façade avec une
## grille de fenêtres, pour donner un peu de relief visuel aux bâtiments.
static func _build_window_texture() -> ImageTexture:
	var size := 64
	var img := Image.create(size, size, false, Image.FORMAT_RGB8)
	img.fill(Color(1.0, 1.0, 1.0))
	var cell := 16
	var margin := 3
	var iy := 0
	while iy < size:
		var ix := 0
		while ix < size:
			for y in range(margin, cell - margin):
				for x in range(margin, cell - margin):
					var px := ix + x
					var py := iy + y
					if px < size and py < size:
						img.set_pixel(px, py, Color(0.62, 0.74, 0.8))
			ix += cell
		iy += cell
	return ImageTexture.create_from_image(img)
