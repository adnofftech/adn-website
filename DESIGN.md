# Design

Système visuel « Le carnet de LArtiste » : voir [`docs/design-system.md`](docs/design-system.md) pour les jetons, la typographie, les espacements, le mouvement et l’accessibilité. Source de vérité : `src/styles/tokens.css` et `src/styles/global.css`.

Décisions durables :
- Fond noir encre, texte ivoire, rouge encre réservé aux remplissages et repères ; rouge clair pour tout texte rouge sur fond sombre.
- Cormorant Garamond (titres, graisse 500, point final rouge) et Instrument Sans (tout le reste). Deux familles, pas de troisième.
- Filets 1 px et folios « N° 01 » comme vocabulaire du carnet ; rayons 2 px ; une surface ivoire par fonction (tarif, récapitulatif).
- Mouvement : transform et opacity, 140 à 260 ms, entrée de l’accueil à 560 ms ; survol réservé au pointeur fin ; tout reste lisible sans mouvement.
