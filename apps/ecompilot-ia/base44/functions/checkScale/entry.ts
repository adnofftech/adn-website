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
    "verdict": {
      "type": "string",
      "description": "Prêt à scaler, presque prêt ou pas encore"
    },
    "score": {
      "type": "integer",
      "description": "Score de préparation sur 100"
    },
    "readiness": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "critere": {
            "type": "string",
            "description": "Nom du critère"
          },
          "etat": {
            "type": "string",
            "description": "vert, orange ou rouge"
          },
          "seuil": {
            "type": "string",
            "description": "Seuil de référence"
          },
          "commentaire": {
            "type": "string",
            "description": "Commentaire en une phrase"
          }
        },
        "required": [
          "critere",
          "etat"
        ]
      },
      "description": "Grille des six critères"
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Recommandation concrète"
      },
      "description": "Recommandations ordonnées"
    },
    "risk": {
      "type": "string",
      "description": "Principal risque à scaler maintenant"
    }
  },
  "required": [
    "verdict",
    "score",
    "readiness",
    "recommendations"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { metrics = '' } = await payload(req);

    const prompt = `Tu es Antoine, le Responsable, et tu évalues si la boutique est prête à passer à l’échelle (augmenter les budgets publicitaires).

Chiffres fournis par l’utilisateur : « ${metrics || 'aucun chiffre fourni : explique alors quels chiffres sont nécessaires et donne les seuils de référence pour cette niche'} ».

Produis :
1. Un verdict franc en une phrase : « prêt à scaler », « presque prêt » ou « pas encore ».
2. Un score de préparation sur 100.
3. Une grille de six critères (régularité des ventes, marge nette, coût d’acquisition, taux de conversion, trésorerie, service client). Pour chacun : l’état (« vert », « orange » ou « rouge »), le seuil de référence et un commentaire d’une phrase.
4. Trois à cinq recommandations concrètes et ordonnées, avec le chiffre à atteindre.
5. Le principal risque si la personne augmente les budgets maintenant.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
