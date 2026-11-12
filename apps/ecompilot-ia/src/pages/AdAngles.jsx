import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { Button } from '@/components/ui/button';
import { CopyBlock } from '@/components/ai/CopyBlock';
import { toast } from '@/components/ui/toaster';

export default function AdAngles() {
  const navigate = useNavigate();

  function sendToClaire(angle) {
    const resume = `${angle.name} — situation : ${angle.situation} ; bénéfice : ${angle.benefice} ; accroche : ${angle.hook}`;
    toast({ title: 'Angle transmis à Claire', description: 'Tes textes publicitaires vont suivre cet angle.' });
    navigate('/textes-publicitaires', { state: { angle: resume } });
  }

  return (
    <ToolShell
      toolKey="/angles-publicitaires"
      agentKey="remi"
      icon={Compass}
      title="Angles publicitaires"
      subtitle="Trois angles émotionnels nettement différents pour ton produit. Choisis-en un : Claire écrira les textes avec."
      fn="generateAdAngles"
      cta="Générer mes angles"
      fields={[
        { name: 'productName', label: 'Ton produit', wide: true, placeholder: 'Ex. : fontaine à eau pour chat' },
      ]}
      render={(data) => {
        const angles = data?.angles || [];
        if (!angles.length) return null;
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            {angles.map((angle, index) => (
              <article
                key={`${angle.name}-${index}`}
                className="flex flex-col rounded-[19px] border border-white/12 bg-gradient-to-b from-[rgba(39,40,40,.94)] to-[rgba(20,21,22,.97)] p-5"
              >
                <p className="text-[11px] font-semibold tabular-nums text-[#7f7c75]">
                  Angle {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-cream">{angle.name}</h3>

                <div className="mt-4 space-y-3 text-sm leading-relaxed">
                  <Part label="Situation" value={angle.situation} />
                  <Part label="Bénéfice" value={angle.benefice} />
                  <Part label="Scène à filmer" value={angle.scene} />
                </div>

                <CopyBlock label="Accroche" text={angle.hook} tone="accent" className="mt-4" />

                <Button onClick={() => sendToClaire(angle)} className="mt-4 w-full">
                  Écrire les textes avec cet angle
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </article>
            ))}
          </div>
        );
      }}
    />
  );
}

function Part({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">{label}</p>
      <p className="mt-1 text-cream/85">{value}</p>
    </div>
  );
}
