/**
 * Données centrales du site LArtiste.Ink.
 * Tout ce qui est factuel (nom, liens, conditions, tarifs, visibilité des rubriques) se modifie ici.
 * Les réalisations sont dans src/content/realisations.json.
 */

export const marque = {
  nom: 'LArtiste.Ink',
  nomProfil: 'Tatouages by LArtiste.Ink',
  activite: 'Tatoueur',
  commune: 'Saint-Paul',
  territoire: 'La Réunion',
  /** Encres proposées, telles qu’annoncées sur les supports. */
  encres: 'Noir et/ou rouge',
  /** Valeurs exprimées dans les supports du tatoueur (utilisées telles quelles, sans ajout). */
  valeurs: ['travail soigné', 'écoute', 'conseil', 'personnalisation', 'attention aux détails'],
} as const;

export const liens = {
  instagram: 'https://www.instagram.com/lartiste.ink/',
  instagramPseudo: '@lartiste.ink',
  /** Lien direct vers la messagerie Instagram. À vérifier sur téléphone avant publication (voir docs/a-completer.md). */
  instagramMessage: 'https://ig.me/m/lartiste.ink',
  tiktok: 'https://www.tiktok.com/@lartiste.ink',
  tiktokPseudo: '@lartiste.ink',
} as const;

export const tarif = {
  prestation: 'Avant-bras complet détaillé',
  /** Montant affiché, en euros. */
  aPartirDe: 300,
  precision:
    'Ce tarif concerne cette prestation. Pour une autre pièce, présentez-moi votre projet : je vous réponds avec un tarif en message privé.',
} as const;

export const conditions = {
  acompte: {
    pourcentage: 20,
    moyens: ['Espèces, en amont de la séance', 'Virement'],
    note: 'Les modalités de paiement sont communiquées en privé.',
  },
  annulation: {
    delaiHeures: 48,
    remboursee: "Annulation signalée au moins 48 heures à l’avance : l’acompte est remboursé.",
    perdue: "Annulation à moins de 48 heures, ou rendez-vous manqué : l’acompte est perdu.",
  },
  confirmation: {
    matin: 'Rendez-vous le matin : confirmation demandée la veille.',
    apresMidi: "Rendez-vous l’après-midi : confirmation demandée le matin même.",
    absence: 'Sans confirmation, le rendez-vous est annulé.',
  },
  domicile: {
    /** Passer à true une fois les modalités d’exercice à domicile confirmées avec l’artiste. */
    visible: true,
    /** Montant minimal du tatouage (strictement supérieur) pour un déplacement. */
    seuilEuros: 100,
    note: 'Frais indicatifs. Le tarif final est convenu en message privé.',
    frais: [
      { zone: 'Saint-Paul', euros: 5 },
      { zone: 'Le Port', euros: 10 },
      { zone: 'La Possession', euros: 15 },
      { zone: 'Saint-Gilles', euros: 20 },
      { zone: 'Saint-Leu', euros: 25 },
      { zone: 'Saint-Denis', euros: 25 },
    ],
  },
  mineurs: {
    intro: "Pour une personne mineure, je demande l’accord du représentant légal et les pièces suivantes, à présenter avant la séance.",
    pieces: [
      "Pièce d’identité du mineur",
      "Pièce d’identité du représentant légal",
      'Livret de famille',
      'Autorisation écrite remplie et signée avant la séance',
    ],
    note: 'Ces documents sont vérifiés sur place. Le site ne collecte aucun justificatif.',
  },
  /** Formulation courte en attendant la validation de la fiche de soins (voir docs/sources.md). */
  soins: 'Les consignes de soins vous seront communiquées après la séance.',
} as const;

export const navigation = [
  { href: '/realisations', label: 'Réalisations' },
  { href: '/infos', label: 'Infos pratiques' },
] as const;

export const actionPrincipale = { href: '/projet', label: 'Parler de mon projet' } as const;

export const galerie = {
  /** En dessous de ce nombre de pièces, les filtres de catégorie sont masqués (présentation directe). */
  filtresAPartirDe: 6,
  categories: {
    floral: 'Floral',
    lettrage: 'Lettrage',
    detaille: 'Pièces détaillées',
  } as Record<string, string>,
} as const;

export const seo = {
  titreAccueil: 'LArtiste.Ink | Tatoueur à Saint-Paul, La Réunion',
  descriptionAccueil:
    "Découvrez les réalisations de LArtiste.Ink à Saint-Paul, La Réunion. Tatouages à l’encre noire et rouge, informations pratiques et demandes de projet sur Instagram.",
  /** Nom affiché dans les titres de pages secondaires : « Réalisations | LArtiste.Ink ». */
  suffixe: 'LArtiste.Ink',
  langue: 'fr',
} as const;

/** Mode « version de présentation » : noindex + mention dans le pied de page. Piloté par la variable PREVIEW. */
export const apercu = (import.meta.env.PREVIEW ?? 'true') !== 'false';

/** Informations professionnelles à compléter avant publication (mentions légales). */
export const mentions = {
  editeur: null as string | null,
  statut: null as string | null,
  siret: null as string | null,
  adresse: null as string | null,
  email: null as string | null,
  telephone: null as string | null,
  hebergeur: null as string | null,
  directeurPublication: null as string | null,
} as const;
