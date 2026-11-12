# EcomPilot IA · « Ta Team »

Plateforme e-commerce pilotée par **six agents IA** (Antoine, Rémi, Claire, Samuel, Camille, Maxime) pour des débutants francophones en dropshipping Shopify. Interface en français, mode sombre permanent, accent jaune ambré `#f5b800`.

Le code suit **à l’identique la structure d’une app Base44** : entités dans `base44/entities/`, fonctions serveur dans `base44/functions/<nom>/entry.ts`, modules partagés dans `base44/shared/`, front React/Vite/Tailwind dans `src/`. Il tourne aussi hors Base44, en mode démo (voir « Démarrer »).

## Démarrer

Node 20 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # génère dist/
npm run preview    # sert dist/
```

### Deux modes d’exécution

| Mode | Déclencheur | Entités | Fonctions IA |
|---|---|---|---|
| **Démo local** (par défaut) | aucune variable d’environnement | `localStorage` | non déployées : message explicite dans l’interface |
| **Base44** | `VITE_BASE44_API_URL` + `VITE_BASE44_APP_ID` | API Base44 | `base44.functions.invoke()` |

```bash
# .env.local
VITE_BASE44_API_URL=https://app.base44.com/api
VITE_BASE44_APP_ID=<identifiant de ton app>
```

`src/api/base44.js` est un **équivalent local** du client fourni par la plateforme : même surface d’API (`base44.auth`, `base44.entities.<Nom>`, `base44.functions.invoke`, `base44.integrations.Core.*`). Dans Base44, ce fichier est fourni par la plateforme et remplace celui-ci.

## Contenu

- **6 agents** (`src/lib/agents.js`) : nom, rôle, badge, équipe, couleur d’accent, route d’entrée, avatar SVG minimaliste (`src/components/AgentAvatar.jsx`).
- **27 outils** répartis en 6 groupes de navigation (`src/lib/navigation.js`), plus l’accueil et les paramètres — 29 routes applicatives au total.
- **37 fonctions backend** (`base44/functions/`) : 28 de génération IA, 8 Shopify Admin API, plus l’audit `scanShopifyStore` qui combine les deux.
- **3 définitions d’entités** (`base44/entities/`) : `ShopifyAccount` et `ToolResult` avec RLS propriétaire (`created_by_id`), et `User.jsonc` qui documente les champs personnalisés ajoutés au profil intégré (`niche`, `productPhoto`, `beginnerMode`, `milestones`).
- **50 défis gamifiés** (`src/lib/dailyPrompts.js`), un par jour, répartis sur les six agents.

### Les six agents et leurs outils

| Agent | Rôle | Outils |
|---|---|---|
| **Antoine** | Le Responsable | Mes premiers 1 000 €, Mes étapes, Défi du jour, Diagnostic, Scale checker |
| **Rémi** | Marketing | Produits gagnants, Espionnage concurrents, Scanner Shopify, Angles publicitaires, Analyseur de pubs, Budget publicitaire, Offres & promos, Upsell & bundles |
| **Claire** | Contenu & Rédaction | Textes publicitaires, Briefs créatifs, Séquences e-mail, Optimiseur produit, Générateur de marque |
| **Samuel** | Service Client | Communication, Trust builder, Avatar client, Conseils boutique |
| **Camille** | Réseaux Sociaux | Contenu organique, Influenceurs & UGC |
| **Maxime** | Comptabilité | Calculateur de bénéfices, Marge nette produit, Prix & livraison |

## Arborescence

```
base44/
  entities/        ShopifyAccount.jsonc · ToolResult.jsonc · User.jsonc
  shared/          llm.ts (prompt système, JSON strict, 3 réessais) · shopify.ts (Admin API)
  functions/       37 dossiers, un entry.ts chacun
src/
  api/base44.js    client Base44 (équivalent local hors plateforme)
  lib/             navigation · agents · dailyPrompts · useAi · useEcomProfile · useJourney · utils
  components/      EcomLayout · Sidebar · CommandPalette · HelpButton · NextStepBanner · PageHeader
    ai/            ToolShell · AgentChat · GenerateButton · CopyBlock · LinkButton · AiLoading · ResultView
    shopify/       ShopifyConnectWizard (3 étapes + confettis) · ShopifySection · ShopifyProductsList
    ui/            primitives type shadcn (button, card, input, textarea, label, badge, switch, image, toaster)
  pages/           Home · Onboarding · 27 outils · Settings · 4 pages d’authentification · PageNotFound
  index.css        jetons de thème + feuille complète .ta-team
