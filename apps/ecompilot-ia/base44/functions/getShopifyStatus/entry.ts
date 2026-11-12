import { withShopify } from '../../shared/shopify.ts';

/** État de la connexion Shopify. */
export default async function handler(req: Request): Promise<Response> {
  try {
    const { account } = await withShopify(req);

    if (!account) return Response.json({ connected: false });

    return Response.json({
      connected: account.status !== 'error',
      status: account.status,
      shop_domain: account.shop_domain,
      shop_name: account.shop_name,
      currency: account.currency,
      plan_display_name: account.plan_display_name,
      product_count: account.product_count,
      last_sync_date: account.last_sync_date,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
