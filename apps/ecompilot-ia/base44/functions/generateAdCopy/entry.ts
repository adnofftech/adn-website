import { llm } from '../../shared/llm.ts';

/** Lecture tolérante du corps de la requête. */
async function payload(req: Request): Promise<any> {
  try {
    return (await req.json()) || {};
  } catch {
    return {};
  }
}

const SCHEMA = {
  "type": "object",
  "properties": {
    "hooks": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Accroche de trois secondes"
      },
      "description": "Huit accroches"
    },
    "script": {
      "type": "string",
      "description": "Script vidéo de 30 à 45 secondes"
    },
    "headlines": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Titre court"
      },
      "description": "Six titres"
    },
    "body": {
      "type": "string",
      "description": "Texte principal de la publicité"
    },
    "coldVersion": {
      "type": "string",
      "description": "Version audience froide"
    },
    "warmVersion": {
      "type": "string",
      "description": "Version audience chaude"
    }
  },
  "required": [
    "hooks",
    "script",
    "headlines",
    "body",
    "coldVersion",
    "warmVersion"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { platform = 'Facebook', productName = '', angle = '' } = await payload(req);

    const prompt = `Tu es Claire, la rédactrice de Ta Team. Écris un jeu complet de textes publicitaires pour ${platform}.

Produit : ${productName || 'le produit visible sur la photo fournie — décris d’abord ce que tu vois, puis écris les textes pour ce produit'}.
${angle ? `Angle imposé par Rémi, à respecter : ${angle}` : 'Choisis l’angle le plus vendeur et dis-le dans le corps du texte.'}

Produis :
- hooks : huit accroches de trois secondes, du niveau des 1 % de publicités qui fonctionnent le mieux. Variées : question, chiffre, erreur courante, avant/après, témoignage, provocation douce.
- script : un script vidéo complet de 30 à 45 secondes, découpé par séquences avec le temps, l’image, le texte à l’écran et la voix off. 150 à 250 mots.
- headlines : six titres courts (moins de 40 caractères) pour la publicité.
- body : le texte principal de la publicité, 150 à 250 mots, avec émojis placés avec goût, structuré en accroche, problème, solution, preuve, offre, appel à l’action.
- coldVersion : une version pour une audience froide qui ne connaît ni la marque ni le produit (150 à 250 mots).
- warmVersion : une version pour une audience chaude qui a déjà visité la boutique (150 à 250 mots).

Français simple, phrases courtes, aucune promesse mensongère, aucune allégation de santé.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA, useProductPhoto: !productName });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
