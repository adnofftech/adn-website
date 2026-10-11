# Architecture

```
reunion-game/
├── project.godot            Configuration (GL Compatibility, paysage, autoload GameState, souris→toucher)
├── icon.svg                 Icône (créée pour le projet)
├── README.md  LICENSES.md
├── scenes/main.tscn         Scène minimale : un Node3D avec scripts/main.gd
├── scripts/
│   ├── main.gd              Assemble le jeu (monde, joueur, voiture, caméra, missions, UI)
│   ├── core/
│   │   ├── game_state.gd    Autoload : argent, véhicule courant, aide contextuelle, signaux
│   │   └── input_setup.gd   Déclare les actions d'entrée (move_*, interact, handbrake) par code
│   ├── world/
│   │   ├── sector_data.gd           Contenu d'un secteur (altitudes, routes, bâtiments)
│   │   ├── world_data_provider.gd   Interface des sources de données
│   │   ├── synthetic_provider.gd    Monde synthétique de test (NON géographique)
│   │   ├── real_data_provider.gd    Lecteur de secteurs JSON réels (aucune donnée fournie)
│   │   ├── composite_provider.gd    Réel si disponible, sinon synthétique
│   │   ├── sector_builder.gd        SectorData -> maillages + collisions
│   │   └── sector_manager.gd        Chargement/déchargement des secteurs (focus + ancres)
│   ├── player/player_controller.gd  Personnage à pied (CharacterBody3D)
│   ├── vehicle/car_controller.gd    Voiture (VehicleBody3D)
│   ├── camera/follow_camera.gd      Caméra 3ᵉ personne (joueur ou voiture)
│   ├── missions/
│   │   ├── mission_def.gd           Données d'une mission (étapes, récompense)
│   │   ├── mission_manager.gd       Machine à états des missions
│   │   └── mission_marker.gd        Balise visuelle (anneau + faisceau)
│   └── ui/
│       ├── touch_controls.gd        Joystick, boutons, glisser caméra (multi-touch)
│       └── hud.gd                   Mission, boussole, argent, vitesse, messages
├── tests/                   run_tests.gd (+ test_runner.tscn), screenshot.gd (+ .tscn)
├── data/reunion/            Réservé aux données réelles (vide)
└── docs/                    ARCHITECTURE.md, DATA_PLAN.md
```

## Principes
- **Découplage par signaux et interfaces** : `WorldDataProvider` isole la source de données ;
  `GameState` expose des signaux (`mode_changed`, `money_changed`, `toast_requested`).
- **Entrées unifiées** : le tactile et le clavier écrivent les mêmes actions d'entrée ;
  joueur et voiture ne savent pas d'où vient l'ordre.
- **Secteurs** : 256 m, coordonnées locales au secteur (précision flottante). Un segment de route
  appartient à un seul secteur (pas de doublon ni de trou). Le focus (joueur/voiture conduite) charge
  `view_radius` ; chaque véhicule garé est une « ancre » qui garde son voisinage chargé ; décharge avec hystérésis.
- **Convention du véhicule** : l'avant est **+Z** (vérifié : `engine_force > 0` pousse vers +Z dans Godot 4.3).
- **Mobile** : GL Compatibility, ombres désactivées sur mobile, brouillard pour masquer l'apparition des secteurs,
  secteurs construits au plus un par frame, formes simples à faceting plat (couleurs de sommets, pas de textures).

## Résultats des tests (Godot 4.3.stable, headless)
Voir la commande dans le README. Couverture : cohérence des secteurs (coutures, déterminisme), orientation des
maillages, format de données réelles (aller-retour), pose sur le sol, marche, entrée/sortie, accélération,
direction gauche/droite, freinage, marche arrière, collision contre un mur, commandes tactiles (joystick, caméra,
multi-touch, boutons, tap), mission complète pilotée automatiquement sur 700 m, déchargement/chargement de secteurs.
