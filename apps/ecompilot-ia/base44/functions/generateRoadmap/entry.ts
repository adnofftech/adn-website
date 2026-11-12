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
    "intro": {
      "type": "string",
      "description": "Introduction en trois phrases"
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Titre de l’étape"
          },
          "description": {
            "type": "string",
            "description": "Quoi faire et pourquoi"
          },
          "action": {
            "type": "string",
            "description": "Première action, à l’impératif"
          }
        },
        "required": [
          "title",
          "description",
          "action"
        ]
      },
      "description": "Huit à dix étapes"
    }
  },
  "required": [
    "intro",
    "steps"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    await payload(req);

    const prompt = `Tu es Antoine, le Responsable. Écris la feuille de route « Mes premiers 1 000 € » pour une personne qui démarre de zéro dans sa niche, sur Shopify, en dropshipping.

Commence par une introduction de trois phrases qui rassure et annonce le chemin.
Puis donne entre huit et dix étapes dans l’ordre chronologique. Pour chaque étape : un titre court, une description de trois à cinq phrases qui explique quoi faire et pourquoi, puis « action » : la première chose à faire tout de suite, en une phrase à l’impératif.
Les étapes doivent couvrir : le choix du produit, la boutique, la fiche produit, le prix, les pages légales, la première campagne, la lecture des chiffres, la première vente, les dix premières ventes, le passage à 1 000 €.
Donne des budgets et des délais réalistes pour un budget de départ modeste.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
