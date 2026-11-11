export const meta = {
  name: 'fix-3d-modules-after-qc',
  description: 'Corrige, module par module, les défauts relevés par les 6 relecteurs indépendants (vérification image par image après chaque correction)',
  phases: [{ title: 'Corrections', detail: '6 modules, 2 agents à la fois' }],
}

const ROOT = '/home/user/adn-website/mais-pourquoi-milliardaires'

const RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    files_modified: { type: 'array', items: { type: 'string' } },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'number', description: 'numéro (à partir de 0) de la ligne dans la liste de corrections' },
          scene: { type: 'number' },
          status: { type: 'string', description: 'fixed | partially | skipped | not_reproduced' },
          verified_at: { type: 'array', items: { type: 'number' }, description: 'instants réellement capturés ET regardés après correction' },
          note: { type: 'string', description: 'ce qui a été changé (ou pourquoi ignoré), en une ou deux phrases' },
        },
        required: ['index', 'scene', 'status', 'note'],
      },
    },
    perf: { type: 'object', properties: { avg_ms: { type: 'number' }, max_ms: { type: 'number' } } },
    new_known_issues: { type: 'array', items: { type: 'string' } },
  },
  required: ['module', 'files_modified', 'issues'],
}

const COMMON = `Tu es directeur artistique 3D et développeur Three.js senior. Un contrôle qualité indépendant vient de relire la vidéo verticale 9:16 « MAIS POURQUOI : et si on redistribuait tout ? » (voix off de Léo, 83,4 s, rendue image par image par Hyperframes avec Three.js logiciel déterministe) et a relevé des défauts dans TON module. Tu les corriges tous, en vérifiant chaque correction à l'image.
Projet : ${ROOT} (projet Hyperframes dans video/). Lis d'abord CONTRACT.md (contrat technique : fonction pure de t, pas de Math.random/Date.now, Lambert/Basic uniquement, zones de sécurité : sujet utile dans y∈[260,1250] px, sous-titres y∈[1330,1530], marge droite 150 px), puis la liste de corrections qui t'est donnée (JSON : scene, severity, t, what, where, suggested_fix). Les suggestions des relecteurs sont des PISTES : vérifie dans le code et sur capture, puis choisis la correction la plus simple qui règle réellement le problème.
Règles dures :
- Le script (script.txt) est définitif. Aucun texte de narration ou de sous-titre n'est modifié. Aucun chiffre inventé (FACTS.md fait foi). Billets génériques fictifs.
- Tu ne modifies QUE les fichiers de ton module (video/js/scenes/<id>.js et <id>_*.js). Ne touche JAMAIS video/index.html, scripts/*, video/js/captions.js, plan.js, shared.js (le monteur s'en charge : si un défaut de ta liste demande un changement dans ces fichiers — sous-titres, titres HTML —, marque-le "skipped" avec la note « traité par le monteur »).
- Ne casse pas les raccords : la première clé de caméra de chaque fenêtre garde t = début de fenêtre, et la pose de sortie (dernières 0,4 s) reste celle qui raccorde au module suivant, sauf si le défaut concerne précisément ce raccord.
- Ne change pas les moments clés (synchro sur les mots via onset()) : tu modifies composition, cadrage, taille, position, opacité, couleur, timing fin de façon ciblée.
- Corrige d'abord les « majeur », puis les « mineur ». Ignore ce qui est marqué optionnel ou qui contredit la directive (DIRECTIVE.md, lis les passages de tes scènes). Si une correction proposée te paraît risquée ou disproportionnée, ne la fais pas : "skipped" + raison honnête.
- Reprise : un agent précédent a pu être interrompu en cours de route et laisser des modifications PARTIELLES dans les fichiers de ton module (vérifie-les avec \`git diff -- video/js/scenes/\` avant de modifier ; ne les annule pas à l'aveugle, juge-les à l'image, garde ce qui est bon et termine le reste).
- Tests : node scripts/shot.mjs <id> <t1,t2,...> /tmp/claude-0/fix-<id> <port>   (port dédié à ton module ; ≤ 10 images par essai, une commande à la fois ; 1 image ≈ 2-6 s). Ouvre CHAQUE PNG avec Read et juge-le réellement : lisibilité en vignette portrait, aucun trou noir, rien qui traverse la caméra, texte non coupé, aucun chevauchement gênant avec les sous-titres (y 1330-1530 : les sous-titres sont ajoutés par-dessus par le monteur, tu ne les vois pas dans le banc d'essai : repère-toi aux pixels). Vérifie à chaque fois l'instant signalé ET 1-2 instants voisins (avant/après) pour ne pas introduire de régression. Ne dépasse pas ~7 essais de captures au total ; sois efficace.
- Après modifications : lance \`node --check\` sur chaque fichier modifié (ou équivalent), et vérifie que le banc d'essai charge sans erreur dans la console.
Fin de mission : réponds uniquement via le schéma. Honnêteté stricte : "fixed" seulement si tu as capturé ET regardé l'image après correction ; sinon "partially" ou "skipped".`

