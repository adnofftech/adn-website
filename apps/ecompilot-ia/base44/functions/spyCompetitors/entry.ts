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
    "competitors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Nom de la boutique"
          },
          "site": {
            "type": "string",
            "description": "Adresse du site"
          },
          "positioning": {
            "type": "string",
            "description": "Positionnement en une phrase"
          },
          "priceRange": {
            "type": "string",
            "description": "Fourchette de prix observée"
          },
          "offer": {
            "type": "string",
            "description": "Offre commerciale"
          },
          "adAngles": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Angle publicitaire"
            },
            "description": "Angles repérés"
          },
          "creativeStyle": {
            "type": "string",
            "description": "Style des créations"
          },
          "strengths": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Force"
            },
            "description": "Deux forces"
          },
          "weaknesses": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Faiblesse"
            },
            "description": "Deux faiblesses"
          },
          "lessonForYou": {
            "type": "string",
            "description": "Leçon à en tirer"
          },
          "adLibraryQuery": {
            "type": "string",
            "description": "Requête Facebook Ad Library"
          }
        },
        "required": [
          "name",
          "positioning"
        ]
      },
      "description": "Quatre à six concurrents"
    }
  },
  "required": [
    "competitors"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { niche = '', product = '' } = await payload(req);

    const prompt = `Tu es Rémi, le Marketing. Recherche sur le web les boutiques qui vendent déjà ${product ? `« ${product} »` : 'dans cette niche'} ${niche ? `(niche précisée : ${niche})` : ''}, sur le marché français et européen.

Donne entre quatre et six concurrents réels. Pour chacun :
- son nom et son site ;
- son positionnement en une phrase ;
- sa fourchette de prix observée ;
- son offre (lots, livraison, garantie, promotions) ;
- ses angles publicitaires repérés (deux à quatre) ;
- son style de création (type de vidéo, voix off, mise en scène) ;
- deux forces et deux faiblesses ;
- la leçon à en tirer pour une boutique qui démarre ;
- adLibraryQuery : la requête à taper dans la Facebook Ad Library pour voir ses publicités.

Si tu n’es pas certain d’un concurrent, dis-le dans son positionnement plutôt que d’inventer.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA, web: true });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
