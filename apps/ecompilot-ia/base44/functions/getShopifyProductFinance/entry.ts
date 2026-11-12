import { shopifyRequest, withShopify } from '../../shared/shopify.ts';

/**
 * Finance d’un produit Shopify : prix, coût, marge brute et marge nette
 * estimée après frais de paiement et budget publicitaire par vente.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const { product_id, adCostPerSale = 0, shippingCost = 0 } = await req.json().catch(() => ({}) as any);

    const { account } = await withShopify(req);
    if (!account) return Response.json({ connected: false }, { status: 400 });

    // Sans identifiant : on renvoie la liste des produits pour que l’utilisateur choisisse.
    if (!product_id) {
      const list = await shopifyRequest(account, '/products.json?limit=50&fields=id,title,variants,image');
      return Response.json({
        connected: true,
        needsSelection: true,
        currency: account.currency || 'EUR',
        products: (list?.products || []).map((product: any) => ({
          id: product.id,
          title: product.title,
          price: product.variants?.[0]?.price || null,
          image: product.image?.src || null,
        })),
      });
    }

    const res = await shopifyRequest(account, `/products/${product_id}.json`);
    const product = res?.product;
    if (!product) return Response.json({ error: 'Produit introuvable.' }, { status: 404 });

    const variants = await Promise.all(
      (product.variants || []).map(async (variant: any) => {
        const price = Number(variant.price || 0);
        let cost = 0;

        // Le coût unitaire vit sur l’InventoryItem (champ cost).
        try {
          if (variant.inventory_item_id) {
            const item = await shopifyRequest(account, `/inventory_items/${variant.inventory_item_id}.json`);
            cost = Number(item?.inventory_item?.cost || 0);
          }
        } catch {
          cost = 0;
        }

        const shipping = Number(shippingCost || 0);
        const paymentFees = Math.round((price * 0.02 + 0.25) * 100) / 100;
        const ads = Number(adCostPerSale || 0);
        const grossMargin = Math.round((price - cost) * 100) / 100;
        const netMargin = Math.round((price - cost - shipping - paymentFees - ads) * 100) / 100;

        return {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          price,
          cost,
          shipping,
          paymentFees,
          adCostPerSale: ads,
          grossMargin,
          grossMarginPct: price ? Math.round((grossMargin / price) * 1000) / 10 : null,
          netMargin,
          netMarginPct: price ? Math.round((netMargin / price) * 1000) / 10 : null,
          costMissing: cost === 0,
        };
      }),
    );

    return Response.json({
      connected: true,
      currency: account.currency || 'EUR',
      product: { id: product.id, title: product.title, image: product.image?.src || null },
      variants,
      note:
        variants.some((variant) => variant.costMissing)
          ? 'Le coût d’achat n’est pas renseigné dans Shopify pour au moins une variante : la marge affichée est donc le prix de vente. Renseigne le coût par article dans Shopify (Produits → Variante → Coût par article) pour un calcul exact.'
          : null,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
