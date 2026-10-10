# MAIS POURQUOI — L'imprimante à billets (projet Hyperframes)

Vidéo verticale 1080×1920, 30 fps, ~69,5 s. Rendu final : `final/mais-pourquoi-imprimante-9x16.mp4`.

## Contenu
| Fichier | Rôle |
|---|---|
| `SCRIPT.md` | script final + sources vérifiées (Banque de France, BCE, art. 123 TFUE) |
| `STORYBOARD.md` | storyboard minuté phrase par phrase |
| `narration.txt` | texte exact envoyé à ElevenLabs |
| `audio/narration_leo.mp3` | narration générée (voix « Léo – Energetic & Engaging », 68,72 s) |
| `audio/word_timings.json` | timings mot à mot (transcription locale faster-whisper) |
| `scripts/make_sound.py` | génère `video/audio/bed.wav` (musique + SFX synthétisés + ducking sous la voix) |
| `scripts/make_captions.py` | aligne le texte du script sur les timings → `video/js/captions.js` |
| `video/` | projet Hyperframes (composition `index.html`, scènes 3D dans `video/js/`) |

## Modifier / refaire le rendu
```bash
cd video
npx hyperframes check                 # lint + runtime + layout + contraste
npx hyperframes preview --background  # Studio
npx hyperframes render --quality delivery --fps 30 --output ../final/mais-pourquoi-imprimante-9x16.mp4
```
Le rendu WebGL est logiciel (pas de GPU dans l'environnement d'origine) : compter de l'ordre de 0,5 à 2 s par image.

Régénérer le son : `python3 scripts/make_sound.py` (nécessite `numpy` et `ffmpeg`).
Régénérer les sous-titres : `python3 scripts/make_captions.py`.

## Scènes 3D (Three.js déterministe, piloté par `hf-seek`)
`printer.js` imprimante · `bills.js` billets/tas · `room.js` pièce et murs dépliables · `market.js` supermarché · `world.js` 6 secteurs + ville · `finance.js` monnaie moderne · `shots.js` pistes caméra · `main.js` assemblage et chronologie.
Aucune horloge ni aléa non seedé : une image dépend uniquement du temps.

## Notes
- Les billets sont génériques et fictifs (« BANQUE DE FICTION »).
- Polices : Archivo Black + Space Mono (embarquées par Hyperframes).
- `video/vendor/` : Three.js 0.181.2 et GSAP 3.14.2 vendorisés pour un rendu hors-ligne.
