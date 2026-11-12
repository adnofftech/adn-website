import { llm } from '../../shared/llm.ts';
import { shopifyRequest, withShopify } from '../../shared/shopify.ts';

const SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', description: 'Score d’audit sur 100' },
    summary: { type: 'string', description: 'Résumé de l’audit en trois phrases' },
    findings: {
      type: 'array',
      description: 'Constats, du plus rentable à corriger au moins urgent',
      items: {
        type: 'object',
        properties: {
          zone: { type: 'string', description: 'Zone concernée' },
          constat: { type: 'string', description: 'Ce qui a été observé' },
          impact: { type: 'string', description: 'Effet sur les ventes' },
          correction: { type: 'string', description: 'Correction exacte à faire dans Shopify' },
          priorite: { type: 'string', description: 'haute, moyenne ou basse' },
        },
        required: ['zone', 'constat', 'correction', 'priorite'],
      },
    },
    quickWins: { type: 'array', items: { type: 'string' }, description: 'Trois corrections faisables en moins d’une heure' },
  },
  required: ['score', 'summary', 'findings'],
} as const;

/** Audit de la boutique Shopify connectée : données réelles puis lecture par l’IA. */
export default async function handler(req: Request): Promise<Response> {
  try {
    const { account } = await withShopify(req);
    if (!account) {
      return Response.json(
        { connected: false, error: 'Connecte d’abord ta boutique Shopify dans les paramètres.' },
        { status: 400 },
      );
    }

    const shop = await shopifyRequest(account, '/shop.json').catch(() => null);
    const productsRes = await shopifyRequest(
      account,
      '/products.json?limit=50&fields=id,title,body_html,status,images,variants,tags,handle',
    ).catch(() => null);

    const products = productsRes?.products || [];

    const snapshot = {
      boutique: shop?.shop?.name || account.shop_name,
      devise: shop?.shop?.currency || account.currency,
      pays: shop?.shop?.country_name || null,
      forfait: shop?.shop?.plan_display_name || account.plan_display_name,
      nombreDeProduits: products.length,
      produits: products.slice(0, 12).map((product: any) => ({
        titre: product.title,
        statut: product.status,
        longueurDescription: String(product.body_html || '').replace(/<[^>]+>/g, '').trim().length,
        nombreImages: (product.images || []).length,
        prix: product.variants?.[0]?.price || null,
        prixBarre: product.variants?.[0]?.compare_at_price || null,
        variantes: (product.variants || []).length,
        etiquettes: product.tags || '',
      })),
    };

    const prompt = `Tu es Rémi, le Marketing de Ta Team, et tu audites une vraie boutique Shopify.

Voici les données réelles relevées sur la boutique (ne t’appuie sur rien d’autre) :
${JSON.stringify(snapshot, null, 2)}

Produis :
1. Un score d’audit sur 100, justifié par ce que montrent les données.
2. Un résumé de trois phrases : l’état général, le point le plus faible, le point le plus solide.
3. Entre six et dix constats, du plus rentable à corriger au moins urgent. Pour chacun : la zone (catalogue, fiche produit, prix, images, étiquettes, statut, confiance), le constat appuyé sur un chiffre relevé, l’impact sur les ventes, la correction exacte à faire dans Shopify et la priorité (haute, moyenne, basse).
4. Trois corrections faisables en moins d’une heure.

Si une donnée manque pour juger une zone (par exemple le coût d’achat ou les avis clients), dis-le au lieu de supposer.`;

    const audit = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json({ connected: true, shop: snapshot, ...audit });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
