import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock3, Lock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AiLoading } from '@/components/ai/AiLoading';
import { GenerateButton } from '@/components/ai/GenerateButton';
import { ResultView } from '@/components/ai/ResultView';
import { AgentChat } from '@/components/ai/AgentChat';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAi } from '@/lib/useAi';
import { useEcomProfile } from '@/lib/useEcomProfile';
import { getAgent } from '@/lib/agents';
import { timeAgo } from '@/lib/utils';

/**
 * Coquille commune aux 27 outils : en-tête, champs de saisie éventuels,
 * bouton de génération, état de chargement, erreurs, mémoire du dernier
 * résultat et conversation avec l’agent concerné.
 */
export function ToolShell({
  toolKey,
  agentKey,
  icon,
  title,
  subtitle,
  tagline,
  fn,
  cta = 'Générer',
  fields = [],
  buildPayload,
  render,
  loadingMessage,
  children,
  emptyHint,
}) {
  const agent = getAgent(agentKey);
  const { isGuest, niche } = useEcomProfile();
  const { data, loading, error, call, savedAt, restoring } = useAi(toolKey);
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ''])),
  );

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const missing = fields.filter((field) => field.required && !String(values[field.name] || '').trim());

  async function generate() {
    const payload = buildPayload ? buildPayload(values) : { ...values, niche };
    await call(fn, payload);
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        tagline={tagline}
        color={agent.color}
        actions={
          <>
            {savedAt ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Dernier résultat {timeAgo(savedAt)}
              </span>
            ) : null}
            <GenerateButton loading={loading} onClick={generate} disabled={loading || missing.length > 0}>
              {data ? 'Régénérer' : cta}
            </GenerateButton>
          </>
        }
      />

      {isGuest ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/[0.08] px-4 py-3 text-sm text-violet-100">
          <Lock className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">
            Mode démo : la niche est celle de la démonstration et tes résultats ne sont pas conservés.
          </span>
          <Link to="/register" className="font-semibold text-violet-200 underline decoration-violet-400/60">
            Créer un compte
          </Link>
        </div>
      ) : null}

      {fields.length ? (
        <section className="grid gap-4 rounded-[19px] border border-white/12 bg-white/[0.02] p-5 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.wide ? 'md:col-span-2' : ''}>
              <Label htmlFor={`field-${field.name}`}>
                {field.label}
                {field.required ? ' *' : ''}
              </Label>
              <div className="mt-2">
                {field.type === 'textarea' ? (
                  <Textarea
                    id={`field-${field.name}`}
                    value={values[field.name]}
                    onChange={(event) => setValue(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows || 4}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={`field-${field.name}`}
                    value={values[field.name]}
                    onChange={(event) => setValue(field.name, event.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-black/30 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {(field.options || []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`field-${field.name}`}
                    type={field.type || 'text'}
                    value={values[field.name]}
                    onChange={(event) => setValue(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    inputMode={field.type === 'number' ? 'decimal' : undefined}
                  />
                )}
              </div>
              {field.hint ? <p className="mt-1.5 text-xs text-[#7f7c75]">{field.hint}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      {children}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? (
        <AiLoading message={loadingMessage || `${agent.name} prépare ton résultat…`} />
      ) : restoring ? (
        <AiLoading message="Je retrouve ton dernier résultat…" />
      ) : data ? (
        render ? (
          render(data)
        ) : (
          <ResultView data={data} />
        )
      ) : (
        <div className="rounded-[19px] border border-dashed border-white/14 bg-white/[0.015] px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {emptyHint || `Lance la génération : ${agent.name} travaille sur ta niche « ${niche} ».`}
          </p>
        </div>
      )}

      <AgentChat agentKey={agent.key} context={{ tool: toolKey, lastResult: data || null }} />
    </div>
  );
}

export default ToolShell;
