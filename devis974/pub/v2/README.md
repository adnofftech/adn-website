# Devis974 — publicité v2 « La grille » (124 BPM, 33 s)

Publicité montée sur le morceau fourni : **vraies vidéos filmées** (Pexels, Mixkit), **captures réelles** du site et de l'application Devis974 (serveur local, données de démonstration) et **motion design** codé. Aucune image ni vidéo générée par IA.

## Méthode (les deux dépôts, selon leurs capacités réelles)
- **tugrawork-creator/saas-motion-kit** : `pick_themes.py` → thème 084 Swiss Grid ; `BRIEF.md` et `STORYBOARD.md` au format du kit ; `variety_audit.py` (résultat : « no repetition found ») ; effets sonores `warm_sfx.py` ; réglage de loudness social (−14 LUFS, −1,5 dBTP). La construction HyperFrames du kit n'a pas été utilisée (skills HyperFrames non installées dans cette session).
- **howseen-ai/claude-motion-design** : moteur `seek(t)` déterministe en HTML, rendu image par image (Playwright), images vidéo pré-extraites, grille rythmique mesurée sur le morceau, planches de contrôle et détection de sauts d'image.

## Grille musicale
Montage préparé à **124 BPM** (temps 0,4839 s, mesure 1,935 s, phase 0,067 s), puis chaque temps recalé sur l'attaque réelle du morceau (`beats.json` : écart moyen 5,5 ms). `timeline.json` → `"sync": "beats"` (attaques mesurées) ou `"grid"` (grille théorique). Tous les temps du film sont exprimés en **numéros de temps** : changer de morceau à 124 BPM = régénérer `beats.json`.

## Modifier le film
- Textes, apparitions, puces, positions des appuis : `timeline.json`.
- Plans filmés (source, point d'entrée, durée) : `clips.json`, puis `./fetch_footage.sh`.
- Mise en page 9:16 / 16:9, transitions, cadrages : `film.html` (objets `LV` / `LH`).
- Aperçu : `python3 -m http.server 8791` puis `http://localhost:8791/film.html?f=v` (ou `?f=h`) ; Espace = lecture, ←/→ = image par image.
- Rendu : `node render.cjs chunk v 0 2 & node render.cjs chunk v 1 2` puis `node render.cjs encode v out/mix_sans_musique.wav sortie.mp4`.
- Son : `MUSIC=chemin/du/morceau.wav python3 audio.py` → `out/stems/{music,vo,sfx}.wav` + deux mixages.
- Montage externe : `out/devis974_v2_9x16.fcpxml` / `16x9.fcpxml` (Final Cut Pro, DaVinci Resolve) : image + 3 pistes audio + marqueurs de coupes et de mesures. Relier les médias au besoin.

## Ce qui n'est pas dans ce dossier
- Le **morceau fourni** (titre commercial, droits non vérifiés) et les MP4 qui le contiennent : livrés à part, non publiés ici.
- Les vidéos sources et leurs images extraites : à récupérer avec `fetch_footage.sh` (licences Pexels / Mixkit : pas de redistribution brute).

## Sources vidéo
Voir `clips.json` (liens Pexels / Mixkit). Les personnes filmées sont des figurants de banques d'images : aucune n'est présentée comme cliente ou utilisatrice de Devis974.
