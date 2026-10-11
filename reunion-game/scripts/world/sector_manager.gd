class_name SectorManager
extends Node3D
## Charge et décharge les secteurs autour du point d'intérêt (joueur ou véhicule
## conduit) ainsi qu'autour des "ancres" (véhicules garés) pour qu'ils ne
## tombent jamais dans le vide. Un secteur est construit au plus par frame.

signal sector_loaded(coord: Vector2i)
signal sector_unloaded(coord: Vector2i)

var provider: WorldDataProvider
var focus: Node3D
var anchors: Array[Node3D] = []
var view_radius := 2     # en secteurs (Chebyshev) autour du focus
var anchor_radius := 1
var unload_margin := 1   # hystérésis : évite charger/décharger en boucle

var sectors: Dictionary = {}   # Vector2i -> Node3D
var _queue: Array[Vector2i] = []
var _timer := 0.0


func setup(p: WorldDataProvider) -> void:
	provider = p


func loaded_count() -> int:
	return sectors.size()


func is_loaded(coord: Vector2i) -> bool:
	return sectors.has(coord)


## Charge tout de suite (bloquant) les secteurs autour d'une position.
func load_immediately(pos: Vector3, radius: int) -> void:
	var c := WorldDataProvider.coord_for_position(pos)
	for dz in range(-radius, radius + 1):
		for dx in range(-radius, radius + 1):
			_load_sector(c + Vector2i(dx, dz))


func _process(delta: float) -> void:
	_timer -= delta
	if _timer <= 0.0:
		_timer = 0.2
		_refresh()
	if not _queue.is_empty():
		_load_sector(_queue.pop_front())


func _wanted_set(radius_focus: int, radius_anchor: int) -> Dictionary:
	var wanted := {}
	var centers: Array = []
	if focus != null:
		centers.append([WorldDataProvider.coord_for_position(focus.global_position), radius_focus])
	for a in anchors:
		if is_instance_valid(a):
			centers.append([WorldDataProvider.coord_for_position(a.global_position), radius_anchor])
	for entry in centers:
		var c: Vector2i = entry[0]
		var r: int = entry[1]
		for dz in range(-r, r + 1):
			for dx in range(-r, r + 1):
				wanted[c + Vector2i(dx, dz)] = true
	return wanted


func _refresh() -> void:
	var wanted := _wanted_set(view_radius, anchor_radius)
	var keep := _wanted_set(view_radius + unload_margin, anchor_radius + unload_margin)
	# File d'attente triée : les secteurs les plus proches du focus d'abord.
	_queue.clear()
	var fc := WorldDataProvider.coord_for_position(focus.global_position) if focus != null else Vector2i.ZERO
	var missing: Array[Vector2i] = []
	for c in wanted.keys():
		if not sectors.has(c):
			missing.append(c)
	missing.sort_custom(func(a: Vector2i, b: Vector2i) -> bool:
		return (a - fc).length_squared() < (b - fc).length_squared())
	_queue = missing
	for c in sectors.keys():
		if not keep.has(c):
			_unload_sector(c)


func _load_sector(coord: Vector2i) -> void:
	if sectors.has(coord) or provider == null:
		return
	var data := provider.get_sector_data(coord)
	if data == null or not data.is_valid():
		return
	var node := SectorBuilder.build(data)
	add_child(node)
	sectors[coord] = node
	sector_loaded.emit(coord)


func _unload_sector(coord: Vector2i) -> void:
	var node: Node3D = sectors.get(coord)
	if node != null:
		node.queue_free()
	sectors.erase(coord)
	sector_unloaded.emit(coord)
