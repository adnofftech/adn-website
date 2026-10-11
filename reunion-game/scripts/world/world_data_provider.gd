class_name WorldDataProvider
extends RefCounted
## Interface commune à toutes les sources de données du monde.
## Le reste du jeu ne dépend QUE de cette interface : remplacer le monde
## synthétique par les données réelles de La Réunion ne touche ni le joueur,
## ni les véhicules, ni les missions.

const SECTOR_SIZE := SectorData.SIZE


func get_info() -> Dictionary:
	return {"name": "abstrait", "is_real_data": false, "license": ""}


## Altitude (m) en un point du monde.
func height_at(_x: float, _z: float) -> float:
	return 0.0


## Données d'un secteur ; null si le secteur n'existe pas.
func get_sector_data(_coord: Vector2i) -> SectorData:
	return null


## Point de la route principale de test à l'abscisse curviligne approchée `s` (m).
## Les données réelles remplaceront cela par une recherche dans le graphe routier.
func get_road_point(s: float) -> Vector3:
	return Vector3(s, height_at(s, 0.0), 0.0)


static func coord_for_position(p: Vector3) -> Vector2i:
	return Vector2i(floori(p.x / SECTOR_SIZE), floori(p.z / SECTOR_SIZE))
