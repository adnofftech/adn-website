import React from 'react';
import { Check, Trophy } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { Badge } from '@/components/ui/badge';
import { CopyBlock } from '@/components/ai/CopyBlock';
import { MILESTONES, useEcomProfile } from '@/lib/useEcomProfile';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = { validée: 'success', 'en cours': 'default', 'à venir': 'muted' };

export default function MilestoneTracker() {
  const { milestones, toggleMilestone, isGuest } = useEcomProfile();
  const done = MILESTONES.filter((milestone) => milestones?.[milestone.key]).length;

  return (
    <ToolShell
      toolKey="/etapes"
      agentKey="antoine"
      icon={Trophy}
      title="Mes étapes"
      subtitle="Les huit étapes qui comptent, de la première visite aux 10 000 €. Coche ce qui est fait : Antoine adapte ses conseils."
      fn="generateMilestoneGuidance"
      cta="Demander le conseil d’Antoine"
      buildPayload={() => ({ milestones: milestones || {} })}
      emptyHint="Coche tes étapes validées, puis demande à Antoine le conseil qui correspond à l’endroit où tu en es."
      render={(data) => (
        <div className="flex flex-col gap-5">
          {data.intro ? <CopyBlock label="Là où tu en es" text={data.intro} tone="accent" /> : null}

          {data.guidance?.length ? (
            <section className="flex flex-col gap-3">
              {data.guidance.map((item, index) => (
                <article key={item.key || index} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-cream">{item.label}</h3>
                    <Badge variant={STATUS_VARIANT[String(item.status || '').toLowerCase()] || 'muted'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-cream/85">{item.advice}</p>
                  {item.nextAction ? (
                    <p className="mt-3 border-l-2 border-primary/50 pl-3 text-sm text-primary">{item.nextAction}</p>
                  ) : null}
                </article>
              ))}
            </section>
          ) : null}

          {data.blocker ? <CopyBlock label="Le blocage à lever maintenant" text={data.blocker} /> : null}
        </div>
      )}
    >
      <section className="rounded-[19px] border border-white/12 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-cream">Ton parcours</p>
          <Badge variant="muted">
            {done}/{MILESTONES.length} étapes validées
          </Badge>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${(done / MILESTONES.length) * 100}%` }}
          />
        </div>

        {isGuest ? (
          <p className="mt-3 text-xs text-violet-200/80">
            En mode démo, les étapes cochées ne sont pas conservées. Crée un compte pour garder ta progression.
          </p>
        ) : null}

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {MILESTONES.map((milestone, index) => {
            const checked = Boolean(milestones?.[milestone.key]);
            return (
              <li key={milestone.key}>
                <button
                  type="button"
                  onClick={() => toggleMilestone(milestone.key)}
                  disabled={isGuest}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                    checked
                      ? 'border-emerald-500/40 bg-emerald-500/[0.08]'
                      : 'border-white/10 bg-white/[0.02] hover:border-primary/35',
                    isGuest && 'cursor-not-allowed opacity-70',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                      checked ? 'border-emerald-400/60 bg-emerald-500/30 text-emerald-200' : 'border-white/20',
                    )}
                  >
                    {checked ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-cream">
                      {String(index + 1).padStart(2, '0')} · {milestone.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{milestone.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </ToolShell>
  );
}
