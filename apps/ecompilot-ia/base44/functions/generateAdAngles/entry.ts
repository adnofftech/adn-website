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
    "angles": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Nom de l’angle"
          },
          "situation": {
            "type": "string",
            "description": "Scène de vie du client"
          },
          "benefice": {
            "type": "string",
            "description": "Bénéfice final"
          },
          "scene": {
            "type": "string",
            "description": "Ce que montre la vidéo"
          },
          "hook": {
            "type": "string",
            "description": "Accroche des trois premières secondes"
          }
        },
        "required": [
          "name",
          "situation",
          "benefice",
          "scene",
          "hook"
        ]
      },
      "description": "Trois angles distincts"
    }
  },
  "required": [
    "angles"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { productName = '' } = await payload(req);

    const prompt = `Tu es Rémi, le Marketing. Propose trois angles publicitaires émotionnels et nettement différents pour ${productName ? `le produit « ${productName} »` : 'le produit principal de cette niche'}.

Les trois angles doivent viser trois ressorts différents : par exemple la douleur évitée, le désir atteint, et la preuve sociale ou l’identité.

Pour chaque angle :
- name : le nom de l’angle, court et parlant ;
- situation : la scène de vie du client au moment où il a besoin du produit, en deux ou trois phrases concrètes ;
- benefice : le bénéfice final en langage de client, pas de vendeur ;
- scene : ce que montre la vidéo, plan par plan, en deux ou trois phrases ;
- hook : la phrase d’accroche des trois premières secondes, prête à lire face caméra.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
