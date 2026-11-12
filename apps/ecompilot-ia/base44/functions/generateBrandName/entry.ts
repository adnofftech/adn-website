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
    "names": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Nom de marque"
          },
          "pourquoi": {
            "type": "string",
            "description": "Ce qu’il évoque"
          },
          "domaine": {
            "type": "string",
            "description": "Domaine à vérifier"
          },
          "instagram": {
            "type": "string",
            "description": "Pseudo à vérifier"
          },
          "slogan": {
            "type": "string",
            "description": "Accroche de marque"
          }
        },
        "required": [
          "name",
          "pourquoi"
        ]
      },
      "description": "Dix noms de marque"
    },
    "verification": {
      "type": "string",
      "description": "Rappel des vérifications à faire avant usage"
    }
  },
  "required": [
    "names"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { style = '' } = await payload(req);

    const prompt = `Tu es Claire, la rédactrice. Propose dix noms de marque pour une boutique de cette niche.
${style ? `Style demandé : ${style}.` : 'Varie les styles : évocateur, inventé, descriptif, affectueux, premium.'}

Pour chaque nom :
- name : le nom, prononçable en français, facile à écrire sous la dictée, sans accent compliqué ;
- pourquoi : ce qu’il évoque et à qui il parle, en une ou deux phrases ;
- domaine : le nom de domaine à vérifier (en .fr et .com) ;
- instagram : le pseudo à vérifier ;
- slogan : une accroche de marque de moins de 60 caractères.

Évite les noms déjà très connus, les marques déposées évidentes, les anglicismes creux et les noms à rallonge.
Précise dans « verification » que la disponibilité du domaine, du pseudo et de la marque doit être vérifiée avant usage.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
