import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AiLoading } from '@/components/ai/AiLoading';
import { GenerateButton } from '@/components/ai/GenerateButton';
import { AgentChat } from '@/components/ai/AgentChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAi } from '@/lib/useAi';
import { getAgent } from '@/lib/agents';
import { formatMoney } from '@/lib/utils';

const agent = getAgent('maxime');

export default function ProductFinance() {
  const { data, loading, error, call } = useAi('/marge-produit');
  const [selected, setSelected] = useState(null);
  const [adCost, setAdCost] = useState('');
  const [shipping, setShipping] = useState('');

  // Au montage : on demande la liste des produits de la boutique.
  useEffect(() => {
    call('getShopifyProductFinance', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notConnected = data && data.connected === false;
  const products = data?.products || [];
  const variants = data?.variants || [];
  const currency = data?.currency || 'EUR';

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        icon={Receipt}
        title="Marge nette produit"
        subtitle="Pour chaque produit de ta boutique Shopify : prix, coût d’achat, frais de paiement, livraison et ce qu’il te reste réellement."
        color={agent.color}
        actions={
          <GenerateButton
            loading={loading}
            onClick={() =>
              call('getShopifyProductFinance', {
                product_id: selected || undefined,
                adCostPerSale: Number(adCost || 0),
                shippingCost: Number(shipping || 0),
              })
            }
          >
            {selected ? 'Recalculer' : 'Charger mes produits'}
          </GenerateButton>
        }
      />

      {notConnected ? (
        <div className="rounded-[19px] border border-orange-500/30 bg-orange-500/[0.08] p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-orange-100">
            <AlertTriangle className="h-4 w-4" />
            Aucune boutique Shopify connectée
          </p>
          <p className="mt-2 text-sm text-orange-100/80">
            Cet outil lit les vrais prix et coûts de ta boutique. Connecte-la en trois étapes dans les paramètres.
          </p>
          <Button asChild className="mt-4">
            <Link to="/parametres">Connecter ma boutique</Link>
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      {!notConnected ? (
        <section className="grid gap-4 rounded-[19px] border border-white/12 bg-white/[0.02] p-5 md:grid-cols-3">
          <div>
            <Label htmlFor="product-select">Produit</Label>
            <select
              id="product-select"
              value={selected || ''}
              onChange={(event) => setSelected(event.target.value)}
              className="mt-2 flex h-10 w-full rounded-xl border border-input bg-black/30 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Choisis un produit…</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                  {product.price ? ` — ${product.price} ${currency}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="ad-cost">Coût publicitaire par vente</Label>
            <Input
              id="ad-cost"
              type="number"
              inputMode="decimal"
              value={adCost}
              onChange={(event) => setAdCost(event.target.value)}
              placeholder="Ex. : 12"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="ship-cost">Livraison par commande</Label>
            <Input
              id="ship-cost"
              type="number"
              inputMode="decimal"
              value={shipping}
              onChange={(event) => setShipping(event.target.value)}
              placeholder="Ex. : 3"
              className="mt-2"
            />
          </div>
        </section>
      ) : null}

      {loading ? <AiLoading message="Je lis les chiffres de ta boutique…" /> : null}

      {!loading && data?.note ? (
        <p className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] px-4 py-3 text-sm text-orange-100">
          {data.note}
        </p>
      ) : null}

      {!loading && variants.length ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-cream">{data.product?.title}</h2>
            <Badge variant="muted">
              {variants.length} variante{variants.length > 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-[19px] border border-white/12">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-[0.12em] text-[#7f7c75]">
                <tr>
                  <th className="px-4 py-3">Variante</th>
                  <th className="px-4 py-3 text-right">Prix</th>
                  <th className="px-4 py-3 text-right">Coût</th>
                  <th className="px-4 py-3 text-right">Frais</th>
                  <th className="px-4 py-3 text-right">Marge brute</th>
                  <th className="px-4 py-3 text-right">Marge nette</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id} className="border-t border-white/8">
                    <td className="px-4 py-3 font-medium text-cream">
                      {variant.title}
                      {variant.sku ? <span className="ml-2 text-xs text-muted-foreground">{variant.sku}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(variant.price, currency)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {variant.costMissing ? (
                        <span className="text-orange-300">non renseigné</span>
                      ) : (
                        formatMoney(variant.cost, currency)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatMoney(
                        Number(variant.paymentFees || 0) + Number(variant.shipping || 0) + Number(variant.adCostPerSale || 0),
                        currency,
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(variant.grossMargin, currency)}
                      {variant.grossMarginPct != null ? (
                        <span className="ml-1 text-xs text-muted-foreground">({variant.grossMarginPct} %)</span>
                      ) : null}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-semibold tabular-nums"
                      style={{ color: Number(variant.netMargin) > 0 ? '#3ecf8e' : '#e06c6c' }}
                    >
                      {formatMoney(variant.netMargin, currency)}
                      {variant.netMarginPct != null ? (
                        <span className="ml-1 text-xs opacity-70">({variant.netMarginPct} %)</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!loading && !variants.length && !notConnected && products.length ? (
        <div className="rounded-[19px] border border-dashed border-white/14 bg-white/[0.015] px-6 py-12 text-center text-sm text-muted-foreground">
          Choisis un produit puis lance le calcul : Maxime détaille la marge variante par variante.
        </div>
      ) : null}

      <AgentChat agentKey="maxime" context={{ tool: '/marge-produit', lastResult: data || null }} />
    </div>
  );
}
