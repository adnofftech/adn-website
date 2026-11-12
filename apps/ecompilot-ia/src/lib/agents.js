/**
 * Ta Team — les six agents IA.
 * Chaque agent : un numéro, un nom, un rôle, un badge, une équipe,
 * une couleur d’accent et une route d’entrée.
 */
export const AGENTS = [
  {
    key: 'antoine',
    num: '01',
    name: 'Antoine',
    role: 'Le Responsable',
    badge: 'Direction',
    team: 'Direction',
    color: '#5fae9a',
    entry: '/roadmap',
    description: 'Vous indique quoi faire ensuite, chaque jour.',
    speciality: 'Stratégie',
    chatPlaceholder: 'Demande à Antoine par quoi commencer aujourd’hui…',
  },
  {
    key: 'remi',
    num: '02',
    name: 'Rémi',
    role: 'Marketing',
    badge: 'Marketing',
    team: 'Acquisition',
    color: '#e89657',
    entry: '/produits-gagnants',
    description: 'Prépare vos plans de vente et vos promotions.',
    speciality: 'Marketing',
    chatPlaceholder: 'Demande à Rémi quel produit ou quel angle tester…',
  },
  {
    key: 'claire',
    num: '03',
    name: 'Claire',
    role: 'Contenu & Rédaction',
    badge: 'Contenu & Rédaction',
    team: 'Contenu',
    color: '#d06a96',
    entry: '/textes-publicitaires',
    description: 'Rédige vos fiches produits, vos publications, vos emails et vos scripts vidéo.',
    speciality: 'Contenu',
    chatPlaceholder: 'Demande à Claire de réécrire un texte, un titre, une accroche…',
  },
  {
    key: 'samuel',
    num: '04',
    name: 'Samuel',
    role: 'Service Client',
    badge: 'Service Client',
    team: 'Relation client',
    color: '#5d97c9',
    entry: '/communication',
    description: 'Prépare vos réponses aux questions de vos clients.',
    speciality: 'SAV',
    chatPlaceholder: 'Colle le message d’un client, Samuel prépare la réponse…',
  },
  {
    key: 'camille',
    num: '05',
    name: 'Camille',
    role: 'Réseaux Sociaux',
    badge: 'Réseaux Sociaux',
    team: 'Social',
    color: '#9277c9',
    entry: '/contenu-organique',
    description: 'Prépare les textes de vos publications sur les réseaux sociaux.',
    speciality: 'Social',
    chatPlaceholder: 'Demande à Camille une idée de vidéo ou de publication…',
  },
  {
    key: 'maxime',
    num: '06',
    name: 'Maxime',
    role: 'Comptabilité',
    badge: 'Comptabilité',
    team: 'Pilotage',
    color: '#d9b441',
    entry: '/calculateur-benefices',
    description: 'Vous aide à suivre vos ventes, vos dépenses et ce qu’il vous reste après les frais.',
    speciality: 'Comptabilité',
    chatPlaceholder: 'Demande à Maxime de vérifier une marge ou un budget…',
  },
];

export const AGENTS_BY_KEY = Object.fromEntries(AGENTS.map((agent) => [agent.key, agent]));

export function getAgent(key) {
  return AGENTS_BY_KEY[key] || AGENTS[0];
}

/** Dégradés par agent, utilisés par la bibliothèque du défi du jour. */
export const AGENT_COLORS = {
  antoine: 'from-[#5fae9a] to-[#2f6d5e]',
  remi: 'from-[#e89657] to-[#a85f26]',
  claire: 'from-[#d06a96] to-[#8d3a60]',
  samuel: 'from-[#5d97c9] to-[#2d5f8c]',
  camille: 'from-[#9277c9] to-[#5a3f93]',
  maxime: 'from-[#d9b441] to-[#9a7a14]',
};
