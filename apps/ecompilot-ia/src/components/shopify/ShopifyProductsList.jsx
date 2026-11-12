import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney, timeAgo } from '@/lib/utils';

/** Liste des produits Shopify synchronisés. */
export function ShopifyProductsList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function sync() {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('syncShopifyProducts', {});
      setData(res?.data || res);
    } catch (err) {
      setError(err?.message || 'La synchronisation a échoué.');
    } finally {
      setLoading(false);
    }
  }

  const products = data?.products || [];

  return (
    <section className="rounded-[19px] border border-white/12 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cream">Produits de la boutique</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data?.synced_at ? `Synchronisé ${timeAgo(data.synced_at)}` : 'Lecture seule : rien n’est modifié.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={sync} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Synchroniser
        </Button>
      </div>

      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}

      {products.length ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {products.slice(0, 20).map((product) => (
            <li key={product.id} className="flex items-center gap-3 rounded-2xl border border-white/10 p-3">
              {product.image ? (
                <img src={product.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <span className="h-10 w-10 rounded-xl border border-white/12" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-cream">{product.title}</span>
                <span className="text-xs text-muted-foreground">
                  {product.price ? formatMoney(product.price, data?.currency) : '—'} · {product.inventory} en stock
                </span>
              </span>
              <Badge variant={product.status === 'active' ? 'success' : 'muted'}>
                {product.status === 'active' ? 'en ligne' : product.status}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {data && !products.length && !loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucun produit trouvé dans la boutique.</p>
      ) : null}
    </section>
  );
}

export default ShopifyProductsList;
