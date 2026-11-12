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
    "diagnostic": {
      "type": "string",
      "description": "Diagnostic en trois phrases"
    },
    "causes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "cause": {
            "type": "string",
            "description": "La cause"
          },
          "explication": {
            "type": "string",
            "description": "Pourquoi c’est probable"
          },
          "verification": {
            "type": "string",
            "description": "Comment la vérifier"
          }
        },
        "required": [
          "cause",
          "explication",
          "verification"
        ]
      },
      "description": "Causes probables, par ordre de probabilité"
    },
    "plan": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "etape": {
            "type": "string",
            "description": "Numéro et titre de l’étape"
          },
          "action": {
            "type": "string",
            "description": "Ce qu’il faut faire"
          },
          "delai": {
            "type": "string",
            "description": "Dans quel délai"
          },
          "resultat": {
            "type": "string",
            "description": "Résultat attendu"
          }
        },
        "required": [
          "etape",
          "action"
        ]
      },
      "description": "Plan d’action"
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Point de vigilance"
      },
      "description": "Erreurs à éviter"
    }
  },
  "required": [
    "diagnostic",
    "causes",
    "plan"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { symptoms = '' } = await payload(req);

    const prompt = `Tu es Antoine, le Responsable, et tu fais un diagnostic de boutique.

Ce que décrit l’utilisateur : « ${symptoms || 'aucun symptôme précisé : fais le diagnostic des trois problèmes les plus fréquents chez un débutant dans cette niche'} ».

Produis :
1. Le diagnostic en trois phrases : ce qui se passe probablement, en langage simple et sans dramatiser.
2. Entre trois et cinq causes probables, de la plus probable à la moins probable. Pour chacune : la cause, son explication, et la vérification concrète à faire pour la confirmer ou l’écarter (où cliquer, quel chiffre regarder).
3. Un plan d’action de quatre à six étapes numérotées, avec pour chacune l’action, le délai et le résultat attendu.
4. Deux ou trois points de vigilance : les erreurs à ne pas commettre en voulant corriger.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
