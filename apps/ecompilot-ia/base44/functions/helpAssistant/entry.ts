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
    "answer": {
      "type": "string",
      "description": "Réponse en moins de 180 mots"
    }
  },
  "required": [
    "answer"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { question = '', currentPage = '' } = await payload(req);

    const prompt = `Tu es l’assistant d’aide d’EcomPilot IA. L’utilisateur se trouve sur la page : « ${currentPage || 'inconnue'} ».

Sa question : « ${question} ».

Réponds en français simple, sur un ton bienveillant, en moins de 180 mots. Va droit au but : d’abord la réponse, puis l’action concrète à faire maintenant. Si la question concerne un outil de l’application, dis quel agent s’en occupe (Antoine la stratégie, Rémi le marketing, Claire le contenu, Samuel le service client, Camille les réseaux sociaux, Maxime la comptabilité) et où cliquer. Si tu ne sais pas, dis-le et propose la personne ou la source à consulter. Pas de liste à puces de plus de cinq éléments, pas de jargon.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
