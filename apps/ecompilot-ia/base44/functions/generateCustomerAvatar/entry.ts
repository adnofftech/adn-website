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
    "name": {
      "type": "string",
      "description": "Prénom et qualificatif"
    },
    "portrait": {
      "type": "string",
      "description": "Portrait en trois phrases"
    },
    "age": {
      "type": "string",
      "description": "Tranche d’âge"
    },
    "situation": {
      "type": "string",
      "description": "Situation de vie et budget"
    },
    "douleurs": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Douleur"
      },
      "description": "Cinq douleurs"
    },
    "desirs": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Désir"
      },
      "description": "Cinq désirs"
    },
    "objections": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Objection"
      },
      "description": "Cinq objections"
    },
    "motsUtilises": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Mot ou expression du client"
      },
      "description": "Huit expressions"
    },
    "ouLeTrouver": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Où l’atteindre"
      },
      "description": "Cinq endroits précis"
    },
    "messageQuiTouche": {
      "type": "string",
      "description": "Le message qui le ferait s’arrêter"
    }
  },
  "required": [
    "name",
    "portrait",
    "douleurs",
    "desirs",
    "objections"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    await payload(req);

    const prompt = `Tu es Samuel, le Service Client. Décris le client idéal d’une boutique de cette niche, de façon si précise qu’on puisse lui écrire directement.

Produis :
- name : un prénom et un qualificatif (ex. « Sophie, la maîtresse débordée ») ;
- portrait : trois phrases de portrait concret ;
- age : la tranche d’âge ;
- situation : sa situation de vie, son budget, son rapport à l’achat en ligne ;
- douleurs : cinq douleurs réelles, dans ses mots ;
- desirs : cinq désirs, dans ses mots ;
- objections : cinq objections avant l’achat ;
- motsUtilises : huit mots ou expressions qu’il ou elle emploie, et que l’on doit reprendre dans les textes ;
- ouLeTrouver : cinq endroits précis où l’atteindre (plateformes, formats, comptes, moments de la journée) ;
- messageQuiTouche : le message qui le ferait s’arrêter de défiler, en deux phrases.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
