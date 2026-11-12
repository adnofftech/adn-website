import { createClientFromRequest } from '@base44/sdk';

export const SHOPIFY_API_VERSION = '2024-10';

/** Force un domaine au format <boutique>.myshopify.com. */
export function normalizeShopDomain(domain: string): string {
  let d = String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  if (!d) return '';
  if (!d.endsWith('.myshopify.com')) {
    d = `${d.replace(/\.myshopify\.com.*$/, '').replace(/\./g, '-')}.myshopify.com`;
  }
  return d;
}

/** Récupère le ShopifyAccount de l’utilisateur courant (ou null). */
export async function getAccount(base44: any) {
  const list = await base44.entities.ShopifyAccount.list('-created_date', 1);
  return list?.[0] || null;
}

/** Appel authentifié à l’Admin API Shopify. */
export async function shopifyRequest(account: any, path: string, init: RequestInit = {}) {
  const url = `https://${account.shop_domain}/admin/api/${SHOPIFY_API_VERSION}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'X-Shopify-Access-Token': account.access_token,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const err: any = new Error(body?.errors ? JSON.stringify(body.errors) : `Shopify ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

/** Client + compte en un appel, pour les fonctions Shopify. */
export async function withShopify(req: Request) {
  const base44 = createClientFromRequest(req);
  const account = await getAccount(base44);
  return { base44, account };
}
