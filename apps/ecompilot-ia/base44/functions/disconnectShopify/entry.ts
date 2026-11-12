import { createClientFromRequest } from '@base44/sdk';
import { getAccount } from '../../shared/shopify.ts';

/** Supprime le compte Shopify de l’utilisateur courant. */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const account = await getAccount(base44);

    if (!account) return Response.json({ connected: false, removed: false });

    await base44.entities.ShopifyAccount.delete(account.id);
    return Response.json({ connected: false, removed: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
