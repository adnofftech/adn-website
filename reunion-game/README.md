# GTA Réunion Mobile — prototype jouable (v0.1)

Prototype de monde ouvert 3D pour mobile (Godot 4, GDScript, rendu *GL Compatibility*).
La carte finale doit reproduire La Réunion ; **ce prototype utilise un monde synthétique
(collines + route sinueuse) qui ne représente PAS La Réunion**. Un bandeau en bas de
l'écran le rappelle en permanence. Aucune donnée géographique réelle n'est incluse.

## Ce qui est jouable

- Personnage à la 3ᵉ personne (marche, orientation selon la caméra).
- Voiture (accélération, freinage, marche arrière, direction, frein à main, collisions, remise sur roues).
- Entrer / sortir de la voiture (bouton **ACTION** / **SORTIR**, touche **E**).
- Caméra qui suit le joueur ou la voiture ; glisser un doigt pour l'orienter.
- Commandes tactiles multi-touch (joystick flottant + boutons) ; clavier/souris en secours sur PC.
- Mission « Première livraison » : cercle vert (départ) → monter dans la voiture → conduire
  jusqu'à la balise orange (~700 m) → récompense de 500 €. HUD avec objectif, distance, boussole.
- Monde découpé en secteurs de 256 m chargés/déchargés autour du joueur ou du véhicule.

## Lancer le prototype

1. Installer **Godot 4.3 ou plus récent** (version « standard », GDScript) : <https://godotengine.org/download>.
   Vérifié uniquement avec Godot 4.3.stable.
2. Ouvrir Godot → *Import* → sélectionner `reunion-game/project.godot` (premier import : quelques secondes).
3. Appuyer sur **F5**.

| Action | Tactile | Clavier (physique : ZQSD sur AZERTY) |
|---|---|---|
| Marcher / diriger la voiture | joystick à gauche | WASD / flèches |
| Accélérer / freiner-reculer | boutons GAZ / FREIN | W / S |
| Frein à main | bouton F.MAIN | Espace |
| Entrer / sortir | bouton ACTION / SORTIR | E, F ou Entrée |
| Orienter la caméra | glisser sur la moitié droite | clic gauche + glisser |

Astuce : sur PC, la souris est convertie en toucher (réglage `emulate_touch_from_mouse`),
donc les boutons à l'écran se cliquent aussi.

## Tests automatiques

```bash
godot --headless --path . --import                       # une seule fois sur un clone neuf
godot --headless --path . res://tests/test_runner.tscn   # tout (~2 min)
godot --headless --path . res://tests/test_runner.tscn -- physics   # data | physics | touch | mission
```
Les messages `mesh_get_surface_count ... is null` sont un bruit connu du rendu « dummy » de Godot
en headless ; ils sont sans effet. Résultats du dernier passage : voir « État vérifié » ci-dessous.

Captures d'écran réelles (rendu logiciel Mesa) :
`xvfb-run -a -s "-screen 0 1280x720x24" godot --path . --rendering-driver opengl3 res://tests/screenshot.tscn -- ./captures`

## Tester sur Android (manuel : non vérifié dans l'environnement de développement)

Il n'y avait ni SDK Android ni téléphone ici : **l'export Android n'a pas été testé.**
Étapes à suivre sur votre machine :

1. Installer **JDK 17** et le **SDK Android** (Android Studio, ou seulement les *command-line tools*) avec :
   platform-tools, build-tools 34.0.0, platform android-34, NDK 23.2.8568313, CMake 3.10.2
   (versions indiquées par la doc Godot 4.3 : vérifier <https://docs.godotengine.org/en/4.3/tutorials/export/exporting_for_android.html>).
2. Godot → *Éditeur › Gérer les modèles d'exportation* → télécharger les modèles de la même version que l'éditeur.
3. *Éditeur › Paramètres de l'éditeur › Export › Android* : renseigner le chemin du SDK Android, du JDK et du keystore de debug
   (créable avec `keytool -keyalg RSA -genkeypair -alias androiddebugkey -keypass android -keystore debug.keystore -storepass android -dname "CN=Android Debug,O=Android,C=US" -validity 9999 -deststoretype pkcs12`).
4. *Projet › Exporter… › Ajouter… › Android*. Dans les options : laisser *Gradle Build* désactivé (inutile pour ce prototype) ;
   fixer un identifiant unique (ex. `com.exemple.gtareunion`) ; architecture `arm64-v8a` cochée.
5. Téléphone : activer les options développeur + **débogage USB**, brancher en USB, accepter l'empreinte RSA.
   Un bouton « Android » (déploiement en un clic) apparaît en haut à droite de l'éditeur : l'appuyer installe et lance le jeu.
6. Régler au besoin : l'orientation est déjà *paysage* ; les ombres sont désactivées automatiquement sur mobile
   et le rayon de chargement est réduit (3×3 secteurs).

iOS : nécessite un Mac avec Xcode et un compte Apple Developer (gratuit pour tester sur son propre appareil,
payant pour publier). Non traité dans cette version.

## Limites connues

- Monde **synthétique** : aucune donnée réelle de La Réunion (voir `docs/DATA_PLAN.md`).
- Rendu non testé sur GPU de téléphone ; performances mobiles **non mesurées** (budget visé : < 60 000 triangles visibles).
- Voiture : un seul modèle, pas de dégâts, pas de son. Pas de PNJ, ni circulation, ni police, ni armes.
- Physique : `VehicleBody3D` de Godot 4.3 (Godot Physics). La conduite est « arcade » ; à régler au ressenti.
- Les scènes sont construites par code (plus facile à tester et à versionner) ; pas encore de scènes `.tscn` éditables par véhicule/personnage.
- Le bloc de routes dessine des rubans par segments (pas de carrefours, pas de ponts, pas de tunnels).
- Pas de sauvegarde, pas de menu, pas de pause.
- Le dépôt parent publie tout son contenu via GitHub Pages (`.github/workflows/static.yml`, chemin `.`) :
  ce dossier serait donc servi comme fichiers statiques si cette branche est fusionnée dans `main`.
  Si ce n'est pas souhaité, déplacer le projet dans son propre dépôt.

## État vérifié (Godot 4.3.stable, Linux, headless + Mesa)

Voir la section « Résultats des tests » en fin de `docs/ARCHITECTURE.md`.

## Prochaine version (v0.2)

Voir `docs/DATA_PLAN.md` (feuille de route détaillée).

## Crédits graphiques

Les formes générées par code ont été remplacées par de vrais modèles et textures
basse-poly, repris des démos officielles Godot (dossier `assets/`) :

- Modèle de voiture (monospace) et de roue : [Godot Engine demo projects — *Truck Town*](https://github.com/godotengine/godot-demo-projects/tree/master/3d/truck_town) (licence MIT).
- Texture d'herbe et de ciment : même projet (licence MIT).
- Arbre basse-poly : [« tree low-poly »](https://sketchfab.com/3d-models/tree-low-poly-4cd243eb74c74b3ea2190ebcec0439fb)
  par Ricardo Sanchez, via le projet Truck Town — licence **CC-BY-4.0** (attribution requise si redistribué).

Les fenêtres des bâtiments sont une texture générée par code (pas de fichier externe).
