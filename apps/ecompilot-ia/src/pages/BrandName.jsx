import React from 'react';
import { Building2 } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { LinkButton } from '@/components/ai/LinkButton';

export default function BrandName() {
  return (
    <ToolShell
      toolKey="/generateur-marque"
      agentKey="claire"
      icon={Building2}
      title="Générateur de marque"
      subtitle="Dix noms de marque prononçables, avec le domaine et le pseudo à vérifier, et une accroche pour chacun."
      tagline="La disponibilité du nom, du domaine et de la marque reste à vérifier avant usage."
      fn="generateBrandName"
      cta="Générer des noms"
      fields={[
        {
          name: 'style',
          label: 'Style souhaité (facultatif)',
          wide: true,
          placeholder: 'Ex. : doux et affectueux, ou plutôt premium et sobre'
        }
      ]}
    >
      <div className="flex flex-wrap gap-2">
        <LinkButton href="https://www.afnic.fr/noms-de-domaine/tout-savoir/whois/">Vérifier un domaine (Afnic)</LinkButton>
      </div>
    </ToolShell>
  );
}
