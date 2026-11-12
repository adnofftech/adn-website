import { createClientFromRequest } from '@base44/sdk';
import { getAccount, normalizeShopDomain, shopifyRequest } from '../../shared/shopify.ts';

/** Connecte une boutique Shopify : valide le jeton puis enregistre le compte. */
export default async function handler(req: Request): Promise<Response> {
  try {
    const { shop_domain, access_token } = await req.json();

    const domain = normalizeShopDomain(shop_domain);
    if (!domain) return Response.json({ error: 'Domaine de boutique manquant.' }, { status: 400 });
    if (!access_token || !String(access_token).trim()) {
      return Response.json({ error: 'Jeton d’accès Admin API manquant.' }, { status: 400 });
    }

    const candidate = { shop_domain: domain, access_token: String(access_token).trim() };

    // Validation du jeton auprès de Shopify.
    let shop: any = null;
    try {
      const res = await shopifyRequest(candidate, '/shop.json');
      shop = res?.shop;
    } catch (error: any) {
      const status = error?.status === 401 || error?.status === 403 ? 401 : 502;
      return Response.json(
        {
          error:
            status === 401
              ? 'Shopify a refusé ce jeton. Vérifie le domaine de la boutique et recopie le jeton d’accès Admin API.'
              : 'Shopify n’a pas répondu. Réessaie dans un instant.',
        },
        { status },
      );
    }

    // Nombre de produits (facultatif : dépend du scope read_products).
    let productCount = 0;
    try {
      const count = await shopifyRequest(candidate, '/products/count.json');
      productCount = Number(count?.count || 0);
    } catch {
      productCount = 0;
    }

    const base44 = createClientFromRequest(req);
    const existing = await getAccount(base44);

    const data = {
      ...candidate,
      shop_name: shop?.name || domain,
      currency: shop?.currency || 'EUR',
      plan_display_name: shop?.plan_display_name || '',
      status: 'connected',
      product_count: productCount,
      last_sync_date: new Date().toISOString(),
    };

    const account = existing
      ? await base44.entities.ShopifyAccount.update(existing.id, data)
      : await base44.entities.ShopifyAccount.create(data);

    return Response.json({
      connected: true,
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
