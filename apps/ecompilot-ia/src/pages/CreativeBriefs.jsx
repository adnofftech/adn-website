import React from 'react';
import { Clapperboard } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function CreativeBriefs() {
  return (
    <ToolShell
      toolKey="/briefs-creatifs"
      agentKey="claire"
      icon={Clapperboard}
      title="Briefs créatifs"
      subtitle="Les briefs de tournage et les prompts d’image pour produire tes visuels, même seul avec un téléphone."
      fn="generateImagePrompts"
      cta="Générer mes briefs"
      fields={[
        {
          name: 'productName',
          label: 'Ton produit',
          placeholder: 'Ex. : gamelle anti-glouton',
          wide: true
        }
      ]}
    />
  );
}
