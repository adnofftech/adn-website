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
    "guarantees": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "titre": {
            "type": "string",
            "description": "Intitulé de la garantie"
          },
          "texte": {
            "type": "string",
            "description": "Texte à afficher"
          },
          "conditions": {
            "type": "string",
            "description": "Conditions"
          }
        },
        "required": [
          "titre",
          "texte"
        ]
      },
      "description": "Trois garanties"
    },
    "faqs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": {
            "type": "string",
            "description": "Question"
          },
          "reponse": {
            "type": "string",
            "description": "Réponse"
          }
        },
        "required": [
          "question",
          "reponse"
        ]
      },
      "description": "Six questions fréquentes"
    },
    "badges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string",
            "description": "Élément de réassurance"
          },
          "texte": {
            "type": "string",
            "description": "Texte exact"
          },
          "emplacement": {
            "type": "string",
            "description": "Où l’afficher"
          }
        },
        "required": [
          "label",
          "texte"
        ]
      },
      "description": "Six éléments de réassurance"
    },
    "placement": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Emplacement conseillé"
      },
      "description": "Liste ordonnée"
    },
    "reviewPolicy": {
      "type": "string",
      "description": "Comment obtenir de vrais avis"
    }
  },
  "required": [
    "guarantees",
    "faqs",
    "badges"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    await payload(req);

    const prompt = `Tu es Samuel, le Service Client. Prépare tout ce qui crée la confiance sur une boutique de cette niche.

Produis :
- guarantees : trois textes de garantie crédibles et tenables (satisfait ou remboursé, délai de retour, garantie produit), avec leurs conditions ;
- faqs : six questions fréquentes avec leur réponse honnête ;
- badges : six éléments de réassurance à afficher (paiement sécurisé, délai de livraison, service client, retours, mentions légales…), avec le texte exact et l’endroit où les mettre ;
- placement : la liste ordonnée des endroits où placer ces éléments sur la page produit et dans le tunnel de commande ;
- reviewPolicy : comment obtenir de vrais avis clients et pourquoi il ne faut jamais en inventer ni en acheter. Rappelle qu’un faux avis est une pratique commerciale trompeuse interdite en France.

N’invente aucun avis client, aucun chiffre de clients servis, aucune note moyenne.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
