import { shopifyRequest, withShopify } from '../../shared/shopify.ts';

/** Commandes payées de la journée d’hier : chiffre d’affaires, volume, produits en tête. */
export default async function handler(req: Request): Promise<Response> {
  try {
    const { account } = await withShopify(req);
    if (!account) return Response.json({ connected: false });

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const date = start.toISOString().slice(0, 10);

    const params = new URLSearchParams({
      status: 'any',
      financial_status: 'paid',
      created_at_min: start.toISOString(),
      created_at_max: end.toISOString(),
      limit: '250',
      fields: 'id,total_price,currency,created_at,line_items,financial_status',
    });

    let orders: any[] = [];
    try {
      const res = await shopifyRequest(account, `/orders.json?${params}`);
      orders = res?.orders || [];
    } catch (error: any) {
      // Scope read_orders absent : on le dit à l’interface sans casser l’accueil.
      if (error?.status === 401 || error?.status === 403) {
        return Response.json({ connected: true, needScopes: true, date });
      }
      throw error;
    }

    const revenue = orders.reduce((total, order) => total + Number(order.total_price || 0), 0);

    const byProduct = new Map<string, { title: string; quantity: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.line_items || []) {
        const title = item.title || 'Produit sans nom';
        const current = byProduct.get(title) || { title, quantity: 0, revenue: 0 };
        current.quantity += Number(item.quantity || 0);
        current.revenue += Number(item.price || 0) * Number(item.quantity || 0);
        byProduct.set(title, current);
      }
    }

    const top_products = [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 3);

    return Response.json({
      connected: true,
      needScopes: false,
      date,
      currency: account.currency || orders[0]?.currency || 'EUR',
      yesterday_revenue: Math.round(revenue * 100) / 100,
      yesterday_orders: orders.length,
      top_products,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
