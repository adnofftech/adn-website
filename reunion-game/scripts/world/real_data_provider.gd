class_name RealDataProvider
extends WorldDataProvider
## Lit des secteurs pré-calculés par un outil hors-jeu (voir docs/DATA_PLAN.md) :
##   <dossier>/<cx>_<cz>.json
## {
##   "source": "RGE ALTI + OSM ...",
##   "heights": [ (33*33) altitudes en m ],
##   "roads": [ {"points": [[x,y,z],...], "width": 7.0, "first_index": 0} ],
##   "buildings": [ {"position": [x,y,z], "size": [w,h,d], "yaw": 0.0, "color_id": 0} ]
## }
## Les coordonnées sont des mètres dans un repère local (origine choisie par
## l'outil) ; l'outil doit documenter projection et origine dans le dossier.
## AUCUNE donnée réelle n'est incluse dans ce prototype.

var directory: String
var _name: String


func _init(dir: String = "res://data/reunion/sectors", label: String = "Données réelles La Réunion") -> void:
	directory = dir
	_name = label


func get_info() -> Dictionary:
	return {"name": _name, "is_real_data": true, "license": "Voir data/reunion/LICENSES.md"}


func _path(coord: Vector2i) -> String:
	return "%s/%d_%d.json" % [directory, coord.x, coord.y]


func has_sector(coord: Vector2i) -> bool:
	return FileAccess.file_exists(_path(coord))


func height_at(x: float, z: float) -> float:
	# Interpolation bilinéaire dans le secteur chargé (relecture simple, mise en cache à prévoir).
	var data := get_sector_data(WorldDataProvider.coord_for_position(Vector3(x, 0, z)))
	if data == null:
		return 0.0
	var o := data.origin()
	var fx := clampf((x - o.x) / SectorData.CELL_SIZE, 0.0, SectorData.CELLS - 0.001)
	var fz := clampf((z - o.z) / SectorData.CELL_SIZE, 0.0, SectorData.CELLS - 0.001)
	var ix := int(fx)
	var iz := int(fz)
	var tx := fx - ix
	var tz := fz - iz
	var h00 := data.get_height(ix, iz)
	var h10 := data.get_height(ix + 1, iz)
	var h01 := data.get_height(ix, iz + 1)
	var h11 := data.get_height(ix + 1, iz + 1)
	return lerpf(lerpf(h00, h10, tx), lerpf(h01, h11, tx), tz)


func get_sector_data(coord: Vector2i) -> SectorData:
	if not has_sector(coord):
		return null
	var text := FileAccess.get_file_as_string(_path(coord))
	var parsed: Variant = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_warning("Secteur illisible : %s" % _path(coord))
		return null
	return parse_sector(coord, parsed)


static func parse_sector(coord: Vector2i, d: Dictionary) -> SectorData:
	var data := SectorData.new()
	data.coord = coord
	data.source = str(d.get("source", "inconnu"))
	data.is_real_data = true
	data.heights = PackedFloat32Array(d.get("heights", []))
	if not data.is_valid():
		push_warning("Secteur %s : %d altitudes au lieu de %d" % [coord, data.heights.size(), (SectorData.CELLS + 1) * (SectorData.CELLS + 1)])
		return null
	for r in d.get("roads", []):
		var pts := PackedVector3Array()
		for p in r["points"]:
			pts.append(Vector3(p[0], p[1], p[2]))
		data.roads.append({"points": pts, "width": float(r.get("width", 7.0)), "first_index": int(r.get("first_index", 0))})
	for b in d.get("buildings", []):
		data.buildings.append({
			"position": Vector3(b["position"][0], b["position"][1], b["position"][2]),
			"size": Vector3(b["size"][0], b["size"][1], b["size"][2]),
			"yaw": float(b.get("yaw", 0.0)), "color_id": int(b.get("color_id", 0)),
		})
	return data
