# MAIS POURQUOI — L'imprimante à billets

Projet Hyperframes (HTML + GSAP + Three.js), 1080×1920, 30 fps, 86 s.

## État
| Élément | État |
|---|---|
| Script vérifié (sources BCE / Banque de France) | fait — `docs/script.md` |
| Storyboard minuté | fait (provisoire) — `docs/storyboard.md` |
| Composition 3D + motion + titres + sous-titres | faite — `index.html` |
| Musique + sound design | générés localement (synthèse numpy) — `tools/make_audio.py` → `audio/*.wav` (ignorés par git, régénérables) |
| **Voix off Léo (ElevenLabs)** | **NON GÉNÉRÉE** — les outils ElevenLabs de synthèse vocale n'étaient pas disponibles dans la session ; aucune autre voix n'a été utilisée. La voix n'a pas pu être vérifiée dans le compte. |
| Export MP4 | voir `renders/` (brouillon sans voix) |

## Régénérer l'audio
    python3 tools/make_audio.py     # écrit audio/sfx.wav et audio/music.wav

## Ajouter la voix (Léo)
1. Générer la narration dans ElevenLabs avec la voix Léo à partir du texte de `docs/script.md`
   (ponctuation : « … » pour les pauses, phrases courtes), exporter `audio/voix-leo.mp3`.
2. `npx hyperframes transcribe audio/voix-leo.mp3` → temps mot à mot.
3. Mettre à jour `window.TIMING.PHRASES` (début/fin de chaque phrase) et, si les scènes bougent,
   `window.TIMING.S` / `FREEZE` dans `index.html` **et** `TIMING` dans `tools/make_audio.py`, puis relancer le script audio.
4. Ajouter dans `index.html`, à côté des autres `<audio>` :
   `<audio id="voice" src="audio/voix-leo.mp3" data-start="0" data-duration="86" data-track-index="1" data-volume="1"></audio>`
5. `npm run check` puis `npm run render`.
   Le mixage prévoit déjà une musique à 0,7 et des SFX à 0,9 sous la voix ; utiliser `/hyperframes-audio` pour un ducking précis.

## Commandes
    npm run dev      # prévisualisation Studio
    npm run check    # lint + layout + contraste
    npm run render   # export MP4

Les billets sont fictifs et stylisés (« BILLET », monogramme « MP ») : aucune reproduction de billet réel.
