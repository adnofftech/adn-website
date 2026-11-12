import React from 'react';
import { Lightbulb } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function StoreTips() {
  return (
    <ToolShell
      toolKey="/conseils-boutique"
      agentKey="samuel"
      icon={Lightbulb}
      title="Conseils boutique"
      subtitle="Dix améliorations classées de la plus rentable à la moins urgente, avec la correction exacte à faire dans Shopify."
      fn="generateStoreTips"
      cta="Générer mes conseils"
      fields={[
        {
          name: 'storeUrl',
          label: 'Adresse de ta boutique (facultatif)',
          wide: true,
          placeholder: 'Ex. : ma-boutique.myshopify.com'
        }
      ]}
    />
  );
}
