import { shopifyRequest, withShopify } from '../../shared/shopify.ts';

/** Détail d’une commande Shopify. */
export default async function handler(req: Request): Promise<Response> {
  try {
    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: 'Identifiant de commande manquant.' }, { status: 400 });

    const { account } = await withShopify(req);
    if (!account) return Response.json({ connected: false }, { status: 400 });

    const res = await shopifyRequest(account, `/orders/${order_id}.json`);
    const order = res?.order;
    if (!order) return Response.json({ error: 'Commande introuvable.' }, { status: 404 });

    return Response.json({
      connected: true,
      order: {
        id: order.id,
        name: order.name,
        created_at: order.created_at,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        currency: order.currency,
        total_price: order.total_price,
        subtotal_price: order.subtotal_price,
        total_shipping: order.total_shipping_price_set?.shop_money?.amount || '0.00',
        total_tax: order.total_tax,
        customer: order.customer
          ? { first_name: order.customer.first_name, country: order.shipping_address?.country || null }
          : null,
        line_items: (order.line_items || []).map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
        })),
      },
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
