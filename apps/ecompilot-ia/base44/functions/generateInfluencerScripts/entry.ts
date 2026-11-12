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
    "scripts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "profil": {
            "type": "string",
            "description": "Profil de créateur visé"
          },
          "format": {
            "type": "string",
            "description": "Format"
          },
          "duree": {
            "type": "string",
            "description": "Durée"
          },
          "accroche": {
            "type": "string",
            "description": "Accroche"
          },
          "script": {
            "type": "string",
            "description": "Script complet par séquences"
          },
          "consignes": {
            "type": "string",
            "description": "Consignes de tournage"
          },
          "droits": {
            "type": "string",
            "description": "Droits d’utilisation à demander"
          }
        },
        "required": [
          "profil",
          "format",
          "script"
        ]
      },
      "description": "Quatre scripts UGC"
    },
    "messages": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "Type de proposition"
          },
          "texte": {
            "type": "string",
            "description": "Message prêt à envoyer"
          }
        },
        "required": [
          "type",
          "texte"
        ]
      },
      "description": "Trois messages de contact"
    },
    "criteres": {
      "type": "string",
      "description": "Comment choisir un micro-influenceur et budget réaliste"
    },
    "mentions": {
      "type": "string",
      "description": "Obligation de signaler une collaboration rémunérée"
    }
  },
  "required": [
    "scripts",
    "messages"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { productName = '' } = await payload(req);

    const prompt = `Tu es Camille, des Réseaux Sociaux. Prépare le travail avec des créateurs de contenu et des micro-influenceurs pour ${productName ? `« ${productName} »` : 'le produit principal de cette niche'}.

Produis :
1. scripts : quatre scripts de vidéo UGC. Pour chacun : le profil de créateur visé, le format, la durée, l’accroche, le script complet découpé en séquences (image + ce qu’on dit), les consignes de tournage et les droits d’utilisation à demander.
2. messages : trois messages de prise de contact prêts à envoyer — un envoi de produit gratuit, une rémunération fixe, une commission à la vente. Courts, personnalisés, honnêtes, sans flatterie excessive.
3. criteres : comment choisir un micro-influenceur dans cette niche (taille de compte, engagement, audience française, signaux de faux abonnés) et le budget réaliste par publication.
4. Rappelle dans « mentions » que toute collaboration rémunérée doit être signalée comme publicité.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
