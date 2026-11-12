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
    "tips": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "zone": {
            "type": "string",
            "description": "Zone concernée"
          },
          "probleme": {
            "type": "string",
            "description": "Ce qui bloque le client"
          },
          "correction": {
            "type": "string",
            "description": "Correction exacte"
          },
          "impact": {
            "type": "string",
            "description": "Effet attendu"
          },
          "difficulte": {
            "type": "string",
            "description": "Facile, moyen ou difficile"
          },
          "temps": {
            "type": "string",
            "description": "Temps à prévoir"
          }
        },
        "required": [
          "zone",
          "probleme",
          "correction"
        ]
      },
      "description": "Dix conseils ordonnés"
    },
    "priority": {
      "type": "string",
      "description": "Le conseil à traiter en premier et pourquoi"
    }
  },
  "required": [
    "tips"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { storeUrl = '' } = await payload(req);

    const prompt = `Tu es Samuel, le Service Client, et tu relis la boutique avec les yeux d’un client qui arrive pour la première fois${storeUrl ? ` (boutique indiquée : ${storeUrl})` : ''}.

Produis dix conseils d’amélioration pour une boutique de cette niche, du plus rentable au moins urgent. Pour chacun :
- zone : la zone concernée (page d’accueil, fiche produit, panier, paiement, mobile, livraison, confiance, service client) ;
- probleme : ce qui bloque le client, décrit concrètement ;
- correction : la correction exacte, faisable dans Shopify, avec le texte à écrire quand c’est pertinent ;
- impact : l’effet attendu sur les ventes, honnête et nuancé ;
- difficulte : facile, moyen ou difficile ;
- temps : le temps à prévoir.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
