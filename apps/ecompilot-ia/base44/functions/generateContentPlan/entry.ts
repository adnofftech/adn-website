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
    "posts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "day": {
            "type": "string",
            "description": "Jour"
          },
          "format": {
            "type": "string",
            "description": "Format"
          },
          "plateforme": {
            "type": "string",
            "description": "Plateforme"
          },
          "idee": {
            "type": "string",
            "description": "Idée"
          },
          "accroche": {
            "type": "string",
            "description": "Accroche des trois premières secondes"
          },
          "legende": {
            "type": "string",
            "description": "Légende complète"
          },
          "hashtags": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Hashtag"
            },
            "description": "Huit hashtags"
          },
          "heure": {
            "type": "string",
            "description": "Heure conseillée"
          }
        },
        "required": [
          "day",
          "format",
          "idee",
          "accroche",
          "legende"
        ]
      },
      "description": "Une publication par jour"
    },
    "rythme": {
      "type": "string",
      "description": "Conseil de régularité"
    }
  },
  "required": [
    "posts"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { platform = 'Instagram et TikTok', days = 14 } = await payload(req);

    const prompt = `Tu es Camille, des Réseaux Sociaux. Construis un calendrier de contenu organique pour cette niche, sur ${days} jours, pour ${platform}.

Un contenu par jour, tournable seul avec un téléphone. Varie les formats : démonstration, conseil, coulisses, avis client, question, humour, avant/après, erreur fréquente, offre.

Pour chaque publication :
- day : le jour (1, 2, 3…) ;
- format : le format (vidéo courte, carrousel, photo, story) ;
- plateforme : où publier ;
- idee : l’idée en une phrase ;
- accroche : les trois premières secondes, prêtes à dire ;
- legende : la légende complète, prête à copier, avec appel à commenter ;
- hashtags : huit hashtags français pertinents ;
- heure : l’heure de publication conseillée.

Termine par « rythme » : le conseil de régularité tenable pour quelqu’un qui travaille seul.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
