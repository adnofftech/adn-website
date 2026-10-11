# Données réelles de La Réunion — Saint-Denis (centre)

`sectors/<cx>_<cz>.json` contient désormais un petit secteur réel autour du
centre de Saint-Denis (rues/bâtiments OpenStreetMap + altitude Open-Meteo),
lu par `RealDataProvider` (format décrit dans
`scripts/world/real_data_provider.gd`). Source, licence, date et projection :
voir `data/reunion/LICENSES.md`.

Partout ailleurs sur la carte, `CompositeProvider` retombe sur le monde
synthétique (`SyntheticProvider`) : il n'y a pas encore de donnée réelle pour
le reste de l'île. Voir `docs/DATA_PLAN.md` pour la suite (couvrir plus de
zones, vrai graphe de routes, imagerie satellite optionnelle).
