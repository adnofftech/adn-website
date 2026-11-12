import React from 'react';
import { CopyBlock } from '@/components/ai/CopyBlock';
import { cn } from '@/lib/utils';

/** Libellés français des clés renvoyées par les fonctions IA. */
export const LABELS = {
  intro: 'En deux mots',
  steps: 'Les étapes',
  title: 'Titre',
  name: 'Nom',
  description: 'Description',
  shortDescription: 'Accroche courte',
  action: 'À faire maintenant',
  why: 'Pourquoi',
  how: 'Comment faire',
  hooks: 'Accroches',
  headlines: 'Titres publicitaires',
  body: 'Texte principal',
  script: 'Script vidéo',
  coldVersion: 'Version audience froide',
  warmVersion: 'Version audience chaude',
  emails: 'Séquence d’e-mails',
  offers: 'Offres',
  angles: 'Angles',
  products: 'Produits',
  competitors: 'Concurrents',
  scripts: 'Scripts',
  posts: 'Publications',
  names: 'Noms',
  briefs: 'Briefs créatifs',
  prompts: 'Prompts d’image',
  faqs: 'Questions fréquentes',
  question: 'Question',
  reponse: 'Réponse',
  answer: 'Réponse',
  bullets: 'Bénéfices',
  features: 'Caractéristiques',
  seoTitle: 'Titre SEO',
  seoDescription: 'Description SEO',
  guarantee: 'Garantie',
  cta: 'Appel à l’action',
  imageFeedback: 'Avis sur ta photo',
  diagnostic: 'Diagnostic',
  causes: 'Causes probables',
  plan: 'Plan d’action',
  verdict: 'Verdict',
  recommendations: 'Recommandations',
  score: 'Score',
  summary: 'Résumé',
  situation: 'Situation',
  benefice: 'Bénéfice',
  scene: 'Scène à filmer',
  hook: 'Accroche',
  label: 'Intitulé',
  content: 'Contenu',
  goal: 'Objectif',
  subject: 'Objet',
  day: 'Jour',
  timing: 'Quand',
  platform: 'Plateforme',
  format: 'Format',
  audience: 'Audience',
  budget: 'Budget',
  priority: 'Priorité',
  risk: 'Risque',
  nextStep: 'Prochaine étape',
  warnings: 'Points de vigilance',
  tips: 'Conseils',
  checklist: 'Check-list',
};

export function humanize(key) {
  if (LABELS[key]) return LABELS[key];
  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

const SKIP_KEYS = new Set(['id', 'created_date', 'updated_date', 'created_by_id', 'savedAt', 'tool_key']);

/** Rendu générique et lisible de n’importe quelle réponse JSON. */
export function ResultView({ data, className }) {
  if (data === null || data === undefined || data === '') return null;

  if (typeof data === 'string') return <CopyBlock text={data} className={className} />;

  if (Array.isArray(data)) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {data.map((item, index) => (
          <ItemCard key={index} index={index} item={item} />
        ))}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data).filter(([key, value]) => !SKIP_KEYS.has(key) && value !== null && value !== '');
    return (
      <div className={cn('flex flex-col gap-5', className)}>
        {entries.map(([key, value]) => (
          <section key={key}>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f7c75]">
              {humanize(key)}
            </h2>
            {typeof value === 'object' ? <ResultView data={value} /> : <CopyBlock text={String(value)} />}
          </section>
        ))}
      </div>
    );
  }

  return <CopyBlock text={String(data)} />;
}

function ItemCard({ item, index }) {
  if (item === null || item === undefined) return null;

  if (typeof item !== 'object') {
    return (
      <CopyBlock text={String(item)}>
        <span className="flex gap-3">
          <span className="font-semibold text-primary">{String(index + 1).padStart(2, '0')}</span>
          <span>{String(item)}</span>
        </span>
      </CopyBlock>
    );
  }

  const entries = Object.entries(item).filter(([key, value]) => !SKIP_KEYS.has(key) && value !== null && value !== '');
  const headKey = ['title', 'name', 'label', 'question', 'subject', 'hook'].find((key) => item[key]);
  const head = headKey ? item[headKey] : null;
  const rest = entries.filter(([key]) => key !== headKey);
  const copyText = entries
    .map(([key, value]) => `${humanize(key)} : ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-primary/35 bg-primary/12 text-xs font-bold text-primary">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          {head ? <h3 className="text-base font-semibold tracking-tight text-cream">{String(head)}</h3> : null}
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {rest.map(([key, value]) => (
              <div key={key} className={Array.isArray(value) || String(value).length > 120 ? 'sm:col-span-2' : ''}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">
                  {humanize(key)}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-cream/85">
                  {Array.isArray(value) ? (
                    <ul className="list-inside list-disc space-y-1">
                      {value.map((entry, i) => (
                        <li key={i}>{typeof entry === 'object' ? JSON.stringify(entry) : String(entry)}</li>
                      ))}
                    </ul>
                  ) : typeof value === 'object' ? (
                    <ResultView data={value} />
                  ) : (
                    String(value)
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <CopyBlock text={copyText} className="mt-4 border-0 bg-transparent p-0">
        <span className="sr-only">{copyText}</span>
      </CopyBlock>
    </article>
  );
}

export default ResultView;
