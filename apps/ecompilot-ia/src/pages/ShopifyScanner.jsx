import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ScanSearch } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyBlock } from '@/components/ai/CopyBlock';

const PRIORITY = { haute: 'danger', moyenne: 'warning', basse: 'muted' };

export default function ShopifyScanner() {
  return (
    <ToolShell
      toolKey="/scanner-shopify"
      agentKey="remi"
      icon={ScanSearch}
      title="Scanner Shopify"
      subtitle="Rémi lit les données réelles de ta boutique — catalogue, fiches, prix, images — et liste ce qui te coûte des ventes."
      tagline="Lecture seule : le scanner ne modifie jamais ta boutique."
      fn="scanShopifyStore"
      cta="Scanner ma boutique"
      loadingMessage="Rémi parcourt ta boutique…"
      emptyHint="Lance le scan : Rémi compare ton catalogue aux standards qui convertissent dans ta niche."
      render={(data) => {
        if (data?.connected === false) {
          return (
            <div className="rounded-[19px] border border-orange-500/30 bg-orange-500/[0.08] p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-orange-100">
                <AlertTriangle className="h-4 w-4" />
                Aucune boutique Shopify connectée
              </p>
              <p className="mt-2 text-sm text-orange-100/80">
                {data.error || 'Connecte ta boutique pour que Rémi puisse l’auditer.'}
              </p>
              <Button asChild className="mt-4">
                <Link to="/parametres">Connecter ma boutique</Link>
              </Button>
            </div>
          );
        }

        const findings = data?.findings || [];

        return (
          <div className="flex flex-col gap-5">
            <section className="flex flex-wrap items-center gap-5 rounded-[19px] border border-white/12 bg-gradient-to-b from-[rgba(39,40,40,.94)] to-[rgba(20,21,22,.97)] p-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-primary/30">
                <span className="text-2xl font-semibold tabular-nums text-primary">{data?.score ?? '—'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">Score d’audit</p>
                <p className="mt-1.5 text-sm leading-relaxed text-cream/90">{data?.summary}</p>
                {data?.shop ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="muted">{data.shop.boutique}</Badge>
                    <Badge variant="muted">{data.shop.nombreDeProduits} produits</Badge>
                    {data.shop.forfait ? <Badge variant="muted">{data.shop.forfait}</Badge> : null}
                  </div>
                ) : null}
              </div>
            </section>

            {data?.quickWins?.length ? (
              <CopyBlock label="À corriger en moins d’une heure" text={data.quickWins.join('\n')} tone="accent">
                <ul className="space-y-2">
                  {data.quickWins.map((win, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </CopyBlock>
            ) : null}

            <section className="flex flex-col gap-3">
              {findings.map((finding, index) => (
                <article key={index} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-cream">{finding.zone}</h3>
                    <Badge variant={PRIORITY[String(finding.priorite || '').toLowerCase()] || 'muted'}>
                      Priorité {finding.priorite}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-cream/85">{finding.constat}</p>
                  {finding.impact ? (
                    <p className="mt-2 text-xs text-muted-foreground">Impact : {finding.impact}</p>
                  ) : null}
                  <div className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">À faire</p>
                    <p className="mt-1 text-sm text-cream/90">{finding.correction}</p>
                  </div>
                </article>
              ))}
            </section>
          </div>
        );
      }}
    />
  );
}
