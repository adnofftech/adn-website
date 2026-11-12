import React from 'react';
import { useLocation } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { CopyBlock } from '@/components/ai/CopyBlock';
import { Badge } from '@/components/ui/badge';
import { useEcomProfile } from '@/lib/useEcomProfile';

export default function AdCopy() {
  const location = useLocation();
  const { productPhoto } = useEcomProfile();
  const angleFromRemi = location.state?.angle || '';

  return (
    <ToolShell
      toolKey="/textes-publicitaires"
      agentKey="claire"
      icon={Megaphone}
      title="Textes publicitaires"
      subtitle="Accroches, script vidéo, titres et deux versions du texte principal : une pour les gens qui ne te connaissent pas, une pour ceux qui ont déjà visité ta boutique."
      tagline={
        productPhoto
          ? 'Ta photo produit est utilisée comme contexte si tu ne renseignes pas de nom de produit.'
          : 'Ajoute une photo produit dans tes paramètres pour que Claire décrive ce qu’elle voit.'
      }
      fn="generateAdCopy"
      cta="Générer mes textes"
      loadingMessage="Claire rédige tes textes publicitaires…"
      fields={[
        {
          name: 'platform',
          label: 'Plateforme',
          type: 'select',
          defaultValue: 'Facebook',
          options: [
            { value: 'Facebook', label: 'Facebook et Instagram' },
            { value: 'TikTok', label: 'TikTok' },
            { value: 'Google Shopping', label: 'Google Shopping' },
            { value: 'Pinterest', label: 'Pinterest' },
          ],
        },
        { name: 'productName', label: 'Nom du produit', placeholder: 'Laisse vide pour utiliser ta photo' },
        {
          name: 'angle',
          label: 'Angle à suivre',
          type: 'textarea',
          wide: true,
          rows: 2,
          defaultValue: angleFromRemi,
          placeholder: 'Vide = Claire choisit l’angle la plus vendeuse',
          hint: angleFromRemi ? 'Angle transmis par Rémi depuis « Angles publicitaires ».' : undefined,
        },
      ]}
      render={(data) => (
        <div className="flex flex-col gap-5">
          {data.hooks?.length ? (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f7c75]">
                  Accroches des 3 premières secondes
                </h2>
                <Badge variant="muted">{data.hooks.length}</Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.hooks.map((hook, index) => (
                  <CopyBlock key={index} label={`Accroche ${index + 1}`} text={hook} />
                ))}
              </div>
            </section>
          ) : null}

          {data.headlines?.length ? (
            <section>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f7c75]">
                Titres publicitaires
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.headlines.map((headline, index) => (
                  <CopyBlock key={index} text={headline} />
                ))}
              </div>
            </section>
          ) : null}

          {data.script ? <CopyBlock label="Script vidéo" text={data.script} tone="accent" /> : null}
          {data.body ? <CopyBlock label="Texte principal" text={data.body} /> : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {data.coldVersion ? <CopyBlock label="Version audience froide" text={data.coldVersion} /> : null}
            {data.warmVersion ? <CopyBlock label="Version audience chaude" text={data.warmVersion} /> : null}
          </div>
        </div>
      )}
    />
  );
}