```

## Mécaniques transverses

- **Mémoire par outil** : chaque génération est enregistrée dans `ToolResult` (`tool_key` = chemin de la route) et restaurée au retour sur la page, avec l’horodatage relatif du dernier résultat (`src/lib/useAi.js`).
- **Parcours guidé** : `JOURNEY` ordonne les 27 outils ; `NextStepBanner` affiche la prochaine étape et la progression à partir des `ToolResult` existants.
- **Recherche ⌘K / Ctrl+K** : `CommandPalette`, filtrage et navigation au clavier, résultats groupés par agent.
- **Bouton « Une question ? »** : bouton flottant violet, branché sur `helpAssistant`, qui reçoit le libellé de la page courante.
- **Conversation par agent** : chaque page d’outil se termine par un `AgentChat` branché sur `talkToAgent`, avec l’historique et le dernier résultat en contexte.
- **Transfert entre agents** : « Angles publicitaires » (Rémi) envoie l’angle choisi à « Textes publicitaires » (Claire) via l’état de navigation.
- **Mode invité** : sans authentification, l’app fonctionne avec une niche de démonstration et n’enregistre rien — pour les présentations.
- **Score non effrayant** : sans Shopify connecté, l’accueil affiche un « potentiel de démarrage » entre 65 et 85 ; avec Shopify, une vraie santé calculée sur les ventes de la veille.
- **Écritures Shopify** : `pushProductToShopify` propose d’abord (`requiresConfirmation`) et n’écrit qu’avec `confirm: true`.

## Importer dans Base44

1. Créer les entités à partir de `base44/entities/*.jsonc` (RLS propriétaire sur `ShopifyAccount` et `ToolResult`).
2. Ajouter au profil `User` les champs `niche`, `productPhoto`, `beginnerMode`, `milestones` (voir `User.jsonc`).
3. Copier `base44/shared/` et les 37 dossiers de `base44/functions/`.
4. Copier `src/` ; supprimer `src/api/base44.js` si la plateforme fournit déjà ce module.
5. Modèles : `gemini_3_flash` par défaut, `gemini_3_1_pro` pour `generateWinningProducts` (recherche web, plus coûteux).

## Écarts assumés par rapport au prompt d’origine

Le document de spécification contenait quelques incohérences internes, tranchées ainsi :

- **27 outils** (et non 25) : c’est le total réel des six groupes de navigation, et la longueur de `JOURNEY`.
- **37 fonctions** (et non 36) : la liste numérotée du prompt allait jusqu’à 37 ; toutes sont écrites.
- `analyzeProfit` est rangée avec les fonctions de génération IA (elle appelle `llm`), et non avec les fonctions Shopify.
- `getShopifyProductFinance` renvoie la liste des produits quand aucun `product_id` n’est fourni, pour que la page « Marge nette produit » propose un sélecteur.
- Les sections de type `list` de `runDailyPrompt` renvoient un élément par ligne dans `content` (le schéma du prompt ne prévoyait qu’un champ texte).
- `generateWinningProducts` énonce explicitement l’échelle des notes dans le prompt (`profitScore` et `breakoutPotential` de 0 à 100, jamais sur 10) : le prompt d’origine ne la donnait que dans la description du schéma JSON, et les modèles renvoyaient alors des notes sur 10.
- Les avatars des agents sont des SVG dessinés dans le code plutôt que des images téléversées, et les visuels de l’accueil sont deux SVG locaux (`src/assets/`), faute de médias fournis.

## Vérifications

- `npm run build` : succès, 2 034 modules.
- Contrôle de syntaxe des 37 `entry.ts` et des 2 modules partagés (`node --experimental-strip-types --check`).
- Parcours Playwright sur accueil, roadmap, produits gagnants, défi du jour, étapes, paramètres et connexion : aucune erreur console, aucun débordement horizontal à 1440 px ni à 390 px.
