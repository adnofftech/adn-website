import React, { useState } from 'react';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { CopyBlock } from '@/components/ai/CopyBlock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const DEFAULT_FIXED = [
  { label: 'Abonnement Shopify', amount: 32 },
  { label: 'Nom de domaine', amount: 1.5 },
];

export default function ProfitCalculator() {
  const [fixedCosts, setFixedCosts] = useState(DEFAULT_FIXED);

  const total = fixedCosts.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);

  function update(index, patch) {
    setFixedCosts((prev) => prev.map((cost, i) => (i === index ? { ...cost, ...patch } : cost)));
  }

  return (
    <ToolShell
      toolKey="/calculateur-benefices"
      agentKey="maxime"
      icon={Calculator}
      title="Calculateur de bénéfices"
      subtitle="Ce qu’il te reste vraiment : chiffre d’affaires, coût des produits, livraison, frais de paiement, publicité et charges fixes."
      fn="analyzeProfit"
      cta="Calculer mon bénéfice"
      loadingMessage="Maxime fait les comptes…"
      fields={[
        { name: 'revenue', label: 'Chiffre d’affaires de la période', type: 'number', placeholder: 'Ex. : 2400' },
        { name: 'orders', label: 'Nombre de commandes', type: 'number', placeholder: 'Ex. : 62' },
        { name: 'productCost', label: 'Coût produit par commande', type: 'number', placeholder: 'Ex. : 9' },
        { name: 'shippingCost', label: 'Livraison par commande', type: 'number', placeholder: 'Ex. : 3' },
        { name: 'adSpend', label: 'Dépenses publicitaires', type: 'number', placeholder: 'Ex. : 780' },
      ]}
      buildPayload={(values) => ({
        revenue: Number(values.revenue || 0),
        orders: Number(values.orders || 0),
        productCost: Number(values.productCost || 0),
        shippingCost: Number(values.shippingCost || 0),
        adSpend: Number(values.adSpend || 0),
        fixedCosts: fixedCosts.filter((cost) => cost.label && Number(cost.amount) > 0),
        currency: 'EUR',
      })}
      render={(data) => (
        <div className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Bénéfice net" value={data.margeNette} accent />
            <Stat label="Marge nette" value={data.margeNettePct != null ? `${data.margeNettePct} %` : '—'} />
            <Stat label="Panier moyen" value={data.panierMoyen} />
            <Stat label="Coût d’acquisition" value={data.coutAcquisition} />
            <Stat label="Seuil de rentabilité" value={data.seuilRentabilite} wide />
          </div>

          {data.resume ? <CopyBlock label="Ce que ça veut dire" text={data.resume} tone="accent" /> : null}

          {data.calcul?.length ? (
            <section className="overflow-hidden rounded-[19px] border border-white/12">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-[0.12em] text-[#7f7c75]">
                  <tr>
                    <th className="px-4 py-3">Poste</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="hidden px-4 py-3 md:table-cell">Explication</th>
                  </tr>
                </thead>
                <tbody>
                  {data.calcul.map((line, index) => (
                    <tr key={index} className="border-t border-white/8">
                      <td className="px-4 py-3 font-medium text-cream">{line.poste}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-cream">{line.montant}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{line.explication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          {data.conseils?.length ? (
            <section>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f7c75]">
                Pour améliorer le résultat
              </h2>
              <ol className="flex flex-col gap-2">
                {data.conseils.map((conseil, index) => (
                  <li key={index} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-primary/35 bg-primary/12 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-cream/90">{conseil}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {data.alerte ? (
            <p className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] px-4 py-3 text-sm text-orange-100">
              {data.alerte}
            </p>
          ) : null}
        </div>
      )}
    >
      <section className="rounded-[19px] border border-white/12 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cream">Charges fixes mensuelles</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Abonnements, applications, domaine, outils : tout ce que tu paies même sans vendre.
            </p>
          </div>
          <Badge variant="muted">{total.toFixed(2).replace('.', ',')} € par mois</Badge>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {fixedCosts.map((cost, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                {index === 0 ? <Label htmlFor={`fixed-label-${index}`}>Intitulé</Label> : null}
                <Input
                  id={`fixed-label-${index}`}
                  value={cost.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  placeholder="Ex. : application d’avis clients"
                  className="mt-1.5"
                />
              </div>
              <div className="w-28">
                {index === 0 ? <Label htmlFor={`fixed-amount-${index}`}>€ / mois</Label> : null}
                <Input
                  id={`fixed-amount-${index}`}
                  type="number"
                  inputMode="decimal"
                  value={cost.amount}
                  onChange={(event) => update(index, { amount: event.target.value })}
                  className="mt-1.5"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Supprimer cette charge"
                onClick={() => setFixedCosts((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setFixedCosts((prev) => [...prev, { label: '', amount: 0 }])}
        >
          <Plus className="h-4 w-4" />
          Ajouter une charge
        </Button>
      </section>
    </ToolShell>
  );
}

function Stat({ label, value, accent, wide }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        accent ? 'border-primary/30 bg-primary/[0.08]' : 'border-white/10 bg-white/[0.02]'
      } ${wide ? 'sm:col-span-2' : ''}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7f7c75]">{label}</p>
      <p className={`mt-1 font-semibold tabular-nums ${accent ? 'text-xl text-primary' : 'text-base text-cream'}`}>
        {value ?? '—'}
      </p>
    </div>
  );
}
