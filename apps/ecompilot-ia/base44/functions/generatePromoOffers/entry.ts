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
    "offers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Nom de l’offre"
          },
          "mecanique": {
            "type": "string",
            "description": "Comment elle fonctionne"
          },
          "texteAnnonce": {
            "type": "string",
            "description": "Texte prêt à publier"
          },
          "impactMarge": {
            "type": "string",
            "description": "Effet chiffré sur la marge"
          },
          "quandUtiliser": {
            "type": "string",
            "description": "Quand la lancer"
          },
          "misEnPlace": {
            "type": "string",
            "description": "Où la configurer dans Shopify"
          }
        },
        "required": [
          "name",
          "mecanique",
          "texteAnnonce"
        ]
      },
      "description": "Cinq idées de promotion"
    }
  },
  "required": [
    "offers"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    await payload(req);

    const prompt = `Tu es Rémi, le Marketing. Propose cinq idées de promotion adaptées à cette niche, qui augmentent les ventes sans détruire la marge.

Varie les mécaniques : lot, deuxième article à prix réduit, palier de livraison offerte, cadeau offert, offre de lancement limitée.

Pour chaque offre :
- name : le nom commercial de l’offre ;
- mecanique : comment elle fonctionne, précisément, avec les chiffres ;
- texteAnnonce : le texte prêt à publier sur la boutique et les réseaux (deux à quatre phrases, avec émojis si c’est adapté) ;
- impactMarge : l’effet sur la marge, chiffré et honnête ;
- quandUtiliser : le bon moment pour la lancer ;
- misEnPlace : où la configurer dans Shopify, en une phrase.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
