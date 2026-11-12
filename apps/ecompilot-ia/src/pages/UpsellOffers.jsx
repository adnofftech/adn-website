import React from 'react';
import { Layers } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function UpsellOffers() {
  return (
    <ToolShell
      toolKey="/offres-supplementaires"
      agentKey="remi"
      icon={Layers}
      title="Upsell & bundles"
      subtitle="Augmente ton panier moyen sans dépenser un euro de publicité en plus : lots, produits complémentaires, garanties."
      fn="generateUpsellOffers"
      cta="Générer mes offres supplémentaires"
      fields={[
        {
          name: 'productName',
          label: 'Ton produit principal',
          placeholder: 'Ex. : harnais anti-traction',
          wide: true
        }
      ]}
    />
  );
}
