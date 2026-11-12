import React from 'react';
import { Stethoscope } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function Diagnosis() {
  return (
    <ToolShell
      toolKey="/diagnostic"
      agentKey="antoine"
      icon={Stethoscope}
      title="Diagnostic"
      subtitle="Décris ce qui ne va pas sur ta boutique : Antoine cherche la cause et te donne le plan pour la corriger."
      fn="diagnoseProblem"
      cta="Lancer le diagnostic"
      fields={[
        {
          name: 'symptoms',
          label: 'Ce que tu observes',
          type: 'textarea',
          wide: true,
          rows: 5,
          placeholder: 'Ex. : j’ai 300 visites et aucune vente. Les gens ajoutent au panier mais n’achètent pas. Mon budget est de 15 € par jour depuis 6 jours.',
          hint: 'Donne des chiffres : visites, ajouts au panier, ventes, budget, durée.'
        }
      ]}
    />
  );
}
