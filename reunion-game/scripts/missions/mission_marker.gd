class_name MissionMarker
extends Node3D
## Balise visuelle d'une mission : anneau au sol + faisceau lumineux visible de loin.
## Purement visuel (pas de collision) ; la détection est faite par MissionManager.

var _ring: MeshInstance3D
var _beam: MeshInstance3D
var _time := 0.0


func setup(color: Color, radius: float) -> void:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = Color(color.r, color.g, color.b, 0.35)
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	_ring = MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = radius
	cyl.bottom_radius = radius
	cyl.height = 0.5
	_ring.mesh = cyl
	_ring.material_override = mat
	_ring.position.y = 0.25
	add_child(_ring)
	_beam = MeshInstance3D.new()
	var beam := CylinderMesh.new()
	beam.top_radius = 0.6
	beam.bottom_radius = 0.6
	beam.height = 140.0
	_beam.mesh = beam
	var bmat := mat.duplicate() as StandardMaterial3D
	bmat.albedo_color = Color(color.r, color.g, color.b, 0.22)
	_beam.material_override = bmat
	_beam.position.y = 70.0
	add_child(_beam)


func _process(delta: float) -> void:
	_time += delta
	if _ring != null:
		_ring.scale = Vector3.ONE * (1.0 + 0.05 * sin(_time * 3.0))
