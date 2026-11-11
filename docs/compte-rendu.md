# Compte rendu technique

## Point de départ

Le dépôt `adnofftech/adn-website` hébergeait une maquette d’un autre client (Ma Pause Beauté, HTML statique généré par un script Python, déployé à la racine par GitHub Pages). Aucun contenu LArtiste.Ink n’existait, et aucune pièce jointe (captures, photographies) n’était présente dans l’environnement. Les fichiers de l’ancienne maquette ont été retirés de la branche ; le workflow GitHub Pages a été adapté pour construire Astro. Le journal `.hallmark/log.json` du dépôt a été conservé et complété.

## Choix d’implémentation

- **Astro 7 + TypeScript**, sortie statique, CSS en variables sémantiques (`tokens.css`), JavaScript ciblé : menu, visionneuse, assistant, barre d’action. Images optimisées par `astro:assets` (WebP, plusieurs largeurs, espace réservé). Polices auto-hébergées.
- **Données centralisées** : `src/data/site.ts` (marque, liens, tarif, conditions, visibilité des rubriques, mentions), `src/content/realisations.json` (collection typée).
- **Amélioration progressive** : galerie en liens vers les images, formulaire complet visible sans script, `<dialog>` natif pour le menu et la visionneuse.
- **Médias** : en l’absence de photographies, textures d’encre procédurales (`scripts/make-textures.py`) comme emplacements réservés, étiquetés « Photo à fournir » et signalés dans la visionneuse. Elles ne représentent aucun tatouage.

## Skills : ce qui a été exécuté, lu, ou resté indisponible

| Dépôt | Installation | Exécuté | Lu et appliqué | Indisponible |
|---|---|---|---|---|
| UI UX Pro Max | Copie manuelle dans `.claude/skills/ui-ux-pro-max` (l’installeur `npx ui-ux-pro-max-cli init` a été refusé par la politique de l’environnement) | `search.py "tattoo portfolio dark editorial" --design-system`, recherches `--domain ux` (visionneuse, formulaire multi-étapes, navigation mobile), `--domain typography`, `--stack astro` | Règles reprises : contraste 4,5:1 des libellés de boutons, focus visible, action principale en haut et en bas, reduced-motion, retour d’état après action, historique du navigateur respecté, `<Image />` d’Astro | Le système proposé (Swiss minimal, accent bleu, Archivo + Space Grotesk, structure Hero + Features + CTA) n’a pas été retenu : le brief fixe la palette, les polices et le caractère éditorial |
| Taste (`design-taste-frontend`) | `npx skills add … --skill design-taste-frontend` | `copy-lint.mjs` sur les quatre pages (0 FAIL, 0 WARN) ; `assets/layout/check.mjs` à 1440 et 390 (aucun débordement, aucun bloc hors lignes) | Classement **service** (personne engagée, pas de lieu d’accueil public confirmé) ; références lues : SKILL, `layout-v4.md`, `system.md`, `motion.md` ; appliqués : lignes d’alignement communes, une action pleine par écran, 44 px de cible, zoom photo 1,03 au survol, entrée du premier écran, tableau des frais sans débordement | `gate.mjs` et `consistency.mjs` non lancés : ils vérifient le kit du skill (ses classes, ses heros « dealt », une section par écran). Les findings `screen-height` et `hero-fold` de `check.mjs` sont écartés : le brief demande des hauteurs dictées par le contenu |
| Hallmark | `npx skills add nutlope/hallmark` | `sloplint.mjs` sur `dist` (tier statique) | Direction **custom** depuis le brief (`direction.md`), `gates.md`, `craft.md`, `anatomy.md` (job « hire ») ; appliqués : aucun eyebrow ni capitales espacées, faits manquants en blancs à remplir (`.a-completer`), pas de métrique inventée, `overflow-x: clip`, `:focus-visible` instantané, 80 mots par écran environ, apostrophes typographiques, `<img>` toujours sourcées | Tier `--render` indisponible (`puppeteer-core` absent). Les FAIL « stamp Hallmark », « pas de :focus-visible », « pas d’overflow-x: clip », « pas de text-wrap: balance » viennent du fait que sloplint ne lit pas la feuille de style externe : ces règles sont bien dans `global.css`. Le stamp est une convention propre à Hallmark, non reprise |
| Emil Kowalski | Lu depuis le clone (`emil-design-eng`, `animate`, `review-animations`, `STANDARDS.md`) | Revue d’animations faite à la main sur le code final (voir ci-dessous) | Courbes `cubic-bezier(.23,1,.32,1)` et `(.77,0,.175,1)`, transform/opacity seulement, aucune `transition: all`, entrées depuis `scale(.98)` / 10 px, survol limité au pointeur fin, transitions (interruptibles) plutôt que keyframes pour les états, reduced-motion « plus doux, pas zéro » | `npx skills add emilkowalski/skills` non exécuté (installation équivalente par la lecture du clone) |
| Impeccable | `npx impeccable install --providers=claude --scope=project` (hook de détection installé dans `.claude/settings.local.json`) | `impeccable context`, `detect src/`, `detect` sur les quatre pages rendues ; exception `overused-font` enregistrée pour Instrument Sans (police du brief) | `init` : `PRODUCT.md` rédigé depuis le brief (les questions de cadrage y sont déjà répondues) ; `craft-floor.md` et `audit.md` appliqués (contraste, états, mesure, curseur de sélection, surfaces du navigateur) ; `document` : `DESIGN.md` | `/impeccable critique`, `adapt`, `harden`, `polish` sont des playbooks à dérouler en session : passés à la main sur l’accueil, le formulaire mobile et la visionneuse (corrections ci-dessous) ; mode `live` non lancé |

