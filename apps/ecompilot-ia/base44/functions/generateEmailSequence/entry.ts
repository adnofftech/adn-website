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
    "emails": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "day": {
            "type": "string",
            "description": "Numéro d’envoi"
          },
          "timing": {
            "type": "string",
            "description": "Moment d’envoi"
          },
          "subject": {
            "type": "string",
            "description": "Objet"
          },
          "preheader": {
            "type": "string",
            "description": "Texte d’aperçu"
          },
          "body": {
            "type": "string",
            "description": "Corps de l’e-mail"
          },
          "cta": {
            "type": "string",
            "description": "Texte du bouton"
          }
        },
        "required": [
          "day",
          "timing",
          "subject",
          "body",
          "cta"
        ]
      },
      "description": "Six e-mails"
    }
  },
  "required": [
    "emails"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { goal = '' } = await payload(req);

    const prompt = `Tu es Claire, la rédactrice. Écris une séquence d’e-mails automatisés pour une boutique de cette niche.

Objectif de la séquence : ${goal || 'bienvenue puis récupération des paniers abandonnés'}.

Produis six e-mails. Pour chacun :
- day : le numéro d’envoi (1, 2, 3…) ;
- timing : le moment d’envoi (ex. « 1 heure après l’inscription », « 24 heures après l’abandon ») ;
- subject : l’objet, moins de 50 caractères, qui donne envie d’ouvrir sans tromper ;
- preheader : le texte d’aperçu, moins de 90 caractères ;
- body : le corps de l’e-mail, 120 à 220 mots, tutoiement, ton humain, un seul message par e-mail ;
- cta : le texte du bouton.

Pas de fausse urgence, pas de faux stock, pas de compte à rebours mensonger.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
