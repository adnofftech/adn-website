import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function ScaleChecker() {
  return (
    <ToolShell
      toolKey="/scale-checker"
      agentKey="antoine"
      icon={TrendingUp}
      title="Scale checker"
      subtitle="Es-tu prêt à augmenter tes budgets publicitaires ? Antoine passe six critères en revue avant de te laisser accélérer."
      fn="checkScale"
      cta="Vérifier si je peux accélérer"
      fields={[
        {
          name: 'metrics',
          label: 'Tes chiffres des 14 derniers jours',
          type: 'textarea',
          wide: true,
          rows: 5,
          placeholder: 'Ex. : 42 ventes en 14 jours, panier moyen 38 €, coût par vente 14 €, marge nette 11 €, 1 200 € de trésorerie disponible.',
          hint: 'Ventes, panier moyen, coût d’acquisition, marge nette, trésorerie.'
        }
      ]}
    />
  );
}
