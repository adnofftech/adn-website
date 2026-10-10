# MAIS POURQUOI ? — « Et si on redistribuait tout ? » (9:16, 84 s)

Vidéo verticale 1080 × 1920, 30 i/s, 83,97 s, voix de Léo (ElevenLabs), motion design 3D (Three.js dans Hyperframes), sous-titres karaoké, sound design synthétisé.

## Fichiers livrés
* `final/mais-pourquoi-milliardaires-leger.mp4` — version prête à poster (H.264 ≈ 2,7 Mb/s, AAC, ≈ 28 Mo).
* `final/mais-pourquoi-milliardaires-complet.mp4` — rendu pleine qualité (≈ 205 Mo, non versionné : trop lourd pour GitHub). Régénérable avec la commande ci-dessous.

## Régénérer
```bash
cd video
npx --yes hyperframes@0.8.143 render --quality delivery --fps 30 --output ../final/mais-pourquoi-milliardaires-complet.mp4
# puis remplacer l'audio par le mix final (voix ×2 + musique/effets ×0,75, +3 dB, limiteur) :
python3 ../scripts/make_sound.py   # -> audio/final_mix.wav
```

## Contenu du dossier
* `script.txt` — script définitif (jamais modifié) ; `timing.json` — début/fin de chaque mot (faster-whisper sur la narration).
* `DIRECTIVE.md` — cahier des charges du client, scène par scène ; `FACTS.md` — seuls chiffres affichés, avec leur source (Forbes, Banque mondiale, Altrata, BCE) ; `CONTRACT.md` — contrat technique des modules 3D.
* `video/` — composition Hyperframes (`index.html` : titres cinétiques, sous-titres, flashs ; `js/scenes/*.js` : 18 scènes 3D en 6 modules).
* `research/` — vérification des chiffres, rapports de contrôle qualité (`qc_results.json`) et listes de corrections (`fixlist_*.json`).
* `qc/`, `qc2/` — captures de contrôle de la composition (avant / après corrections).

## Ce qui a été contrôlé (et ce qui ne l'a pas été)
* Contrôle qualité indépendant par 6 relecteurs (3 scènes chacun) sur captures de la vraie composition, puis corrections module par module, chacune vérifiée sur capture ; 55 captures de la composition revues après corrections ; `hyperframes check` : 0 erreur, contraste AA sur 38/38 textes.
* Sur le MP4 final : 1080 × 1920, 30 i/s, 2519 images, durée 83,97 s ; aucune image noire ni figée détectée ; une image toutes les 3 s revue ; niveaux audio mesurés (≈ −16,8 LUFS, crête −3,8 dB).
* Non fait : visionnage continu du film en temps réel et écoute du son (mesures et captures seulement).
