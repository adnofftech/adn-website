import {
  BarChart3,
  Building2,
  CalendarDays,
  Calculator,
  Clapperboard,
  Compass,
  LayoutDashboard,
  Layers,
  Lightbulb,
  Mail,
  Map,
  Megaphone,
  MessageSquareText,
  Package,
  Percent,
  Radar,
  Receipt,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Tag,
  TrendingUp,
  Trophy,
  UserPlus,
  UserRound,
  Wallet,
} from 'lucide-react';

/** Six groupes de navigation, un par agent. */
export const NAV_GROUPS = [
  {
    agent: 'antoine',
    label: 'Antoine · Responsable',
    items: [
      { path: '/', label: 'Accueil', icon: LayoutDashboard, home: true },
      { path: '/roadmap', label: 'Mes premiers 1 000 €', icon: Map },
      { path: '/etapes', label: 'Mes étapes', icon: Trophy },
      { path: '/defi-du-jour', label: 'Défi du jour', icon: Sparkles },
      { path: '/diagnostic', label: 'Diagnostic', icon: Stethoscope },
      { path: '/scale-checker', label: 'Scale checker', icon: TrendingUp },
    ],
  },
  {
    agent: 'remi',
    label: 'Rémi · Marketing',
    items: [
      { path: '/produits-gagnants', label: 'Produits gagnants', icon: Sparkles },
      { path: '/espionnage-concurrents', label: 'Espionnage concurrents', icon: Radar },
      { path: '/scanner-shopify', label: 'Scanner Shopify', icon: ScanSearch },
      { path: '/angles-publicitaires', label: 'Angles publicitaires', icon: Compass },
      { path: '/analyseur-pubs', label: 'Analyseur de pubs', icon: BarChart3 },
      { path: '/budget-publicitaire', label: 'Budget publicitaire', icon: Wallet },
      { path: '/offres-promos', label: 'Offres & promos', icon: Percent },
      { path: '/offres-supplementaires', label: 'Upsell & bundles', icon: Layers },
    ],
  },
  {
    agent: 'claire',
    label: 'Claire · Contenu & Rédaction',
    items: [
      { path: '/textes-publicitaires', label: 'Textes publicitaires', icon: Megaphone },
      { path: '/briefs-creatifs', label: 'Briefs créatifs', icon: Clapperboard },
      { path: '/emails', label: 'Séquences e-mail', icon: Mail },
      { path: '/optimiseur-produit', label: 'Optimiseur produit', icon: Package },
      { path: '/generateur-marque', label: 'Générateur de marque', icon: Building2 },
    ],
  },
  {
    agent: 'samuel',
    label: 'Samuel · Service Client',
    items: [
      { path: '/communication', label: 'Communication', icon: MessageSquareText },
      { path: '/trust-builder', label: 'Trust builder', icon: ShieldCheck },
      { path: '/avatar-client', label: 'Avatar client', icon: UserRound },
      { path: '/conseils-boutique', label: 'Conseils boutique', icon: Lightbulb },
    ],
  },
  {
    agent: 'camille',
    label: 'Camille · Réseaux Sociaux',
    items: [
      { path: '/contenu-organique', label: 'Contenu organique', icon: CalendarDays },
      { path: '/influenceurs-ugc', label: 'Influenceurs & UGC', icon: UserPlus },
    ],
  },
  {
    agent: 'maxime',
    label: 'Maxime · Comptabilité',
    items: [
      { path: '/calculateur-benefices', label: 'Calculateur de bénéfices', icon: Calculator },
      { path: '/marge-produit', label: 'Marge nette produit', icon: Receipt },
      { path: '/prix-livraison', label: 'Prix & livraison', icon: Tag },
    ],
  },
];

/** Tous les éléments de navigation, aplatis, avec leur groupe et leur agent. */
export const NAV_FLAT = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label, agent: group.agent })),
);

/** Les 27 outils (l’accueil n’en est pas un). */
export const TOOLS = NAV_FLAT.filter((item) => !item.home);

/** Parcours recommandé : l’ordre logique de découverte des 27 outils. */
export const JOURNEY = [
  '/roadmap',
  '/produits-gagnants',
  '/espionnage-concurrents',
  '/scanner-shopify',
  '/angles-publicitaires',
  '/textes-publicitaires',
  '/briefs-creatifs',
  '/emails',
  '/optimiseur-produit',
  '/contenu-organique',
  '/influenceurs-ugc',
  '/analyseur-pubs',
  '/budget-publicitaire',
  '/offres-promos',
  '/offres-supplementaires',
  '/communication',
  '/trust-builder',
  '/avatar-client',
  '/conseils-boutique',
  '/calculateur-benefices',
  '/prix-livraison',
  '/scale-checker',
  '/diagnostic',
  '/etapes',
  '/defi-du-jour',
  '/generateur-marque',
  '/marge-produit',
];

/** Prochaine étape du parcours : la première route non encore utilisée. */
export function nextStepPath(donePaths = []) {
  const done = new Set(donePaths);
  return JOURNEY.find((path) => !done.has(path)) || null;
}

export function findTool(path) {
  return NAV_FLAT.find((item) => item.path === path) || null;
}

/** Libellé lisible d’une page, pour le bouton « Une question ? ». */
export function pageLabel(path) {
  if (path === '/') return 'Accueil (dashboard Ta Team)';
  if (path === '/parametres') return 'Paramètres';
  const tool = findTool(path);
  return tool ? `${tool.label} (${tool.group})` : path;
}