const MODS = [
  { id: 'market', port: 9204, brief: `Module « market » (scènes 8, 9, 10 ; fenêtre [27.64, 38.46]). Fichier(s) : video/js/scenes/market.js. Priorité : S9 (la moitié « pas assez d'acheteurs » doit enfin être lisible : acheteurs bleus visibles à droite, balance cadrée, graphique en baisse visible en fin de scène — les relecteurs la jugent la plus faible, 3/5), puis S8 (compteur dans la zone sous-titres, écran vide trop longtemps), puis S10.` },
  { id: 'wealth', port: 9201, brief: `Module « wealth » (scènes 1, 2, 3, 13, 18 ; fenêtres [0,13.18], [51.3,54.78], [79.16,83.96]). Fichiers : video/js/scenes/wealth.js, wealth_hall.js, wealth_lib.js, wealth_map.js. Le titre HTML « VRAIMENT ? » (largeur) et la mention légale sont traités par le monteur ; toi : zoom du « ? » en S2, panneau 824 M + surexposition carte en S3, mention euro, montagne, flux S1/S18, fin de S13 (surexposition/faisceau/carte violette).` },
  { id: 'impact', port: 9205, brief: `Module « impact » (scènes 11, 12 ; fenêtre [38.46, 51.3]). Fichier : video/js/scenes/impact.js. Priorité : S11 usine/employés cachés par les sous-titres + libellés coupés (jauge, PROJETS DE DÉVELOPPEMENT), S12 contagion non uniforme, trou noir au raccord 45.3→45.64.` },
  { id: 'shares', port: 9203, brief: `Module « shares » (scènes 5, 6, 7 ; fenêtre [18.52, 27.64]). Fichiers : video/js/scenes/shares.js, shares_lib.js, shares_vault.js, shares_s7.js. Priorité : S6 étiquettes sous le titre HTML (le titre « UNE FORTUNE ≠ DU CASH » occupe y≈250-800 environ à 22.3-26 s : descends/remonte les étiquettes et l'enseigne), S7 panneau ENTREPRISE dans la zone des sous-titres, icônes et barre F3.` },
  { id: 'durable', port: 9206, brief: `Module « durable » (scènes 15, 16, 17 ; fenêtre [59.44, 79.16]). Fichiers : video/js/scenes/durable.js, durable_kit.js, durable_s15.js, durable_s16.js, durable_s17.js. Priorité : S16 (étiquettes de tuiles mal associées à leurs objets ; bandeaux lointains derrière le titre HTML « AIDER ≠ RÉSOUDRE DURABLEMENT » qui occupe le haut du cadre à partir de 65.9 s — le monteur compacte le titre, toi tu fais disparaître S.labR dès durablement+0.3 et corriges la plateforme/étiquettes), S15 (en-têtes de factures tronqués, calendrier, plaque REVENU STABLE), S17 (étiquettes).` },
  { id: 'life', port: 9202, brief: `Module « life » (scènes 4 et 14 ; fenêtres [13.18,18.52], [54.78,59.44]). Fichiers : video/js/scenes/life.js, life_kit.js, life_s14.js. Les sous-titres trop longs de S14 sont traités par le monteur (ignore cette ligne : "skipped"). Toi : peau orange S4, cabinet de soins trop froid/olive, patients sous les sous-titres, tampon coupé/facture RÉGLÉE masquée en S14, début de S14 sombre.` },
]

const IDS = (args && args.ids) || MODS.map(m => m.id)
const SEL = MODS.filter(m => IDS.includes(m.id))
phase('Corrections')
const queue = SEL.slice()
const out = {}
async function worker() {
  while (queue.length) {
    const m = queue.shift()
    out[m.id] = await agent(
      `${COMMON}\n\n=== TA MISSION ===\nid du module : ${m.id} — port de test ${m.port}\n${m.brief}\nListe de corrections : lis le fichier ${ROOT}/research/fixlist_${m.id}.json (le champ « index » du schéma = position de la ligne dans ce tableau, à partir de 0).`,
      { label: `fix:${m.id}`, phase: 'Corrections', schema: RESULT }
    )
  }
}
await Promise.all([worker(), worker()])
return out
