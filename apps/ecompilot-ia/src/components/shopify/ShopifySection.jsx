import React, { useEffect, useState } from 'react';
import { Loader2, Store, Unplug } from 'lucide-react';
import { base44 } from '@/api/base44';
import { ShopifyConnectWizard } from '@/components/shopify/ShopifyConnectWizard';
import { ShopifyProductsList } from '@/components/shopify/ShopifyProductsList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { timeAgo } from '@/lib/utils';

/** Section Shopify des paramètres : statut, wizard, produits, déconnexion. */
export function ShopifySection() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const res = await base44.functions.invoke('getShopifyStatus', {});
      setStatus(res?.data || res);
      setError(null);
    } catch (err) {
      setError(err?.message || null);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function disconnect() {
    setDisconnecting(true);
    try {
      await base44.functions.invoke('disconnectShopify', {});
      setStatus({ connected: false });
      toast({ title: 'Boutique déconnectée', description: 'Le jeton d’accès a été supprimé de l’application.' });
    } catch {
      toast({ title: 'Déconnexion impossible', description: 'Réessaie dans un instant.', variant: 'destructive' });
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[19px] border border-white/12 bg-white/[0.02] p-5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Vérification de la connexion Shopify…
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="flex flex-col gap-3">
        {error ? (
          <p className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] px-4 py-3 text-xs text-orange-100">
            {error}
          </p>
        ) : null}
        <ShopifyConnectWizard onConnected={() => load()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[19px] border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-cream">{status.shop_name || status.shop_domain}</p>
              <p className="text-xs text-muted-foreground">
                {status.shop_domain}
                {status.last_sync_date ? ` · synchronisé ${timeAgo(status.last_sync_date)}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Connectée</Badge>
            {status.plan_display_name ? <Badge variant="muted">{status.plan_display_name}</Badge> : null}
            <Badge variant="muted">{status.product_count ?? 0} produits</Badge>
          </div>
        </div>

        <Button variant="outline" size="sm" className="mt-4" onClick={disconnect} disabled={disconnecting}>
          {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
          Déconnecter la boutique
        </Button>
      </section>

      <ShopifyProductsList />
    </div>
  );
}

export default ShopifySection;
