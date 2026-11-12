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
    "analyse": {
      "type": "string",
      "description": "Ce que demande le client"
    },
    "reponse": {
      "type": "string",
      "description": "Réponse complète à envoyer"
    },
    "versionCourte": {
      "type": "string",
      "description": "Version en trois phrases"
    },
    "versionLongue": {
      "type": "string",
      "description": "Version détaillée"
    },
    "aEviter": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Formulation à éviter et pourquoi"
      },
      "description": "Trois formulations à éviter"
    },
    "suivi": {
      "type": "string",
      "description": "Ce qu’il faut faire après l’envoi"
    }
  },
  "required": [
    "analyse",
    "reponse"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { message = '', context = '', channel = 'e-mail' } = await payload(req);

    const prompt = `Tu es Samuel, le Service Client de Ta Team. Prépare la réponse à envoyer à un client.

Message reçu : « ${message || 'aucun message fourni : écris alors les cinq réponses types les plus utiles dans cette niche'} ».
Contexte donné par le vendeur : ${context || 'aucun'}.
Canal : ${channel}.

Produis :
- analyse : ce que demande vraiment le client et son état d’esprit, en deux phrases ;
- reponse : la réponse complète à envoyer, prête à copier. Ton calme, poli, tutoiement ou vouvoiement selon le canal, une solution claire, un délai précis, jamais de promesse intenable ;
- versionCourte : la même réponse en trois phrases, pour un message privé sur les réseaux ;
- versionLongue : une version plus détaillée avec les étapes de la procédure ;
- aEviter : trois formulations à ne pas employer dans cette situation, avec la raison ;
- suivi : ce qu’il faut faire après l’envoi (relance, remboursement, geste commercial) et dans quel délai.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
