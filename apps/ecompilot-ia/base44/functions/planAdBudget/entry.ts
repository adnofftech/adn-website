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
    "plan": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "phase": {
            "type": "string",
            "description": "Nom de la phase"
          },
          "duree": {
            "type": "string",
            "description": "Durée"
          },
          "budgetJour": {
            "type": "string",
            "description": "Budget par jour"
          },
          "objectif": {
            "type": "string",
            "description": "Objectif chiffré"
          },
          "structure": {
            "type": "string",
            "description": "Structure de campagne"
          },
          "decision": {
            "type": "string",
            "description": "Décision à la fin de la phase"
          }
        },
        "required": [
          "phase",
          "duree",
          "budgetJour",
          "objectif"
        ]
      },
      "description": "Trois à quatre phases"
    },
    "totals": {
      "type": "string",
      "description": "Total dépensé et seuil de rentabilité, avec le calcul"
    },
    "rules": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Règle de gestion du budget"
      },
      "description": "Quatre à six règles"
    },
    "avoid": {
      "type": "string",
      "description": "Ce qu’il ne faut pas faire avec un petit budget"
    }
  },
  "required": [
    "plan",
    "totals",
    "rules"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { budget = '', goals = '' } = await payload(req);

    const prompt = `Tu es Rémi, le Marketing. Construis un plan de budget publicitaire pour cette niche.

Budget total disponible : ${budget || 'non précisé — pars alors sur 300 € pour un premier mois'}.
Objectif de l’utilisateur : ${goals || 'valider un produit et obtenir ses premières ventes'}.

Produis :
1. Un plan en trois ou quatre phases (test, apprentissage, optimisation, montée en puissance). Pour chacune : la durée, le budget par jour, l’objectif chiffré, la structure de campagne à mettre en place et la décision à prendre à la fin de la phase (continuer, couper, augmenter).
2. Le total dépensé et le nombre de ventes nécessaires pour rentrer dans ses frais, avec le calcul.
3. Quatre à six règles simples de gestion du budget (quand couper une publicité, de combien augmenter, à quelle fréquence regarder les chiffres).
4. Ce qu’il ne faut surtout pas faire avec un petit budget.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
