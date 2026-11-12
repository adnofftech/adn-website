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
    "imageFeedback": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Remarque sur la photo"
      },
      "description": "Trois à cinq remarques"
    },
    "title": {
      "type": "string",
      "description": "Titre de la fiche produit"
    },
    "shortDescription": {
      "type": "string",
      "description": "Accroche courte"
    },
    "description": {
      "type": "string",
      "description": "Description longue"
    },
    "bullets": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Bénéfice"
      },
      "description": "Cinq à sept bénéfices"
    },
    "features": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Caractéristique au format Intitulé : valeur"
      },
      "description": "Quatre à six caractéristiques"
    },
    "faqs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": {
            "type": "string",
            "description": "Question"
          },
          "reponse": {
            "type": "string",
            "description": "Réponse"
          }
        },
        "required": [
          "question",
          "reponse"
        ]
      },
      "description": "Cinq questions fréquentes"
    },
    "seoTitle": {
      "type": "string",
      "description": "Titre SEO, 60 caractères maximum"
    },
    "seoDescription": {
      "type": "string",
      "description": "Description SEO, 155 caractères maximum"
    },
    "guarantee": {
      "type": "string",
      "description": "Texte de garantie"
    },
    "cta": {
      "type": "string",
      "description": "Appel à l’action"
    }
  },
  "required": [
    "title",
    "shortDescription",
    "description",
    "bullets",
    "features",
    "faqs",
    "seoTitle",
    "seoDescription",
    "cta"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { imageUrl = '', productName = '' } = await payload(req);

    const prompt = `Tu es Claire, la rédactrice. Construis une fiche produit complète et orientée conversion pour ${productName ? `« ${productName} »` : 'le produit de la photo fournie'}.

Produis :
- imageFeedback : trois à cinq remarques concrètes sur la photo fournie (cadrage, fond, lumière, mise en situation, ce qu’il manque). Si aucune photo n’est fournie, donne les cinq règles d’une bonne photo produit dans cette niche.
- title : le titre de la fiche produit, moins de 70 caractères, bénéfice en premier.
- shortDescription : l’accroche sous le titre, deux phrases.
- description : la description longue, trois à quatre paragraphes, qui raconte la situation du client, le problème, la solution et le résultat.
- bullets : cinq à sept bénéfices écrits sous la forme « Grâce à X, tu pourras Y ».
- features : quatre à six caractéristiques au format « Intitulé : valeur » (matière, dimensions, contenu du colis, entretien, compatibilité).
- faqs : cinq questions fréquentes avec leur réponse honnête (livraison, taille, entretien, garantie, usage).
- seoTitle : titre SEO de 60 caractères maximum.
- seoDescription : description SEO de 155 caractères maximum.
- guarantee : le texte de garantie, crédible et tenable.
- cta : l’appel à l’action du bouton d’achat.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA, useProductPhoto: true, file_urls: imageUrl ? [imageUrl] : undefined });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
