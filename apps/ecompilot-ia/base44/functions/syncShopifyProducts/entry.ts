import { createClientFromRequest } from '@base44/sdk';
import { getAccount, shopifyRequest } from '../../shared/shopify.ts';

/** Synchronise les produits Shopify vers l’app (lecture seule). */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const account = await getAccount(base44);
    if (!account) return Response.json({ connected: false }, { status: 400 });

    const res = await shopifyRequest(
      account,
      '/products.json?limit=250&fields=id,title,handle,status,image,variants,created_at',
    );

    const products = (res?.products || []).map((product: any) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
      image: product.image?.src || null,
      price: product.variants?.[0]?.price || null,
      compare_at_price: product.variants?.[0]?.compare_at_price || null,
      inventory: (product.variants || []).reduce(
        (total: number, variant: any) => total + Number(variant.inventory_quantity || 0),
        0,
      ),
      variants: (product.variants || []).length,
      created_at: product.created_at,
    }));

    await base44.entities.ShopifyAccount.update(account.id, {
      product_count: products.length,
      last_sync_date: new Date().toISOString(),
    });

    return Response.json({
      connected: true,
      count: products.length,
      currency: account.currency || 'EUR',
      synced_at: new Date().toISOString(),
      products,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
