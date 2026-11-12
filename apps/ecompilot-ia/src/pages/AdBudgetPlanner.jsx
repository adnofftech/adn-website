import React from 'react';
import { Wallet } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function AdBudgetPlanner() {
  return (
    <ToolShell
      toolKey="/budget-publicitaire"
      agentKey="remi"
      icon={Wallet}
      title="Budget publicitaire"
      subtitle="Combien dépenser, quand, et à quel moment couper. Rémi découpe ton budget en phases avec une décision à la fin de chacune."
      fn="planAdBudget"
      cta="Construire mon plan de budget"
      fields={[
        {
          name: 'budget',
          label: 'Budget total disponible',
          placeholder: 'Ex. : 300 € pour le premier mois'
        },
        {
          name: 'goals',
          label: 'Ton objectif',
          placeholder: 'Ex. : valider un produit et faire mes 10 premières ventes'
        }
      ]}
    />
  );
}
