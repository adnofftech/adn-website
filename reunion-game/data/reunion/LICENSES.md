# Licences des données réelles (Saint-Denis)

Les fichiers de `sectors/*.json` sont dérivés de deux sources ouvertes,
téléchargées le 11 octobre 2026 pour une zone du centre de Saint-Denis
(La Réunion) : `-20.8854, 55.4422` → `-20.8746, 55.4538` (sud, ouest, nord, est).

## Tracé des rues et bâtiments : OpenStreetMap

- Source : [OpenStreetMap](https://www.openstreetmap.org/copyright), via
  l'instance Overpass `overpass.openstreetmap.fr`.
- Licence : **ODbL** (Open Database License) — © les contributeurs
  d'OpenStreetMap. Toute redistribution de ces données (ou d'un travail
  dérivé substantiel) doit conserver cette attribution et rester sous une
  licence compatible ODbL (« partage à l'identique » sur la base de données).
- Les formes exactes des bâtiments ont été simplifiées en boîtes
  rectangulaires (le moteur actuel ne gère que des bâtiments en boîte) ;
  seules la position, l'emprise et la hauteur approximative (déduite de
  `building:levels`/`height` quand disponible) sont conservées.

## Altitude du terrain : Open-Meteo

- Source : [Open-Meteo Elevation API](https://open-meteo.com) (API ouverte,
  basée sur des modèles numériques de terrain publics type Copernicus DEM).
- Une partie de la grille (~66 %) a été obtenue avant d'atteindre la limite
  horaire gratuite de l'API ; le reste a été comblé par interpolation des
  points voisins connus (pas une mesure réelle à cet endroit précis — à
  compléter dans une prochaine passe).

## Ce que ce prototype n'inclut PAS

Pas d'imagerie satellite / orthophoto (texture du sol toujours générée par
code, voir `## Crédits graphiques` du README). Pas de graphe de routes
utilisable pour la navigation (une seule rue réelle est utilisée comme axe
de la mission, voir `scripts/main.gd`, constantes `SD_*`).
