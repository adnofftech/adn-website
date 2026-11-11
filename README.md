# LArtiste.Ink — site vitrine

Site de **LArtiste.Ink**, tatoueur à Saint-Paul, La Réunion. Concept : « Le carnet de LArtiste », un carnet de travail transformé en galerie numérique. Fond noir encre, ivoire, accents rouges, grands caractères Cormorant Garamond.

Le site permet au visiteur de découvrir l’univers, d’examiner les tatouages « à la loupe » (vue d’ensemble puis détail) et de préparer un message complet à coller dans Instagram, où l’artiste confirme le projet, le tarif et le créneau.

> **État : version de présentation.** Les textures d’encre tiennent lieu de photographies, les mentions légales sont à compléter, l’indexation est désactivée. Voir [`docs/a-completer.md`](docs/a-completer.md).

## Démarrer

Node 22 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # génère dist/
npm run preview    # sert dist/ (un seul serveur d’aperçu à la fois avec Astro 7)
npm run check      # vérification TypeScript / Astro
npm test           # construit le site puis joue les parcours (Playwright préinstallé ; sinon : npm i -D playwright)
node tests/shots.mjs   # captures de toutes les pages à 360, 390, 768, 1024, 1440 et 1920 px (serveur d’aperçu lancé)
```

Variables d’environnement au build :

| Variable | Rôle | Défaut |
|---|---|---|
| `SITE_URL` | Domaine public (canoniques, image de partage) | `https://lartiste-ink.example` |
| `BASE_PATH` | Sous-dossier de déploiement (GitHub Pages en projet : `/adn-website`) | `/` |
| `PREVIEW` | `true` : `noindex`, `robots.txt` bloquant et mention « version de présentation » dans le pied de page | `true` |

Le workflow `.github/workflows/static.yml` construit et déploie `dist/` sur GitHub Pages à chaque push sur `main`, avec `BASE_PATH=/<nom du dépôt>` et `PREVIEW=true`. Pour la mise en ligne définitive : domaine dans `SITE_URL`, `BASE_PATH` vide, `PREVIEW=false`, et remplacer `public/robots.txt`.

## Arborescence

| Page | Chemin | Fichier |
|---|---|---|
| Accueil | `/` | `src/pages/index.astro` |
| Réalisations | `/realisations` | `src/pages/realisations.astro` |
| Infos pratiques | `/infos` | `src/pages/infos.astro` |
| Mon projet | `/projet` | `src/pages/projet.astro` (assistant dans `src/components/Assistant.astro`) |
| Mentions légales | `/mentions-legales` | `src/pages/mentions-legales.astro` |
| Confidentialité | `/confidentialite` | `src/pages/confidentialite.astro` |

Composants : `Header` (navigation et menu mobile), `Footer`, `ActionBar` (bouton fixe mobile), `Signature` (logo typographique), `Planche` (image d’une réalisation ou texture d’attente), `Galerie` (grille et filtres), `Loupe` (visionneuse), `Assistant` (préparation du message). Le texte du message est construit par `src/lib/message.js`, partagé avec les tests.

## Modifier les contenus

- **Textes factuels, liens, tarif, conditions, visibilité des rubriques** : `src/data/site.ts`. Par exemple `conditions.domicile.visible` masque la rubrique « À domicile et déplacements » ; `tarif.aPartirDe` change le prix affiché ; `mentions.*` remplit les mentions légales.
- **Réalisations** : `src/content/realisations.json`. Une entrée par pièce (modèle dans `src/content.config.ts`) :

  ```json
  {
    "id": "hibiscus-prenom",
    "titre": "Hibiscus et prénom",
    "categorie": "floral",
    "alt": "Hibiscus à l’encre noire avec un prénom en lettrage fin, sur l’avant-bras.",
    "motif": "Hibiscus et lettrage",
    "zone": "Avant-bras",
    "encres": ["noire"],
    "image": "../assets/realisations/hibiscus-prenom.jpg",
    "detail": "../assets/realisations/hibiscus-prenom-detail.jpg",
    "cadrage": { "x": 50, "y": 40 },
    "placeholder": false,
    "publication": { "autorisee": true, "source": "Photo originale fournie par l’artiste le 2026-11-20" },
    "accueil": true,
    "ordre": 1
  }
  ```

  Déposer les photos dans `src/assets/realisations/` (JPEG ou PNG, 1200 px de large au moins, format portrait 4:5 de préférence). `detail` est facultatif : sans gros plan, la visionneuse propose un recadrage agrandi de l’image principale centré sur `cadrage`. `placeholder: false` retire l’étiquette « Photo à fournir ». Les filtres de catégorie apparaissent à partir de 6 pièces (`galerie.filtresAPartirDe`).
- **Visuel du premier écran** : la première pièce marquée `accueil: true` (ordre croissant).
- **Textes des pages** : directement dans `src/pages/*.astro`, rédigés à la première personne.
- **Couleurs, polices, espacements, mouvement** : `src/styles/tokens.css` (voir [`docs/design-system.md`](docs/design-system.md)).
- **Image de partage et icône** : `node scripts/og.mjs` régénère `public/og.png` et `public/apple-touch-icon.png`.
- **Textures d’attente** : `python3 scripts/make-textures.py` (NumPy et Pillow).

## Fonctionnement de l’assistant « Mon projet »

Trois étapes dans un seul formulaire ; sans JavaScript, tout le formulaire reste visible avec la liste des informations à envoyer et le lien Instagram. Rien n’est transmis par le site : le message est composé dans le navigateur, copié par le visiteur (avec repli en sélection manuelle si la copie échoue), puis collé dans la conversation Instagram. Une réalisation peut être pré-renseignée via `/projet?ref=<id>` (bouton « Parler d’un projet similaire » de la visionneuse). Les réponses restent en mémoire pendant la navigation entre les étapes (y compris avec le bouton Précédent du navigateur) et ne sont pas stockées.

## Skills utilisés

Les cinq dépôts demandés ont été clonés et leurs instructions lues ; quatre ont été installés dans le projet (ignorés par git). Pour les réinstaller :

```bash
npx skills@latest add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend --agent claude-code
npx skills@latest add nutlope/hallmark --agent claude-code
npx impeccable@latest install --providers=claude --scope=project
# UI UX Pro Max : l’installeur npm a été refusé par l’environnement ; copie manuelle de src/ui-ux-pro-max/{data,scripts} du dépôt dans .claude/skills/ui-ux-pro-max/
# Emil Kowalski : instructions lues depuis le clone (skills/animate, skills/review-animations) ; `npx skills@latest add emilkowalski/skills` pour les installer
```

Le détail de ce que chaque skill a apporté, des contrôles exécutés et des arbitrages est dans [`docs/compte-rendu.md`](docs/compte-rendu.md).

## Vérifications

- `npm run check` : 0 erreur.
- `npm run build` : 7 pages, images optimisées en WebP à plusieurs tailles.
- `npm test` : 54 scénarios (galerie au toucher et au clavier, visionneuse, référence, étapes, copie et repli, Instagram, menu mobile, barre d’action, mouvement réduit, 320 px).
- `node tests/shots.mjs` : captures et détection de débordement horizontal à six largeurs.
- Hallmark `sloplint`, Impeccable `detect` (sources et pages rendues), Taste `copy-lint` et `check.mjs` : résultats et suites dans le compte rendu.
