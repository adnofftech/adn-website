import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { useJourney } from '@/lib/useJourney';

/** Bandeau du parcours guidé : prochaine étape et progression. */
export function NextStepBanner() {
  const { loading, nextTool, nextPath, progress } = useJourney();

  if (loading) return null;

  const pct = Math.round((progress.done / progress.total) * 100);

  if (!nextPath) {
    return (
      <div className="ta-team__section mt-10 flex flex-wrap items-center gap-4 rounded-[19px] border border-emerald-500/30 bg-emerald-500/[0.08] px-5 py-4">
        <PartyPopper className="h-5 w-5 shrink-0 text-emerald-300" />
        <p className="min-w-0 flex-1 text-sm text-emerald-100">
          Tu as exploré les {progress.total} outils de Ta Team. Reviens sur ceux qui comptent le plus pour ta boutique :
          tes derniers résultats sont gardés en mémoire.
        </p>
      </div>
    );
  }

  const Icon = nextTool?.icon;

  return (
    <div className="ta-team__section mt-10">
      <Link
        to={nextPath}
        className="group flex flex-wrap items-center gap-5 rounded-[19px] border border-white/12 bg-gradient-to-r from-[rgba(245,184,0,.08)] to-transparent px-5 py-4 no-underline transition-colors hover:border-primary/45"
      >
        {Icon ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-primary/35 bg-primary/12 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}

        <div className="min-w-[180px] flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Prochaine étape</p>
          <p className="mt-1 text-base font-semibold text-cream">{nextTool?.label}</p>
          <p className="text-xs text-muted-foreground">{nextTool?.group}</p>
        </div>

        <div className="w-full sm:max-w-[220px]">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Parcours guidé</span>
            <span className="font-semibold text-cream">
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <ArrowRight className="hidden h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1 sm:block" />
      </Link>
    </div>
  );
}

export default NextStepBanner;
