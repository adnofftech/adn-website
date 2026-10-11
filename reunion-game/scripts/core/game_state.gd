extends Node
## Autoload "GameState" : état global minimal partagé entre les systèmes.
## Les systèmes communiquent par signaux pour rester découplés.

signal money_changed(amount: int)
signal mode_changed(in_vehicle: bool)
signal toast_requested(text: String)

var money: int = 0
var current_vehicle: Node3D = null
## Texte d'aide contextuel (ex. "Entrer dans la voiture"), vide si rien à faire.
var interact_hint: String = ""


func _ready() -> void:
	InputSetup.register()


func is_in_vehicle() -> bool:
	return current_vehicle != null


func add_money(amount: int) -> void:
	money += amount
	money_changed.emit(money)


func set_vehicle(vehicle: Node3D) -> void:
	current_vehicle = vehicle
	interact_hint = ""
	mode_changed.emit(vehicle != null)


func notify(text: String) -> void:
	toast_requested.emit(text)
