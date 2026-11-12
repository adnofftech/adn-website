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
    "briefs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Titre du brief"
          },
          "objectif": {
            "type": "string",
            "description": "Objectif"
          },
          "scenario": {
            "type": "string",
            "description": "Scénario"
          },
          "plans": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Plan à tourner"
            },
            "description": "Trois à cinq plans"
          },
          "texteEcran": {
            "type": "string",
            "description": "Texte affiché à l’écran"
          },
          "materiel": {
            "type": "string",
            "description": "Matériel nécessaire"
          }
        },
        "required": [
          "title",
          "objectif",
          "scenario"
        ]
      },
      "description": "Quatre briefs créatifs"
    },
    "prompts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string",
            "description": "Label en français"
          },
          "prompt": {
            "type": "string",
            "description": "Prompt en anglais"
          },
          "ratio": {
            "type": "string",
            "description": "Format conseillé"
          }
        },
        "required": [
          "label",
          "prompt"
        ]
      },
      "description": "Six prompts d’image"
    }
  },
  "required": [
    "briefs",
    "prompts"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { productName = '' } = await payload(req);

    const prompt = `Tu es Claire, la rédactrice. Prépare les briefs créatifs et les prompts d’image pour ${productName ? `« ${productName} »` : 'le produit principal de cette niche'}.

Produis :
1. briefs : quatre briefs de création filmables avec un téléphone. Pour chacun : le titre, l’objectif, le scénario en deux ou trois phrases, les plans à tourner (liste de trois à cinq plans), le texte à afficher à l’écran et le matériel nécessaire (toujours minimal).
2. prompts : six prompts d’image, écrits en anglais, prêts à coller dans un générateur d’images. Pour chacun : un label en français, le prompt en anglais (précis : sujet, décor, lumière, angle, style) et le format conseillé (1:1, 4:5 ou 9:16). Les trois premiers sur fond blanc pour la fiche produit, les trois autres en situation de vie.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
