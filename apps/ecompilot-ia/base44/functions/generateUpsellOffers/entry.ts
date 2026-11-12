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
          "type": {
            "type": "string",
            "description": "Type d’offre"
          },
          "name": {
            "type": "string",
            "description": "Nom affiché"
          },
          "produitPrincipal": {
            "type": "string",
            "description": "Achat de départ"
          },
          "complement": {
            "type": "string",
            "description": "Ce qu’on ajoute"
          },
          "prix": {
            "type": "string",
            "description": "Prix conseillé et marge"
          },
          "texteAffiche": {
            "type": "string",
            "description": "Phrase affichée au client"
          },
          "emplacement": {
            "type": "string",
            "description": "Où la montrer"
          },
          "gainPanier": {
            "type": "string",
            "description": "Gain de panier moyen attendu"
          }
        },
        "required": [
          "type",
          "name",
          "texteAffiche",
          "emplacement"
        ]
      },
      "description": "Cinq offres supplémentaires"
    }
  },
  "required": [
    "offers"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { productName = '' } = await payload(req);

    const prompt = `Tu es Rémi, le Marketing. Construis cinq offres supplémentaires (upsell, cross-sell, lots) autour ${productName ? `du produit « ${productName} »` : 'du produit principal de cette niche'}.

Pour chaque offre :
- type : upsell, cross-sell, lot, abonnement ou garantie payante ;
- name : le nom affiché au client ;
- produitPrincipal : à quel achat elle se greffe ;
- complement : ce qu’on ajoute, et pourquoi c’est logique pour le client ;
- prix : le prix conseillé, avec la marge attendue ;
- texteAffiche : la phrase affichée au client, prête à copier ;
- emplacement : où la montrer (page produit, panier, page de paiement, page de remerciement) ;
- gainPanier : l’augmentation de panier moyen attendue, chiffrée et prudente.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
