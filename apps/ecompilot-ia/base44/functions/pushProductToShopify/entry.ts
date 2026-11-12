import { shopifyRequest, withShopify } from '../../shared/shopify.ts';

/**
 * Pousse un produit généré vers Shopify.
 * Mode action avec confirmation humaine : sans `confirm: true`, la fonction
 * ne fait qu’annoncer ce qu’elle écrirait. L’utilisateur valide en un clic.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const {
      confirm = false,
      title,
      body_html = '',
      price,
      compare_at_price = null,
      tags = [],
      images = [],
      status = 'draft',
    } = await req.json();

    if (!title) return Response.json({ error: 'Titre du produit manquant.' }, { status: 400 });

    const { account } = await withShopify(req);
    if (!account) return Response.json({ connected: false, error: 'Aucune boutique connectée.' }, { status: 400 });

    const product = {
      title,
      body_html,
      status: status === 'active' ? 'active' : 'draft',
      tags: Array.isArray(tags) ? tags.join(', ') : String(tags || ''),
      variants: [{ price: price ? String(price) : '0.00', compare_at_price: compare_at_price ? String(compare_at_price) : null }],
      images: (Array.isArray(images) ? images : []).filter(Boolean).map((src: string) => ({ src })),
    };

    // Étape 1 : proposition. Rien n’est écrit dans la boutique.
    if (!confirm) {
      return Response.json({
        confirmed: false,
        requiresConfirmation: true,
        shop_name: account.shop_name,
        summary: `Créer le produit « ${title} » en ${product.status === 'draft' ? 'brouillon' : 'ligne'} à ${product.variants[0].price} ${account.currency || 'EUR'} sur ${account.shop_name || account.shop_domain}.`,
        proposal: product,
      });
    }

    // Étape 2 : écriture, après validation explicite de l’utilisateur.
    const res = await shopifyRequest(account, '/products.json', {
      method: 'POST',
      body: JSON.stringify({ product }),
    });

    const created = res?.product;

    return Response.json({
      confirmed: true,
      product: created ? { id: created.id, title: created.title, status: created.status, handle: created.handle } : null,
      adminUrl: created ? `https://${account.shop_domain}/admin/products/${created.id}` : null,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
