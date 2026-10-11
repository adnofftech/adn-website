class_name MissionDef
extends RefCounted
## Description d'une mission : un point de départ, des étapes, une récompense.
## Les missions sont des données : en ajouter ne demande aucun nouveau code.

enum StepType { ENTER_VEHICLE, REACH_IN_VEHICLE, REACH_ON_FOOT }

var id := ""
var title := ""
var briefing := ""
var giver_position := Vector3.ZERO
var reward_money := 0
## Chaque étape : {"type": StepType, "text": String, "position": Vector3, "radius": float}
var steps: Array[Dictionary] = []


func add_step(type: StepType, text: String, position := Vector3.ZERO, radius := 6.0) -> MissionDef:
	steps.append({"type": type, "text": text, "position": position, "radius": radius})
	return self
