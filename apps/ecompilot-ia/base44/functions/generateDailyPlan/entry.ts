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
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Titre court à l’impératif"
          },
          "why": {
            "type": "string",
            "description": "Pourquoi cette action"
          },
          "how": {
            "type": "string",
            "description": "Comment faire, étape par étape"
          }
        },
        "required": [
          "title",
          "why",
          "how"
        ]
      },
      "description": "Trois actions du jour"
    },
    "healthScore": {
      "type": "integer",
      "description": "Score sur 100"
    },
    "healthExplanation": {
      "type": "string",
      "description": "Explication du score en deux phrases"
    },
    "topPriority": {
      "type": "string",
      "description": "Priorité numéro un, à l’impératif"
    }
  },
  "required": [
    "actions",
    "healthScore",
    "healthExplanation",
    "topPriority"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { seed = Date.now(), shopifyStats = null } = await payload(req);

    const hasReal = Boolean(shopifyStats?.connected && !shopifyStats?.needScopes);
    const statsBlock = hasReal
      ? `Données réelles de la boutique (journée d’hier) : chiffre d’affaires ${shopifyStats.yesterday_revenue ?? 0} ${shopifyStats.currency ?? 'EUR'}, ${shopifyStats.yesterday_orders ?? 0} commande(s), produits en tête : ${(shopifyStats.top_products || []).map((p: any) => `${p.title} (${p.quantity})`).join(', ') || 'aucun'}.`
      : 'Aucune donnée réelle : la boutique Shopify n’est pas connectée.';

    const prompt = `Tu es Antoine, le Responsable de Ta Team. Prépare le brief du jour (graine de variation : ${seed}).

${statsBlock}

Produis :
1. Trois actions pour aujourd’hui, faisables en moins de deux heures chacune, dans l’ordre de priorité. Pour chacune : un titre court à l’impératif, « pourquoi » (l’effet attendu sur les ventes, en une ou deux phrases) et « comment faire » (les étapes concrètes, les outils, les chiffres à viser).
2. Un score sur 100.
   ${hasReal
     ? 'Comme des données réelles existent, calcule une véritable « santé de boutique » à partir des ventes d’hier : 0-30 si aucune vente, 30-60 si quelques ventes irrégulières, 60-85 si les ventes sont régulières, 85-100 si elles progressent nettement.'
     : 'Comme aucune donnée réelle n’existe, donne un « potentiel de démarrage » encourageant entre 65 et 85, qui reflète la qualité de la niche et non la performance.'}
3. Une explication du score en deux phrases simples, jamais décourageante.
4. La priorité numéro un, en une phrase à l’impératif.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
