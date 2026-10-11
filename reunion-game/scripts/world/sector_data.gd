class_name SectorData
extends RefCounted
## Contenu d'un secteur du monde, indépendant de sa provenance
## (génération synthétique aujourd'hui, fichiers de données réelles demain).
##
## Repère : mètres, X = est, Y = altitude, Z = sud (convention Godot).
## Le secteur (cx, cz) couvre [cx*SIZE, (cx+1)*SIZE[ x [cz*SIZE, (cz+1)*SIZE[.

const CELLS := 32
const SIZE := 256.0
const CELL_SIZE := SIZE / CELLS

var coord: Vector2i = Vector2i.ZERO
## (CELLS+1)^2 altitudes en mètres, ordre ligne par ligne (Z puis X).
var heights: PackedFloat32Array = PackedFloat32Array()
## Routes : {"points": PackedVector3Array (monde), "width": float, "first_index": int}
var roads: Array[Dictionary] = []
## Bâtiments : {"position": Vector3 (centre au sol, monde), "size": Vector3, "yaw": float, "color_id": int}
var buildings: Array[Dictionary] = []
var source: String = "inconnu"
var is_real_data: bool = false


func origin() -> Vector3:
	return Vector3(coord.x * SIZE, 0.0, coord.y * SIZE)


func height_index(ix: int, iz: int) -> int:
	return iz * (CELLS + 1) + ix


func get_height(ix: int, iz: int) -> float:
	return heights[height_index(ix, iz)]


func is_valid() -> bool:
	return heights.size() == (CELLS + 1) * (CELLS + 1)
