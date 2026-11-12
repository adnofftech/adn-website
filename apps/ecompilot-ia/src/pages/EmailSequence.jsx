import React from 'react';
import { Mail } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function EmailSequence() {
  return (
    <ToolShell
      toolKey="/emails"
      agentKey="claire"
      icon={Mail}
      title="Séquences e-mail"
      subtitle="Six e-mails prêts à programmer : objet, aperçu, corps et bouton. Ton humain, aucune fausse urgence."
      fn="generateEmailSequence"
      cta="Générer ma séquence"
      fields={[
        {
          name: 'goal',
          label: 'Objectif de la séquence',
          type: 'select',
          wide: true,
          defaultValue: 'Panier abandonné',
          options: [
            {
              value: 'Panier abandonné',
              label: 'Panier abandonné'
            },
            {
              value: 'Bienvenue après inscription',
              label: 'Bienvenue après inscription'
            },
            {
              value: 'Après le premier achat',
              label: 'Après le premier achat'
            },
            {
              value: 'Réactivation des clients inactifs',
              label: 'Réactivation des clients inactifs'
            },
            {
              value: 'Lancement d’un nouveau produit',
              label: 'Lancement d’un nouveau produit'
            }
          ]
        }
      ]}
    />
  );
}
