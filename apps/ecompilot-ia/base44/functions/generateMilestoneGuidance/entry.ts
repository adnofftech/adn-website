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
      "description": "Message d’encouragement personnalisé"
    },
    "guidance": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string",
            "description": "Clé de l’étape"
          },
          "label": {
            "type": "string",
            "description": "Nom de l’étape en français"
          },
          "status": {
            "type": "string",
            "description": "validée, en cours ou à venir"
          },
          "advice": {
            "type": "string",
            "description": "Conseil pour cette étape"
          },
          "nextAction": {
            "type": "string",
            "description": "Action suivante"
          }
        },
        "required": [
          "key",
          "label",
          "status",
          "advice",
          "nextAction"
        ]
      },
      "description": "Les huit étapes"
    },
    "blocker": {
      "type": "string",
      "description": "Blocage probable à l’étape en cours et comment le lever"
    }
  },
  "required": [
    "intro",
    "guidance"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { milestones = {} } = await payload(req);

    const done = Object.entries(milestones).filter(([, value]) => value).map(([key]) => key);

    const prompt = `Tu es Antoine, le Responsable. Voici les étapes déjà validées par l’utilisateur : ${done.length ? done.join(', ') : 'aucune pour le moment'}.

Les huit étapes du parcours sont, dans l’ordre : first_visit (première visite), first_100_visits (100 visites), first_add_to_cart (premier ajout au panier), first_sale (première vente), first_10_sales (10 ventes), first_1000_revenue (1 000 € de chiffre d’affaires), first_profitable_day (première journée rentable), first_10000_revenue (10 000 €).

Écris :
1. Un message d’encouragement personnalisé de deux phrases, qui reconnaît ce qui est déjà fait.
2. Pour chacune des huit étapes : son état (« validée », « en cours » ou « à venir »), le conseil le plus utile à ce stade (trois phrases) et l’action suivante en une phrase. L’étape « en cours » est la première non validée.
3. Le point de blocage le plus probable à l’étape en cours et comment le lever.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
