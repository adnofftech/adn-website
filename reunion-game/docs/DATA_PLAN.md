# Plan d'intégration des données réelles et feuille de route

## État actuel
`SyntheticProvider` génère un monde de test. `RealDataProvider` sait déjà **lire** des secteurs
JSON (testé avec une fixture synthétique) et `CompositeProvider` bascule secteur par secteur
vers le réel quand un fichier existe. Il manque l'**outil de génération** de ces fichiers.

## Format de secteur (stable)
Secteur = carré de 256 m, grille d'altitudes 33×33 (pas de 8 m), routes en polylignes (m, repère local),
bâtiments en boîtes orientées. Voir `scripts/world/sector_data.gd` et `real_data_provider.gd`.
Le repère local (origine, axes) sera défini par l'outil à partir d'une projection métrique
(RGR92 / UTM 40 Sud, EPSG:2975, est la projection légale à La Réunion — à confirmer).

## Pipeline hors-jeu prévu (Python, gratuit)
1. Télécharger MNT + routes + bâtiments (voir `LICENSES.md`) → dossier `raw/` hors dépôt (gros fichiers).
2. Reprojeter en EPSG:2975 (GDAL/pyproj), choisir l'origine (ex. centre de l'île).
3. Échantillonner le MNT à 8 m par secteur (ou 4 m en ville) ; **raccorder les bords exactement**
   (même valeur sur les 33 sommets partagés — test existant : `pas de couture`).
4. Draper les routes sur le MNT, aplanir le terrain sous la chaussée (comme le fait le synthétique).
5. Écrire `sectors/<cx>_<cz>.json` (puis format binaire compact quand la taille le justifiera).
6. Valider : comparer des points de contrôle (altitudes de sommets connus, longueur de routes) et
   **ne parler d'exactitude géographique qu'après ce contrôle documenté**.

## Ordre de travail proposé
- **v0.2 — Réunion minimale (1 zone)** : outil de génération sur une zone de 3×3 km (ex. une ville côtière),
  `CompositeProvider` actif, bandeau « données réelles » mis à jour automatiquement, contrôle de précision.
- **v0.3 — Jouabilité** : carrefours et réseau routier navigable, PNJ piétons simples, circulation légère,
  vrais modèles (CC0), sons, menu pause/sauvegarde, minimap, mesures de performance sur 2-3 téléphones réels.
- **v0.4 — Île entière** : génération de tous les secteurs (~2 500 km² ≈ 38 000 secteurs de 256 m),
  paquets de données téléchargeables, LOD de terrain (secteurs lointains simplifiés), occlusion/culling.
- **v0.5 — Contenu** : missions via fichiers de données, système de recherche (police), météo, cycle jour/nuit.

## Risques identifiés
- Poids des données : l'île entière à 8 m ≈ 1 089 floats × 38 000 secteurs ≈ 165 Mo bruts → format compact + téléchargement.
- Relief très accidenté (cirques, remparts) : pentes que `VehicleBody3D` et le maillage à 8 m représentent mal ; prévoir 4 m + normales lissées.
- Performances mobiles inconnues : mesurer tôt (v0.3), pas à la fin.
- Licence ODbL (voir `LICENSES.md`).
