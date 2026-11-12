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
      "description": "Deux phrases d’introduction"
    },
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string",
            "description": "Label court"
          },
          "type": {
            "type": "string",
            "description": "text ou list"
          },
          "content": {
            "type": "string",
            "description": "Contenu ; pour une liste, un élément par ligne"
          }
        },
        "required": [
          "label",
          "type",
          "content"
        ]
      },
      "description": "Trois à six sections actionnables"
    }
  },
  "required": [
    "intro",
    "sections"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { prompt: challenge = '', title = '', day = null } = await payload(req);

    const prompt = `Tu es l’agent de Ta Team chargé du défi du jour${day ? ` (jour ${day})` : ''}${title ? `, intitulé « ${title} »` : ''}.

Voici la demande de l’utilisateur, à traiter complètement :
« ${challenge} »

Structure ta réponse ainsi :
- intro : deux phrases qui disent ce que l’utilisateur va obtenir et pourquoi c’est utile aujourd’hui.
- sections : entre trois et six sections actionnables. Pour chacune : un label court, un type (« text » pour un paragraphe, « list » pour une énumération) et le contenu. Pour une section de type « list », écris un élément par ligne, sans puce ni tiret au début. Pour une section de type « text », écris deux à cinq phrases.
Termine par une section dont le label est « Ton action de maintenant » et qui donne la seule chose à faire dans les trente prochaines minutes.

Tout doit être spécifique à la niche de l’utilisateur, chiffré quand c’est possible, et directement utilisable.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
