import React from 'react';
import { Tag } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function PricingRecommender() {
  return (
    <ToolShell
      toolKey="/prix-livraison"
      agentKey="maxime"
      icon={Tag}
      title="Prix & livraison"
      subtitle="Le prix de vente qui laisse de la marge, trois scénarios chiffrés et la politique de livraison qui convertit."
      fn="recommendPricing"
      cta="Calculer mon prix"
      fields={[
        {
          name: 'product',
          label: 'Ton produit',
          placeholder: 'Ex. : fontaine à eau pour chat'
        },
        {
          name: 'cost',
          label: 'Coût d’achat',
          type: 'number',
          placeholder: 'Ex. : 8'
        },
        {
          name: 'shipping',
          label: 'Coût de livraison réel',
          type: 'number',
          placeholder: 'Ex. : 3'
        }
      ]}
    />
  );
}
