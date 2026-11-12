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
    "resume": {
      "type": "string",
      "description": "Ce qu’il reste vraiment, en trois phrases"
    },
    "calcul": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "poste": {
            "type": "string",
            "description": "Poste"
          },
          "montant": {
            "type": "string",
            "description": "Montant"
          },
          "explication": {
            "type": "string",
            "description": "Explication en une phrase"
          }
        },
        "required": [
          "poste",
          "montant"
        ]
      },
      "description": "Décomposition ligne par ligne"
    },
    "margeNette": {
      "type": "string",
      "description": "Bénéfice net"
    },
    "margeNettePct": {
      "type": "number",
      "description": "Marge nette en pourcentage"
    },
    "panierMoyen": {
      "type": "string",
      "description": "Panier moyen"
    },
    "coutAcquisition": {
      "type": "string",
      "description": "Coût d’acquisition par commande"
    },
    "seuilRentabilite": {
      "type": "string",
      "description": "Commandes nécessaires et calcul"
    },
    "conseils": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Action chiffrée"
      },
      "description": "Trois à cinq conseils"
    },
    "alerte": {
      "type": "string",
      "description": "Signal à surveiller"
    }
  },
  "required": [
    "resume",
    "calcul",
    "margeNette",
    "conseils"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const {
      revenue = 0,
      orders = 0,
      productCost = 0,
      shippingCost = 0,
      adSpend = 0,
      fixedCosts = [],
      currency = 'EUR',
    } = await payload(req);

    const fixedList = (Array.isArray(fixedCosts) ? fixedCosts : [])
      .map((cost: any) => `${cost.label || 'charge'} : ${cost.amount || 0} ${currency} par mois`)
      .join(' ; ');

    const prompt = `Tu es Maxime, la Comptabilité. Calcule le bénéfice réel de cette boutique et explique chaque ligne.

Chiffres de la période :
- chiffre d’affaires : ${revenue} ${currency}
- nombre de commandes : ${orders}
- coût produit par commande : ${productCost} ${currency}
- livraison par commande : ${shippingCost} ${currency}
- dépenses publicitaires : ${adSpend} ${currency}
- charges fixes mensuelles : ${fixedList || 'aucune indiquée'}

Produis :
- resume : en trois phrases, ce qu’il reste vraiment et ce que ça veut dire ;
- calcul : la décomposition ligne par ligne (chiffre d’affaires, coût des produits, livraison, frais de paiement estimés à 2 % + 0,25 € par commande, publicité, charges fixes, résultat). Pour chaque poste : le montant et son explication en une phrase ;
- margeNette : le bénéfice net en euros ;
- margeNettePct : la marge nette en pourcentage du chiffre d’affaires ;
- panierMoyen : le panier moyen ;
- coutAcquisition : le coût d’acquisition par commande ;
- seuilRentabilite : le nombre de commandes nécessaires pour couvrir les charges, avec le calcul ;
- conseils : trois à cinq actions chiffrées pour améliorer le résultat, de la plus rentable à la moins urgente ;
- alerte : le signal à surveiller en priorité, s’il y en a un.

Utilise uniquement les chiffres fournis. Si une donnée manque, dis-le au lieu de l’inventer.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
