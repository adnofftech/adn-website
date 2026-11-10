# Rachid Shopp — système visuel

Document de référence du monde visuel construit (format impeccable `document`). Les valeurs vivent dans `style.css` (`:root`) ; ce fichier les explique.

## Direction
- **Monde** : vitrine « Professional Showcase » imposée par le dossier client : anthracite `#10141B`, panneaux `#1B222C`, texte blanc cassé `#F8F6F2`, accent bleu glacier `#9EE4FF` (univers iPhone), accent champagne `#F0C99C` (parfumerie, page Parfums uniquement via `.theme-perf`).
- **Scène d'usage** : un client de La Réunion sur son téléphone, souvent le soir, qui cherche un prix de réparation ou un parfum et prépare un message écrit. Le fond sombre vient du brief, pas de la catégorie.
- **Une seule rupture de rythme** : le bandeau inversé clair `.ground-inverse` (`#F8F6F2` / encre `#10141B`) sur la section « Commander » de l'accueil, qui porte le moment de motion.

## Tokens
| Rôle | Token | Valeur |
| --- | --- | --- |
| Fond / panneau | `--bg` / `--surface` | `#10141b` / `#1b222c` |
| Encre / atténué | `--ink` / `--muted` | `#f8f6f2` / `#a8adb6` (≥ 7:1 sur les deux fonds) |
| Filets | `--line` / `--line-strong` | encre à 12 % / 26 % |
| Action | `--action` / `--action-ink` | `#9ee4ff` / `#10141b` (champagne sur Parfums) |
| Inverse | `--inv-*` | fond `#f8f6f2`, surface `#e9e7e2`, encre `#10141b`, action = encre |
| Rayons | `--r-lg/md/sm/btn` | 20 / 12 / 8 / 10 px (`soft`) |
| Espacements | `--s-1 … --s-10` | 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 |
| Rythme | `--nav --padt --padb --gut` | 72 / 120 / 72 / 80 (56 / 96 / 48 / 24 sous 640 px) |

## Typographie
- Une seule famille auto-hébergée : **Archivo** variable (`fonts/archivo-latin.woff2`, axes largeur + graisse).
- Titres : graisse 500, largeur 110 %, interlettrage −0,025 em (−0,035 em pour le h1). Jamais de 700.
- Échelle : h1 `clamp(34px, 2.2vw + 26px, 60px)`, h2 `clamp(30px, 1.3vw + 22px, 44px)`, h3 20–24, lead 17–20, corps 16/1.6, petit 14, étiquette 13/500.
- Chiffres tabulaires sur les prix, les horaires et le tableau. `text-wrap: balance` sur les titres, `pretty` sur les paragraphes.

## Grille et sections
- `.wrap` : `min(100% − 2·gouttière, 1280px)` ; grille 12 colonnes, gouttière 24 (12 sous 640). Ligne de partage à la colonne 7 pour chaque split (texte à gauche, visuel à droite, jamais inversé).
- Chaque `main > section` vaut un ou deux écrans (`--h`), titre en haut, 120 px sous le haut. Les sections catalogue (`.grows`) sont les seules à suivre leur contenu.
- Hero « split » : h1 puis lead puis au plus deux boutons ; visuel à droite sur 6 colonnes, aussi haut que le premier écran ; sous 640 px, texte d'abord puis le visuel qui prend l'espace restant (≥ 240 px).
- Pied : clôture (h2 + ligne + action principale, photo sur l'accueil) puis annuaire sur fond un cran plus sombre.

## Composants
- Boutons : `.btn--primary` (plein accent) et `.btn--secondary` (contour) ; 44 px ; un seul bouton plein par vue pour l'action principale « Préparer ma demande ».
- Lignes réglées `.rows` pour les listes de services, d'étapes, d'horaires, de résultats et de tarifs (filet 1 px sous chaque ligne, valeur à droite).
- Cartes `.card` : panneau photo inséré de 8 px (coins emboîtés), titre 20/500, corps 16, bouton en pied aligné sur la rangée.
- Formulaire : étiquettes visibles 14/500, champs 48 px sur fond page, erreur sous le champ en `--error`, ligne de statut `role=status`.

## Motion
- Entrée du hero au chargement, une fois : h1 (700 ms), puis lead, boutons et formulaire (520 ms, 80 ms d'écart), le visuel se pose de 1,05 à 1 (1,1 s). Courbe `cubic-bezier(.22,1,.36,1)`.
- Couche hover (pointeur fin seulement) : bouton +1 px et fond 14 % vers l'encre, pression −1 px et 0,985, lien dont le soulignement s'encre, mot de nav souligné, carte liée soulevée de 2 px.
- Un seul moment : `picture-develops` sur la photographie de « Commander » (tirage gris qui prend ses noirs puis sa couleur, 1,6 s, une fois). Rien d'autre ne bouge au défilement.
- `prefers-reduced-motion` : plus d'entrée ni de moment, les couleurs changent encore.

## Surfaces navigateur
Sélection, curseur, `accent-color`, barre de défilement et anneau de focus (2 px accent, 2 px de retrait) prennent la palette.
