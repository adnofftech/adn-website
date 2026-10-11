class_name CompositeProvider
extends WorldDataProvider
## Utilise les données réelles quand un secteur existe, sinon le monde synthétique.
## Permet d'intégrer La Réunion secteur par secteur sans casser le prototype.

var real: RealDataProvider
var fallback: WorldDataProvider


func _init(real_provider: RealDataProvider, fallback_provider: WorldDataProvider) -> void:
	real = real_provider
	fallback = fallback_provider


func get_info() -> Dictionary:
	return {"name": "Composite (réel si disponible, sinon synthétique)", "is_real_data": false, "license": "mixte"}


func height_at(x: float, z: float) -> float:
	if real.has_sector(WorldDataProvider.coord_for_position(Vector3(x, 0, z))):
		return real.height_at(x, z)
	return fallback.height_at(x, z)


func get_road_point(s: float) -> Vector3:
	return fallback.get_road_point(s)


func get_sector_data(coord: Vector2i) -> SectorData:
	if real.has_sector(coord):
		var d := real.get_sector_data(coord)
		if d != null:
			return d
	return fallback.get_sector_data(coord)
