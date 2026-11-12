import React, { useState } from 'react';
import { ChevronDown, Flame, ShieldAlert, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ai/LinkButton';
import { cn } from '@/lib/utils';

function competitionVariant(value) {
  const v = String(value || '').toLowerCase();
  if (v.startsWith('faible')) return 'success';
  if (v.startsWith('moyen')) return 'warning';
  return 'danger';
}

function scoreColor(score) {
  if (score >= 80) return '#3ecf8e';
  if (score >= 60) return '#f5b800';
  if (score >= 40) return '#e89657';
  return '#e06c6c';
}

/** Carte d’un produit gagnant : verdict, métriques, angle et liens de vérification. */
export function ProductCard({ product, index }) {
  const [open, setOpen] = useState(false);
  const toTest = String(product.verdict || '').toLowerCase().includes('tester');
  const score = Number(product.profitScore || 0);

  const aliexpress = product.aliexpressQuery
    ? `https://fr.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product.aliexpressQuery)}`
    : null;
  const adLibrary = product.adQuery
    ? `https://www.facebook.com/ads/library/?q=${encodeURIComponent(product.adQuery)}&active_status=all&ad_type=all&country=FR`
    : null;

  return (
    <article className="overflow-hidden rounded-[19px] border border-white/12 bg-gradient-to-b from-[rgba(39,40,40,.94)] to-[rgba(20,21,22,.97)]">
      <div className="h-[3px] w-full" style={{ background: scoreColor(score) }} />

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tabular-nums text-[#7f7c75]">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-cream">{product.name}</h3>
          </div>
          <Badge variant={toTest ? 'success' : 'danger'}>
            {toTest ? <Flame className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            {product.verdict || '—'}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Rentabilité" value={`${score}/100`} color={scoreColor(score)} />
          <Metric label="Potentiel viral" value={`${product.breakoutPotential ?? '—'}/100`} />
          <Metric label="Marge estimée" value={product.estMarginPct ? `${product.estMarginPct} %` : '—'} />
          <Metric label="Signal d’achat" value={product.buyingSignal || '—'} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={competitionVariant(product.competition)}>Concurrence {product.competition || '—'}</Badge>
          {product.demandGrowth ? (
            <Badge variant="muted">
              <TrendingUp className="h-3 w-3" />
              Demande {product.demandGrowth}
            </Badge>
          ) : null}
          <Badge variant="muted">
            {product.estCost || '—'} → {product.estSellPrice || '—'}
          </Badge>
        </div>

        {product.angleMarketing ? (
          <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Angle marketing</p>
            <p className="mt-1.5 text-sm leading-relaxed text-cream/90">{product.angleMarketing}</p>
          </div>
        ) : null}

        {product.trend || product.marketSize || product.whyNow ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {product.trend ? <Field label="Tendance" value={product.trend} /> : null}
            {product.marketSize ? <Field label="Taille du marché" value={product.marketSize} /> : null}
            {product.whyNow ? <Field label="Pourquoi maintenant" value={product.whyNow} wide /> : null}
          </dl>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          aria-expanded={open}
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          {open ? 'Masquer les détails' : 'Voir l’audience, les bénéfices et les objections'}
        </button>

        {open ? (
          <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
            {product.targetAudience ? <Field label="Audience cible" value={product.targetAudience} wide /> : null}
            <List label="Bénéfices clés" items={product.keyBenefits} />
            <List label="Objections à lever" items={product.topObjections} />
            {product.imagePrompt ? (
              <Field label="Prompt d’image (anglais)" value={product.imagePrompt} wide mono />
            ) : null}
          </div>
        ) : null}

        {aliexpress || adLibrary ? (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {aliexpress ? <LinkButton href={aliexpress}>Chercher sur AliExpress</LinkButton> : null}
            {adLibrary ? <LinkButton href={adLibrary}>Voir les pubs qui tournent</LinkButton> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7f7c75]">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}

function Field({ label, value, wide, mono }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">{label}</dt>
      <dd className={cn('mt-1 text-sm leading-relaxed text-cream/85', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}

function List({ label, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">{label}</p>
      <ul className="mt-1.5 space-y-1 text-sm text-cream/85">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductCard;
