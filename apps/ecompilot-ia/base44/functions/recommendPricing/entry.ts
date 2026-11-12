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
    "prixRecommande": {
      "type": "string",
      "description": "Prix de vente conseillé"
    },
    "fourchette": {
      "type": "string",
      "description": "Fourchette acceptable et raisons"
    },
    "marges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "scenario": {
            "type": "string",
            "description": "Scénario"
          },
          "prixVente": {
            "type": "string",
            "description": "Prix de vente"
          },
          "margeBrute": {
            "type": "string",
            "description": "Marge brute"
          },
          "margeNette": {
            "type": "string",
            "description": "Marge nette après tous les frais"
          },
          "calcul": {
            "type": "string",
            "description": "Détail du calcul"
          }
        },
        "required": [
          "scenario",
          "prixVente",
          "margeBrute",
          "margeNette"
        ]
      },
      "description": "Trois scénarios de prix"
    },
    "livraison": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "option": {
            "type": "string",
            "description": "Option de livraison"
          },
          "prix": {
            "type": "string",
            "description": "Prix affiché"
          },
          "effet": {
            "type": "string",
            "description": "Effet sur la conversion et la marge"
          }
        },
        "required": [
          "option",
          "effet"
        ]
      },
      "description": "Trois options de livraison"
    },
    "tests": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Test de prix à mener"
      },
      "description": "Deux tests ordonnés"
    },
    "explication": {
      "type": "string",
      "description": "Pourquoi ce prix tient"
    }
  },
  "required": [
    "prixRecommande",
    "fourchette",
    "marges",
    "livraison"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { cost = '', product = '', shipping = '' } = await payload(req);

    const prompt = `Tu es Maxime, la Comptabilité de Ta Team. Recommande un prix de vente et une politique de livraison pour cette niche.

Produit : ${product || 'le produit principal de la niche'}.
Coût d’achat indiqué : ${cost || 'non précisé — pars alors sur un coût de 8 € et dis-le'}.
Livraison indiquée : ${shipping || 'non précisée — pars alors sur 3 € de frais réels'}.

Produis :
- prixRecommande : le prix de vente conseillé, avec le prix psychologique (ex. 39,90 €) ;
- fourchette : la fourchette acceptable, du prix plancher au prix plafond, avec la raison de chaque borne ;
- marges : trois scénarios (prix bas, prix conseillé, prix haut). Pour chacun : le prix de vente, la marge brute et la marge nette après coût produit, livraison, frais de paiement (environ 2 % + 0,25 €), budget publicitaire par vente et retours. Donne les calculs ;
- livraison : trois options (livraison offerte, forfait, palier de gratuité), avec l’effet sur la conversion et sur la marge ;
- tests : deux tests de prix à mener dans l’ordre, avec la durée et le chiffre qui tranche ;
- explication : en trois phrases, pourquoi ce prix tient, pour un débutant.

Annonce les marges honnêtement : si le produit ne permet pas 60 % de marge brute, dis-le franchement.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
