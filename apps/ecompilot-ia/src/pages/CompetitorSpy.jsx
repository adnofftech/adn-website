import React from 'react';
import { Radar } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { LinkButton } from '@/components/ai/LinkButton';
import { Badge } from '@/components/ui/badge';

export default function CompetitorSpy() {
  return (
    <ToolShell
      toolKey="/espionnage-concurrents"
      agentKey="remi"
      icon={Radar}
      title="Espionnage concurrents"
      subtitle="Qui vend déjà dans ta niche, à quel prix, avec quels angles publicitaires — et la leçon à en tirer pour ta boutique."
      fn="spyCompetitors"
      cta="Analyser mes concurrents"
      loadingMessage="Rémi cherche les boutiques qui vendent déjà…"
      fields={[
        { name: 'product', label: 'Produit ou mot-clé (facultatif)', placeholder: 'Ex. : harnais anti-traction', wide: true },
      ]}
      render={(data) => {
        const competitors = data?.competitors || [];
        if (!competitors.length) return null;
        return (
          <div className="flex flex-col gap-4">
            {competitors.map((competitor, index) => (
              <article
                key={`${competitor.name}-${index}`}
                className="rounded-[19px] border border-white/12 bg-gradient-to-b from-[rgba(39,40,40,.94)] to-[rgba(20,21,22,.97)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold tracking-tight text-cream">{competitor.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{competitor.positioning}</p>
                  </div>
                  {competitor.priceRange ? <Badge variant="muted">{competitor.priceRange}</Badge> : null}
                </div>

                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {competitor.offer ? <Block label="Offre" value={competitor.offer} /> : null}
                  {competitor.creativeStyle ? <Block label="Style des créations" value={competitor.creativeStyle} /> : null}
                  <ListBlock label="Angles repérés" items={competitor.adAngles} />
                  <ListBlock label="Forces" items={competitor.strengths} />
                  <ListBlock label="Faiblesses" items={competitor.weaknesses} />
                  {competitor.lessonForYou ? (
                    <Block label="À retenir pour toi" value={competitor.lessonForYou} wide accent />
                  ) : null}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  {competitor.site ? (
                    <LinkButton href={competitor.site.startsWith('http') ? competitor.site : `https://${competitor.site}`}>
                      Voir la boutique
                    </LinkButton>
                  ) : null}
                  {competitor.adLibraryQuery ? (
                    <LinkButton
                      href={`https://www.facebook.com/ads/library/?q=${encodeURIComponent(
                        competitor.adLibraryQuery,
                      )}&active_status=all&ad_type=all&country=FR`}
                    >
                      Ses publicités en cours
                    </LinkButton>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        );
      }}
    />
  );
}

function Block({ label, value, wide, accent }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">{label}</dt>
      <dd
        className={
          accent
            ? 'mt-1.5 rounded-2xl border border-primary/25 bg-primary/[0.06] p-3 text-sm leading-relaxed text-cream/90'
            : 'mt-1 text-sm leading-relaxed text-cream/85'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ListBlock({ label, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">{label}</dt>
      <dd className="mt-1.5">
        <ul className="space-y-1 text-sm text-cream/85">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
}
