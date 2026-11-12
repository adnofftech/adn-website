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
    "analysis": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "element": {
            "type": "string",
            "description": "Élément analysé"
          },
          "observation": {
            "type": "string",
            "description": "Ce qu’on observe"
          },
          "pourquoiCaMarche": {
            "type": "string",
            "description": "Pourquoi ça fonctionne ou non"
          },
          "aReprendre": {
            "type": "string",
            "description": "Ce qu’il faut reprendre"
          }
        },
        "required": [
          "element",
          "observation"
        ]
      },
      "description": "Analyse élément par élément"
    },
    "verdict": {
      "type": "string",
      "description": "Verdict en deux phrases"
    },
    "improvements": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Amélioration"
      },
      "description": "Trois à cinq améliorations"
    },
    "traps": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Piège à éviter"
      },
      "description": "Pièges à ne pas copier"
    }
  },
  "required": [
    "analysis",
    "verdict",
    "improvements"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { ads = '' } = await payload(req);

    const prompt = `Tu es Rémi, le Marketing. Analyse la ou les publicités suivantes, repérées chez des concurrents : « ${ads || 'aucune publicité fournie : explique alors comment analyser une publicité concurrente et donne la grille de lecture complète'} ».

Produis :
1. Une analyse élément par élément (accroche, visuel, texte, preuve, appel à l’action, offre, commentaires). Pour chacun : l’observation, pourquoi ça marche (ou pas), et ce qu’il faut reprendre pour sa propre boutique.
2. Un verdict en deux phrases : est-ce une publicité qui tourne depuis longtemps et pourquoi.
3. Trois à cinq améliorations à apporter si on devait refaire cette publicité en mieux.
4. Deux pièges à ne pas copier.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
