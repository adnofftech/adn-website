# Vidéo de présentation, La Terrasse de Bourbon

Projet HyperFrames (HTML + GSAP rendu en MP4), 36,5 s, 1920x1080, silencieux.

```bash
cd video
npx hyperframes check                      # vérification
npx hyperframes preview --background       # aperçu
npx hyperframes render --quality delivery --output renders/presentation-terrasse-de-bourbon.mp4
```

Prérequis : Node.js 22+ et FFmpeg. Textes et minutage dans `index.html` (une scène par section `#s1` à `#s7`).
Les captures du site (`assets/shots/`) se régénèrent avec `capture-shots.js` (site servi sur le port 8000).
