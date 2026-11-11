# Système visuel « Le carnet de LArtiste »

Source unique : `src/styles/tokens.css`. Les composants n’emploient que les rôles sémantiques.

## Couleurs

| Rôle | Jeton | Valeur | Contraste vérifié |
|---|---|---|---|
| Fond principal | `--bg` | Noir encre `#0B0A0A` | |
| Surface secondaire | `--surface` | Charbon `#191616` | |
| Texte principal | `--fg` | Ivoire `#F5EFE7` | 17,3:1 sur noir, 15,7:1 sur charbon |
| Texte secondaire | `--fg-2` | Gris chaud `#BFB5B0` | 9,8:1 sur noir, 9:1 sur charbon |
| Accent (remplissages, filets, sélection) | `--accent` | Rouge encre `#A42634` | texte ivoire dessus : 6,3:1 |
| Accent en texte sur fond sombre | `--accent-text` | Rouge clair `#E36D78` | 6,3:1 sur noir, 5,8:1 sur charbon |
| Surface ivoire | `.paper` | Ivoire `#F5EFE7`, texte noir, accent rouge profond `#8A1F2B` (8:1) | |

Règle : le rouge encre `#A42634` n’est jamais utilisé comme couleur de texte sur fond sombre (2,7:1). Les textes rouges sur fond sombre prennent `--accent-text`. Les photographies ne reçoivent aucun filtre.

## Typographie

- Titres : **Cormorant Garamond** (variable 300–700, graisse 500 pour les titres, 600 pour la signature), secours Georgia ajusté (`size-adjust`).
- Textes, boutons, légendes, formulaires : **Instrument Sans** (variable 400–700), secours Arial ajusté.
- Polices auto-hébergées (`public/fonts`, sous-ensembles latin et latin étendu), `font-display: swap`, préchargement des deux fichiers principaux.
- Corps : `--t-body` 16 → 18 px fluide, interligne 1,55, mesure 62 ch. Titres fluides : h1 46 → 108 px, h2 34 → 60 px, h3 24 → 32 px. Minimum 13 px (folios).
- Signature de marque : « LArtiste.Ink » en Cormorant 600, le point en rouge clair. Les titres de section se terminent par un point rouge, même geste.

## Espacements et mise en page

- Échelle : 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px (`--s-1` … `--s-10`). Sections : `--section` 64 → 120 px. Gouttière `--gut` 16 → 64 px, largeur maximale 1200 px.
- Grille 12 colonnes sur grand écran ; une colonne sous 640 px, deux entre 640 et 1024 px pour la galerie.
- Filets 1 px (`--rule`, ivoire à 14 %) pour séparer sections, fiches et listes, comme les réglures d’un carnet. Rayons 2 px partout.
- Boutons 48 px de haut, plein (rouge) pour l’action principale, filet pour les secondaires ; une seule action pleine par écran.
- Surface ivoire réservée aux encarts fonctionnels : tarif et récapitulatif du message.

## Mouvement

| Usage | Durée | Courbe |
|---|---|---|
| Survol, pression, couleur | 140 ms | `ease` / `--ease-out` |
| Changement d’état, étape de formulaire, barre d’action | 200 ms | `--ease-out` `cubic-bezier(.23,1,.32,1)` |
| Ouverture de la visionneuse et du menu | 260 ms (fermeture 160 ms) | `--ease-out` |
| Entrée de l’accueil | 560 ms, décalages de 70 ms ; photo qui se pose en 900 ms | `--ease-out` |
| Zoom photo au survol (pointeur fin seulement) | 600 ms, échelle 1,03 | `--ease-out` |

Propriétés animées : `transform` et `opacity` uniquement (plus `background-size` pour le trait des liens de navigation). Survol limité à `(hover: hover) and (pointer: fine)`. Sous `prefers-reduced-motion: reduce` : pas d’entrée, pas de déplacement, transitions d’opacité et de couleur conservées, visionneuse et étapes immédiates.

## Accessibilité

Focus visible 2 px rouge clair décalé de 3 px ; lien d’évitement ; menu et visionneuse en `<dialog>` modal (Échap, retour du focus à l’élément d’origine, flèches pour naviguer entre les pièces) ; libellés visibles sur chaque champ, erreurs sous le champ et `role="status"` pour la copie ; cibles tactiles 44 px au moins ; aucun débordement horizontal vérifié de 320 à 1920 px.