## Corrections issues des revues

- Espacement : le filet supérieur des sections touchait le titre (`detect` : `cramped-padding`). Corrigé.
- Visionneuse mobile : l’image débordait sur la fiche (hauteur forcée) ; titre tronqué par des points de suspension. Corrigé (lignes automatiques, titre sur deux lignes).
- Formulaire : bordure par défaut du `fieldset` « Encre souhaitée » ; encadré de référence affiché à vide ; point rouge décalé dans les légendes. Corrigé.
- Mobile : surbrillance bleue au toucher retirée ; ordre du premier écran : titre, texte, actions, visuel, fiche.
- Hallmark F1 : apostrophes droites remplacées par des apostrophes typographiques dans les données.
- Revue d’animations (grille Emil Kowalski) : menu 260 ms avec décalage de 40 ms par ligne, visionneuse 260 ms / fermeture 160 ms, étapes 200 ms, survol 140 ms, zoom photo 600 ms à 1,03 pour pointeur fin, entrée de l’accueil 560 ms en décalé. Aucune animation sur action clavier répétée (Échap et flèches ferment ou changent sans délai supplémentaire). Reduced-motion : opacité et couleur conservées, déplacements supprimés, fermeture immédiate.

## Arbitrages avec les recommandations génériques

1. **Palette et polices** : le brief l’emporte sur UI UX Pro Max (bleu, Archivo) et sur l’avertissement « police trop vue » d’Impeccable (Instrument Sans).
2. **Une section par écran** (Taste) : non appliqué, les hauteurs suivent le contenu comme demandé.
3. **Point rouge dans les titres** : Hallmark proscrit « un mot coloré dans un titre » ; ici c’est la ponctuation finale, signature issue du point de « LArtiste.Ink », appliquée uniformément.
4. **Numéros d’étapes et folios** : séquences réelles (étapes du parcours, numéro de référence cité dans le message), donc conservés malgré la règle « pas de numéros de section ».
5. **Nombre de photos** (Taste : 12 à 20) : la galerie suit le volume réel (4 emplacements), avec filtres masqués sous 6 pièces.
6. **Coordonnées** : Taste veut des contacts en `.example` ; le brief fournit les liens réels Instagram et TikTok, utilisés tels quels.

## Vérifications effectuées

| Contrôle | Résultat |
|---|---|
| `npm run check` | 0 erreur, 0 avertissement |
| `npm run build` | 7 pages, 31 images WebP générées |
| `npm test` (Playwright, Pixel 7 tactile, 1440 clavier, reduced-motion, 320×560) | 54/54 scénarios, dont les 15 du brief |
| `node tests/shots.mjs` | 36 captures (6 pages × 6 largeurs), aucune erreur console, aucun débordement horizontal |
| Contrastes | calculés pour chaque combinaison utilisée (voir `docs/design-system.md`) |
| Hallmark `sloplint` statique | 0 FAIL réel après correction des apostrophes et des images vides (restent les faux positifs liés à la feuille externe et le stamp) |
| Impeccable `detect` (rendu) | 0 anti-pattern sur les quatre pages après correction |
| Taste `copy-lint` | 0 FAIL, 0 WARN |
| Taste `check.mjs` | aucun débordement ni bloc hors lignes ; findings de hauteur d’écran écartés (voir arbitrage 2) |

## Non vérifié, et pourquoi

- Lien `https://ig.me/m/lartiste.ink` : connexion refusée par le réseau de l’environnement. À tester sur téléphone.
- Affichage avec clavier virtuel ouvert : non simulable en navigateur headless ; une capture à 320×560 avec le champ actif a été faite (`tests/shots/e2e/petit-ecran-formulaire.png`). La page Mon projet n’a pas de barre fixe, donc rien ne peut recouvrir le champ.
- Rendu avec de vraies photographies : impossible sans les fichiers ; la chaîne image (optimisation, recadrage, gros plan) est testée avec les textures.
- Hallmark `--render`, Taste `gate.mjs`/`consistency.mjs`, Impeccable `live` : voir tableau des skills.
