import React, { useEffect, useMemo, useState } from 'react';
import { Check, Flame, Lock, Play, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44';
import { PageHeader } from '@/components/PageHeader';
import { AiLoading } from '@/components/ai/AiLoading';
import { CopyBlock } from '@/components/ai/CopyBlock';
import { AgentChat } from '@/components/ai/AgentChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DAILY_PROMPTS, TOTAL_DAYS, getPromptByDay } from '@/lib/dailyPrompts';
import { AGENT_COLORS, getAgent } from '@/lib/agents';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'ecp_daily_v1';
const DAY_MS = 86400000;

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* navigation privée : on repart de zéro */
  }
  return { startDate: new Date().toISOString(), completed: [], streak: 0, lastDayCompleted: null };
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignoré */
  }
}

export default function DailyChallenge() {
  const [state, setState] = useState(readState);
  const [active, setActive] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    writeState(state);
  }, [state]);

  const currentDay = useMemo(() => {
    const start = new Date(state.startDate).getTime();
    const elapsed = Math.floor((Date.now() - start) / DAY_MS) + 1;
    return Math.min(Math.max(elapsed, 1), TOTAL_DAYS);
  }, [state.startDate]);

  const todayChallenge = getPromptByDay(currentDay);
  const completed = new Set(state.completed);
  const isUnlocked = (day) => completed.has(day) || day <= currentDay;

  async function run(challenge) {
    setActive(challenge.day);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('runDailyPrompt', {
        prompt: challenge.prompt,
        title: challenge.title,
        day: challenge.day,
      });
      setResult(res?.data || res);
    } catch (err) {
      setError(err?.message || 'La génération a échoué. Réessaie dans un instant.');
    } finally {
      setLoading(false);
    }
  }

  function validate(day) {
    setState((prev) => {
      if (prev.completed.includes(day)) return prev;
      const consecutive = prev.lastDayCompleted === day - 1 || prev.lastDayCompleted === null;
      return {
        ...prev,
        completed: [...prev.completed, day],
        streak: consecutive ? (prev.streak || 0) + 1 : 1,
        lastDayCompleted: day,
      };
    });
  }

  const doneCount = state.completed.length;
  const progress = Math.round((doneCount / TOTAL_DAYS) * 100);

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        icon={Sparkles}
        title="Défi du jour"
        subtitle="Cinquante défis, un par jour. Chacun produit une brique utilisable tout de suite dans ta boutique."
        tagline="Un nouveau défi se débloque chaque jour. Les précédents restent accessibles."
        color={getAgent('antoine').color}
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Série en cours" value={`${state.streak || 0} j`} icon={Flame} accent />
        <Stat label="Défis validés" value={`${doneCount}/${TOTAL_DAYS}`} />
        <Stat label="Jour du parcours" value={`${currentDay}`} />
        <Stat label="Progression" value={`${progress} %`} />
      </section>

      {/* Défi du jour */}
      {todayChallenge ? (
        <section className="rounded-[19px] border border-primary/30 bg-gradient-to-br from-[rgba(245,184,0,.12)] to-[rgba(20,21,22,.97)] p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Jour {todayChallenge.day}</Badge>
            <Badge variant="muted">{getAgent(todayChallenge.agent).name}</Badge>
            {completed.has(todayChallenge.day) ? <Badge variant="success">Validé</Badge> : null}
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-cream">{todayChallenge.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{todayChallenge.goal}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => run(todayChallenge)} disabled={loading}>
              <Play className="h-4 w-4" />
              {active === todayChallenge.day && result ? 'Relancer le défi' : 'Lancer le défi'}
            </Button>
            <Button
              variant="outline"
              onClick={() => validate(todayChallenge.day)}
              disabled={completed.has(todayChallenge.day)}
            >
              <Check className="h-4 w-4" />
              {completed.has(todayChallenge.day) ? 'Déjà validé' : 'Je l’ai fait'}
            </Button>
          </div>
        </section>
      ) : null}

      {/* Résultat */}
      {loading ? <AiLoading message="Ton agent prépare le défi…" /> : null}

      {error ? (
        <p className="rounded-2xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      {!loading && result ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-cream">
              Jour {active} · {getPromptByDay(active)?.title}
            </h2>
            <Button size="sm" variant="outline" onClick={() => validate(active)} disabled={completed.has(active)}>
              <Check className="h-3.5 w-3.5" />
              {completed.has(active) ? 'Validé' : 'Marquer comme fait'}
            </Button>
          </div>

          {result.intro ? <CopyBlock label="Ce que tu obtiens" text={result.intro} tone="accent" /> : null}

          {(result.sections || []).map((section, index) => (
            <CopyBlock key={index} label={section.label} text={section.content}>
              {section.type === 'list' ? (
                <ul className="space-y-1.5">
                  {String(section.content || '')
                    .split('\n')
                    .map((line) => line.replace(/^[-•*\d.\s]+/, '').trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                        <span>{line}</span>
                      </li>
                    ))}
                </ul>
              ) : undefined}
            </CopyBlock>
          ))}
        </section>
      ) : null}

      {/* Bibliothèque des 50 défis */}
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f7c75]">
          Les {TOTAL_DAYS} défis
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DAILY_PROMPTS.map((challenge) => {
            const unlocked = isUnlocked(challenge.day);
            const isDone = completed.has(challenge.day);
            const isToday = challenge.day === currentDay;
            return (
              <article
                key={challenge.day}
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-4 transition-colors',
                  isDone
                    ? 'border-emerald-500/35 bg-emerald-500/[0.07]'
                    : isToday
                      ? 'border-primary/45 bg-primary/[0.07]'
                      : 'border-white/10 bg-white/[0.02]',
                  !unlocked && 'opacity-55',
                )}
              >
                <div className={cn('absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r', AGENT_COLORS[challenge.agent])} />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tabular-nums text-[#7f7c75]">
                    Jour {String(challenge.day).padStart(2, '0')}
                  </span>
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  ) : unlocked ? null : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <h3 className={cn('mt-1.5 text-sm font-semibold text-cream', !unlocked && 'blur-[3px]')}>
                  {challenge.title}
                </h3>
                <p className={cn('mt-1 text-xs leading-relaxed text-muted-foreground', !unlocked && 'blur-[3px]')}>
                  {challenge.goal}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#6f6c66]">
                    {getAgent(challenge.agent).name}
                  </span>
                  {unlocked ? (
                    <Button size="sm" variant="ghost" onClick={() => run(challenge)} disabled={loading}>
                      <Play className="h-3 w-3" />
                      Lancer
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      dans {challenge.day - currentDay} j
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <AgentChat
        agentKey={getPromptByDay(active)?.agent || 'antoine'}
        context={{ tool: '/defi-du-jour', lastResult: result }}
      />
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3',
        accent ? 'border-primary/30 bg-primary/[0.08]' : 'border-white/10 bg-white/[0.02]',
      )}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7f7c75]">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', accent ? 'text-primary' : 'text-cream')}>{value}</p>
    </div>
  );
}
