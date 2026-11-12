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
    "products": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Nom du produit en français"
          },
          "profitScore": {
            "type": "integer",
            "description": "Score de rentabilité de 0 à 100"
          },
          "competition": {
            "type": "string",
            "description": "Faible, Moyenne ou Forte"
          },
          "verdict": {
            "type": "string",
            "description": "À tester ou À éviter"
          },
          "trend": {
            "type": "string",
            "description": "Tendance actuelle en une phrase"
          },
          "demandGrowth": {
            "type": "string",
            "description": "Croissance de la demande, ex. +148 %"
          },
          "marketSize": {
            "type": "string",
            "description": "Taille du marché en une phrase"
          },
          "buyingSignal": {
            "type": "string",
            "description": "Fort, Moyen ou Faible"
          },
          "targetAudience": {
            "type": "string",
            "description": "Audience cible précise"
          },
          "angleMarketing": {
            "type": "string",
            "description": "Angle marketing principal"
          },
          "keyBenefits": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Bénéfice clé"
            },
            "description": "Trois à cinq bénéfices"
          },
          "topObjections": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Objection fréquente"
            },
            "description": "Trois objections principales"
          },
          "estCost": {
            "type": "string",
            "description": "Coût d’achat estimé, ex. 8 €"
          },
          "estSellPrice": {
            "type": "string",
            "description": "Prix de vente conseillé, ex. 39 €"
          },
          "estMarginPct": {
            "type": "integer",
            "description": "Marge brute estimée en pourcentage"
          },
          "breakoutPotential": {
            "type": "integer",
            "description": "Potentiel viral de 0 à 100"
          },
          "whyNow": {
            "type": "string",
            "description": "Pourquoi c’est le bon moment"
          },
          "imagePrompt": {
            "type": "string",
            "description": "Prompt d’image en anglais, 5 à 10 mots, fond blanc"
          },
          "aliexpressQuery": {
            "type": "string",
            "description": "Requête AliExpress en anglais"
          },
          "adQuery": {
            "type": "string",
            "description": "Requête Facebook Ad Library en anglais"
          }
        },
        "required": [
          "name",
          "profitScore",
          "competition",
          "verdict",
          "estCost",
          "estSellPrice",
          "estMarginPct"
        ]
      },
      "description": "Dix produits à fort potentiel"
    }
  },
  "required": [
    "products"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    await payload(req);

    const prompt = `Tu es Rémi, le Marketing de Ta Team. Recherche sur le web, en temps réel, dix produits à fort potentiel dans la niche de l’utilisateur, pour le marché français et européen.

CRITÈRES DE QUALITÉ STRICTS — un produit n’est retenu que s’il les remplit :
- il résout un problème douloureux OU déclenche un fort désir immédiat ;
- il a un effet « wow » filmable en moins de 5 secondes ;
- sa marge brute réelle est d’au moins 60 % (ne gonfle jamais les marges : une marge honnête se situe souvent entre 65 % et 80 %, jamais 94 %) ;
- sa demande est en croissance réelle, vérifiable aujourd’hui ;
- la concurrence n’est pas saturée en France et en Europe ;
- son prix de vente est cohérent avec la valeur perçue.

INTERDITS : les produits clichés du dropshipping (brosse dérouleur, lampe lune, coussin cervical générique, etc.) sauf si tu apportes un angle réellement nouveau. Ne propose jamais un produit sans preuve de demande actuelle.

Pour chacun des dix produits, remplis tous les champs. estCost et estSellPrice sont des chaînes avec le symbole € (ex. « 8 € », « 39 € »). demandGrowth est une chaîne en pourcentage (ex. « +148 % »). imagePrompt est en anglais, de 5 à 10 mots, fond blanc. aliexpressQuery est en anglais, optimisée pour la recherche AliExpress. adQuery est en anglais, optimisée pour la Facebook Ad Library. whyNow explique en deux phrases pourquoi c’est le bon moment.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA, web: true, model: 'gemini_3_1_pro' });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
