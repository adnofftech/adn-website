/**
 * Bibliothèque « Défi du jour » — 50 prompts « building blocks ».
 * Un défi se débloque par jour calendaire. Répartition :
 * 1-8 Antoine · 9-16 Rémi · 17-24 Claire · 25-30 Samuel · 31-36 Camille
 * 37-42 Maxime · 43-50 croissance et passage à l’échelle.
 */
export { AGENT_COLORS } from '@/lib/agents';

export const DAILY_PROMPTS = [
  // ---------------------------------------------------------- Antoine 1-8
  {
    day: 1,
    title: 'Poser ma décision de départ',
    agent: 'antoine',
    goal: 'Choisir une direction claire au lieu de tourner en rond.',
    prompt:
      'Je démarre ma boutique dans ma niche. Pose-moi la décision la plus importante à prendre aujourd’hui, donne-moi trois options concrètes avec leurs conséquences, puis recommande-en une et explique pourquoi en une phrase simple.',
  },
  {
    day: 2,
    title: 'Mon objectif à 30 jours',
    agent: 'antoine',
    goal: 'Transformer « réussir » en un chiffre atteignable.',
    prompt:
      'Fixe-moi un objectif réaliste à 30 jours pour une boutique qui démarre dans ma niche : un chiffre de ventes, un chiffre de visites et un budget publicitaire. Explique le raisonnement, puis découpe l’objectif en quatre jalons hebdomadaires.',
  },
  {
    day: 3,
    title: 'Mes trois heures qui comptent',
    agent: 'antoine',
    goal: 'Savoir où passer mon temps quand j’en ai peu.',
    prompt:
      'Je dispose de trois heures par jour. Construis mon emploi du temps type de débutant dans ma niche : ce que je fais dans la première heure, la deuxième, la troisième, et surtout la liste des choses que je ne dois PAS faire maintenant.',
  },
  {
    day: 4,
    title: 'Éliminer mon premier blocage',
    agent: 'antoine',
    goal: 'Nommer ce qui me freine et le lever.',
    prompt:
      'Liste les cinq blocages les plus fréquents chez un débutant en dropshipping dans ma niche, du plus courant au plus rare. Pour chacun : le signe qui le trahit, la cause réelle, et l’action de 20 minutes qui le lève.',
  },
  {
    day: 5,
    title: 'Ma check-list de lancement',
    agent: 'antoine',
    goal: 'Ne rien oublier avant d’envoyer du trafic.',
    prompt:
      'Donne-moi la check-list complète à valider avant de dépenser le premier euro de publicité pour ma niche : boutique, fiche produit, paiement, livraison, pages légales, suivi des conversions. Classe par ordre de priorité et marque ce qui est bloquant.',
  },
  {
    day: 6,
    title: 'Mes indicateurs à surveiller',
    agent: 'antoine',
    goal: 'Lire mes chiffres sans me noyer.',
    prompt:
      'Explique-moi les cinq seuls indicateurs qu’un débutant doit regarder chaque jour dans ma niche. Pour chacun : ce qu’il mesure en langage simple, la valeur normale à attendre, et quoi faire si le chiffre est trop bas.',
  },
  {
    day: 7,
    title: 'Mon bilan de la semaine',
    agent: 'antoine',
    goal: 'Décider de la semaine suivante sur des faits.',
    prompt:
      'Construis mon rituel de bilan hebdomadaire : les questions à me poser, les chiffres à relever, les trois décisions possibles à la fin (continuer, ajuster, arrêter) et les critères qui déclenchent chacune.',
  },
  {
    day: 8,
    title: 'Mon plan si rien ne marche',
    agent: 'antoine',
    goal: 'Avoir une porte de sortie calme et préparée.',
    prompt:
      'Prépare mon plan de repli : après combien de jours et combien dépensé sans vente je dois changer de produit dans ma niche, ce que je garde du travail déjà fait, et les trois premières actions du nouveau test.',
  },

  // ------------------------------------------------------------ Rémi 9-16
  {
    day: 9,
    title: 'Comprendre la demande de ma niche',
    agent: 'remi',
    goal: 'Vérifier que des gens cherchent vraiment ce que je vends.',
    prompt:
      'Analyse la demande actuelle dans ma niche en France et en Europe : les besoins les plus recherchés, ceux qui progressent, ceux qui s’essoufflent. Appuie-toi sur des signaux réels et cite ce qui te fait dire qu’il y a de la demande.',
  },
  {
    day: 10,
    title: 'Trois produits à tester en premier',
    agent: 'remi',
    goal: 'Sortir d’une liste infinie pour choisir trois paris.',
    prompt:
      'Propose-moi trois produits à tester en priorité dans ma niche, avec pour chacun : le problème résolu, le prix d’achat et de vente estimé, la marge, le niveau de concurrence en France et la raison pour laquelle c’est le bon moment.',
  },
  {
    day: 11,
    title: 'Le produit que je dois éviter',
    agent: 'remi',
    goal: 'Repérer les pièges avant de perdre de l’argent.',
    prompt:
      'Liste les types de produits à éviter dans ma niche : saturés, trop fragiles, trop lourds à livrer, interdits en publicité, ou à marge impossible. Explique le piège pour chacun et donne l’alternative plus saine.',
  },
  {
    day: 12,
    title: 'Mes trois concurrents à copier intelligemment',
    agent: 'remi',
    goal: 'Apprendre de ceux qui vendent déjà.',
    prompt:
      'Explique-moi comment trouver les boutiques qui vendent déjà dans ma niche, quoi observer exactement chez elles (offre, prix, publicités, preuves, livraison), et comment adapter sans copier bêtement. Donne-moi une grille d’analyse en cinq lignes.',
  },
  {
    day: 13,
    title: 'Mon premier test publicitaire',
    agent: 'remi',
    goal: 'Dépenser peu pour apprendre vite.',
    prompt:
      'Construis mon premier test publicitaire pour ma niche avec un budget de 20 € par jour : la structure de campagne, le ciblage, le nombre de créations, la durée du test, et les chiffres qui disent « je continue » ou « j’arrête ».',
  },
  {
    day: 14,
    title: 'Mon offre irrésistible',
    agent: 'remi',
    goal: 'Vendre mieux sans baisser le prix.',
    prompt:
      'Transforme un produit simple de ma niche en offre difficile à refuser : produit principal, bonus, garantie, livraison, urgence honnête. Donne trois versions d’offre et explique à qui chacune parle.',
  },
  {
    day: 15,
    title: 'Mon prix juste',
    agent: 'remi',
    goal: 'Trouver le prix qui laisse de la marge et reste crédible.',
    prompt:
      'Aide-moi à fixer mon prix de vente dans ma niche : la fourchette du marché, le prix psychologique, la marge minimale à protéger, et deux tests de prix à mener dans l’ordre.',
  },
  {
    day: 16,
    title: 'Ma promotion du mois',
    agent: 'remi',
    goal: 'Créer un évènement commercial qui ne détruit pas la marge.',
    prompt:
      'Propose trois mécaniques de promotion adaptées à ma niche (lot, deuxième à moitié prix, palier de livraison offerte…). Pour chacune : l’effet attendu sur le panier moyen, l’impact sur la marge et le texte d’annonce prêt à publier.',
  },

  // --------------------------------------------------------- Claire 17-24
  {
    day: 17,
    title: 'Mon titre de produit qui accroche',
    agent: 'claire',
    goal: 'Donner envie en six mots.',
    prompt:
      'Écris dix titres de fiche produit pour un article de ma niche : cinq orientés bénéfice, cinq orientés problème résolu. Chacun de moins de 60 caractères, puis dis lequel tu choisirais et pourquoi.',
  },
  {
    day: 18,
    title: 'Ma description qui vend',
    agent: 'claire',
    goal: 'Remplacer la fiche technique par une vraie promesse.',
    prompt:
      'Rédige une description de produit complète pour ma niche : une accroche, trois paragraphes, sept bénéfices en « Grâce à X, tu pourras Y », cinq caractéristiques, une garantie et un appel à l’action. Ton simple et chaleureux.',
  },
  {
    day: 19,
    title: 'Mes cinq accroches vidéo',
    agent: 'claire',
    goal: 'Capter l’attention dans les trois premières secondes.',
    prompt:
      'Écris cinq accroches de trois secondes pour une vidéo publicitaire dans ma niche : une question, une affirmation choc, une démonstration, un avant/après, un témoignage. Précise pour chacune ce que la caméra montre.',
  },
  {
    day: 20,
    title: 'Mon script vidéo de 30 secondes',
    agent: 'claire',
    goal: 'Avoir une vidéo prête à tourner avec un téléphone.',
    prompt:
      'Écris un script vidéo de 30 secondes pour un produit de ma niche, découpé seconde par seconde : image, texte à l’écran, voix off. Tournable avec un téléphone et sans matériel.',
  },
  {
    day: 21,
    title: 'Ma séquence de trois e-mails',
    agent: 'claire',
    goal: 'Récupérer les paniers abandonnés.',
    prompt:
      'Écris une séquence de trois e-mails de panier abandonné pour ma niche : à 1 heure, à 24 heures, à 72 heures. Objet, pré-header, corps et appel à l’action pour chacun, avec un ton humain et sans fausse urgence.',
  },
  {
    day: 22,
    title: 'Mes réponses aux objections',
    agent: 'claire',
    goal: 'Lever les doutes avant qu’ils bloquent l’achat.',
    prompt:
      'Liste les huit objections les plus fréquentes avant un achat dans ma niche (prix, délai, qualité, taille, retour…). Pour chacune : la réponse écrite à mettre dans la fiche produit et où la placer exactement.',
  },
  {
    day: 23,
    title: 'Ma FAQ qui rassure',
    agent: 'claire',
    goal: 'Répondre une fois pour ne plus répondre dix fois.',
    prompt:
      'Rédige une FAQ de huit questions-réponses pour une boutique de ma niche : livraison, retours, paiement, usage du produit, entretien. Réponses courtes, honnêtes et rassurantes.',
  },
  {
    day: 24,
    title: 'Mon texte « à propos »',
    agent: 'claire',
    goal: 'Donner un visage à ma boutique.',
    prompt:
      'Écris la page « à propos » d’une petite boutique de ma niche : pourquoi elle existe, pour qui, ce qu’elle promet, ce qu’elle ne fait pas. Trois paragraphes, à la première personne, sans exagération.',
  },

  // --------------------------------------------------------- Samuel 25-30
  {
    day: 25,
    title: 'Mes réponses toutes prêtes',
    agent: 'samuel',
    goal: 'Répondre en deux minutes au lieu de vingt.',
    prompt:
      'Écris dix réponses types de service client pour ma niche : où est ma commande, délai dépassé, produit abîmé, mauvaise taille, demande de remboursement, question avant achat. Chacune en trois phrases, ton calme et clair.',
  },
  {
    day: 26,
    title: 'Mon client mécontent',
    agent: 'samuel',
    goal: 'Transformer une réclamation en client fidèle.',
    prompt:
      'Donne-moi la méthode pour traiter un client en colère dans ma niche : la structure de la réponse, les mots à employer, ceux à éviter, le geste commercial raisonnable et le moment où il faut rembourser sans discuter.',
  },
  {
    day: 27,
    title: 'Ma politique de retour',
    agent: 'samuel',
    goal: 'Dire les règles clairement, une fois pour toutes.',
    prompt:
      'Rédige une politique de retour et de remboursement pour une boutique de ma niche : délai, conditions, frais, procédure en quatre étapes. Texte prêt à publier, en français simple, et conforme au droit français de la vente à distance.',
  },
  {
    day: 28,
    title: 'Mon suivi après achat',
    agent: 'samuel',
    goal: 'Rassurer pendant l’attente de la livraison.',
    prompt:
      'Construis la suite de messages après commande pour ma niche : confirmation, expédition, veille de livraison, après réception. Pour chacun : le moment d’envoi, le contenu et l’objectif.',
  },
  {
    day: 29,
    title: 'Mes avis clients',
    agent: 'samuel',
    goal: 'Obtenir des avis sincères sans les acheter.',
    prompt:
      'Explique-moi comment récolter mes premiers avis clients honnêtes dans ma niche : quand demander, par quel canal, avec quel texte, et comment répondre publiquement à un avis négatif. Donne le message de demande prêt à envoyer.',
  },
  {
    day: 30,
    title: 'Ma preuve de confiance',
    agent: 'samuel',
    goal: 'Donner envie d’acheter à un inconnu.',
    prompt:
      'Liste les dix éléments de confiance à afficher sur une boutique de ma niche (garantie, délais, contact, paiement, mentions, avis) et dis précisément où les placer sur la page produit et dans le tunnel de commande.',
  },

  // -------------------------------------------------------- Camille 31-36
  {
    day: 31,
    title: 'Mes dix idées de vidéos',
    agent: 'camille',
    goal: 'Ne plus jamais être à sec d’idées.',
    prompt:
      'Donne dix idées de vidéos courtes pour ma niche, tournables seule avec un téléphone : le concept, l’accroche, le plan de tournage en trois images et le texte à l’écran.',
  },
  {
    day: 32,
    title: 'Mon calendrier de la semaine',
    agent: 'camille',
    goal: 'Publier régulièrement sans y penser chaque matin.',
    prompt:
      'Construis mon calendrier de publication sur sept jours pour ma niche : un format par jour (démonstration, conseil, coulisses, avis client, humour, question, offre), avec l’heure de publication et la légende rédigée.',
  },
  {
    day: 33,
    title: 'Ma légende qui fait commenter',
    agent: 'camille',
    goal: 'Créer de la conversation, pas juste des vues.',
    prompt:
      'Écris cinq légendes de publication pour ma niche, chacune terminée par une question qui déclenche des commentaires. Ajoute pour chacune dix hashtags pertinents en français.',
  },
  {
    day: 34,
    title: 'Ma vidéo avant/après',
    agent: 'camille',
    goal: 'Montrer le résultat au lieu de le promettre.',
    prompt:
      'Décris trois mises en scène « avant/après » pour un produit de ma niche : la situation de départ, le moment de bascule, le résultat. Précise les plans, la durée et la musique conseillée.',
  },
  {
    day: 35,
    title: 'Mon brief pour un créateur',
    agent: 'camille',
    goal: 'Faire filmer mon produit par quelqu’un d’autre.',
    prompt:
      'Rédige un brief pour un créateur de contenu qui va filmer mon produit dans ma niche : contexte, message, trois scènes attendues, ce qu’il faut dire, ce qu’il ne faut pas dire, format et droits d’utilisation.',
  },
  {
    day: 36,
    title: 'Mon message aux micro-influenceurs',
    agent: 'camille',
    goal: 'Obtenir des réponses à mes prises de contact.',
    prompt:
      'Écris trois messages de prise de contact avec des micro-influenceurs de ma niche : un pour un envoi de produit gratuit, un pour une rémunération fixe, un pour une commission. Courts, personnalisés et honnêtes.',
  },

  // --------------------------------------------------------- Maxime 37-42
  {
    day: 37,
    title: 'Ma marge réelle',
    agent: 'maxime',
    goal: 'Savoir ce qu’il me reste vraiment par vente.',
    prompt:
      'Apprends-moi à calculer ma marge nette par vente dans ma niche : prix de vente, coût produit, livraison, frais de paiement, coût publicitaire, retours, TVA. Donne-moi le calcul détaillé sur un exemple chiffré.',
  },
  {
    day: 38,
    title: 'Mon seuil de rentabilité',
    agent: 'maxime',
    goal: 'Connaître le nombre de ventes à atteindre.',
    prompt:
      'Calcule mon seuil de rentabilité mensuel pour une boutique de ma niche avec des charges fixes modestes : combien de ventes par jour pour couvrir les frais, et combien pour me payer 1 000 € par mois.',
  },
  {
    day: 39,
    title: 'Mon coût d’acquisition maximum',
    agent: 'maxime',
    goal: 'Savoir jusqu’où je peux payer une vente.',
    prompt:
      'Explique le coût d’acquisition client maximum acceptable dans ma niche : le calcul, la marge à préserver, l’effet des achats répétés, et le chiffre à ne jamais dépasser dans mes campagnes.',
  },
  {
    day: 40,
    title: 'Mon tableau de bord simple',
    agent: 'maxime',
    goal: 'Suivre l’argent sans tableur compliqué.',
    prompt:
      'Construis le tableau de suivi hebdomadaire d’une petite boutique de ma niche : les colonnes à remplir, la formule de chaque total, et les trois signaux d’alerte à repérer d’un coup d’œil.',
  },
  {
    day: 41,
    title: 'Mes dépenses à couper',
    agent: 'maxime',
    goal: 'Récupérer de la marge sans vendre plus.',
    prompt:
      'Liste les dépenses inutiles les plus fréquentes chez un débutant en dropshipping dans ma niche : applications, abonnements, outils, options de livraison. Pour chacune : le coût typique, l’utilité réelle et quoi faire à la place.',
  },
  {
    day: 42,
    title: 'Mes obligations de base',
    agent: 'maxime',
    goal: 'Être en règle sans me faire peur.',
    prompt:
      'Explique simplement les obligations d’un petit vendeur en ligne en France dans ma niche : statut, TVA, mentions légales, conditions de vente, facturation, conservation des justificatifs. Dis ce qui est urgent et ce qui peut attendre, et précise qu’il faut confirmer avec un comptable.',
  },

  // ---------------------------------------------- Croissance et scale 43-50
  {
    day: 43,
    title: 'Mon produit qui part à l’échelle',
    agent: 'remi',
    goal: 'Savoir quand augmenter le budget.',
    prompt:
      'Donne-moi les critères précis qui autorisent à augmenter le budget publicitaire d’un produit de ma niche : nombre de ventes, régularité, marge, taux de conversion. Puis la méthode d’augmentation étape par étape.',
  },
  {
    day: 44,
    title: 'Mon panier moyen en hausse',
    agent: 'remi',
    goal: 'Gagner plus sur chaque commande.',
    prompt:
      'Propose cinq façons d’augmenter le panier moyen dans ma niche : lot, produit complémentaire, palier de livraison, abonnement, garantie payante. Pour chacune : l’effet attendu, le texte à afficher et où le placer.',
  },
  {
    day: 45,
    title: 'Mes clients qui reviennent',
    agent: 'claire',
    goal: 'Vendre deux fois à la même personne.',
    prompt:
      'Construis mon plan de réachat pour ma niche : à quel moment relancer un client, par quel canal, avec quelle offre, et la séquence de deux messages rédigée.',
  },
  {
    day: 46,
    title: 'Ma deuxième source de trafic',
    agent: 'camille',
    goal: 'Ne plus dépendre d’une seule plateforme.',
    prompt:
      'Compare pour ma niche trois sources de trafic en plus de la publicité payante : contenu organique, référencement naturel, e-mail. Pour chacune : le temps à investir, le délai avant résultat et la première action à faire cette semaine.',
  },
  {
    day: 47,
    title: 'Mon audit de boutique',
    agent: 'antoine',
    goal: 'Trouver les fuites avant d’ajouter du trafic.',
    prompt:
      'Donne-moi la grille d’audit d’une boutique de ma niche en dix points : vitesse, mobile, fiche produit, preuves, tunnel, livraison, paiement, relances. Pour chaque point : ce qu’on vérifie, le seuil correct et la correction la plus rapide.',
  },
  {
    day: 48,
    title: 'Mon équipe et mes délégations',
    agent: 'antoine',
    goal: 'Arrêter de tout faire moi-même.',
    prompt:
      'Dis-moi quelles tâches déléguer en premier dans une boutique de ma niche, dans quel ordre, à quel profil, avec quel budget mensuel réaliste et quelles consignes écrites fournir.',
  },
  {
    day: 49,
    title: 'Ma marque qui dure',
    agent: 'claire',
    goal: 'Sortir du produit unique pour construire un nom.',
    prompt:
      'Aide-moi à transformer ma boutique de ma niche en marque : la promesse, le ton, les trois valeurs, le nom et le style visuel. Puis les cinq changements concrets à faire sur le site cette semaine.',
  },
  {
    day: 50,
    title: 'Mon plan des 90 prochains jours',
    agent: 'maxime',
    goal: 'Transformer 50 jours de travail en trajectoire.',
    prompt:
      'Construis mon plan sur 90 jours pour ma niche à partir d’une boutique qui vend déjà un peu : objectif de chiffre d’affaires, budget publicitaire, nouveaux produits, contenu, trésorerie. Un jalon par mois et les chiffres à atteindre.',
  },
];

export function getPromptByDay(day) {
  return DAILY_PROMPTS.find((entry) => entry.day === Number(day)) || null;
}

export const TOTAL_DAYS = DAILY_PROMPTS.length;
