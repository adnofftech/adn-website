import React from 'react';
import { UserPlus } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function InfluencerScripts() {
  return (
    <ToolShell
      toolKey="/influenceurs-ugc"
      agentKey="camille"
      icon={UserPlus}
      title="Influenceurs & UGC"
      subtitle="Quatre scripts de vidéo UGC et trois messages de prise de contact prêts à envoyer aux micro-influenceurs."
      tagline="Toute collaboration rémunérée doit être signalée comme publicité."
      fn="generateInfluencerScripts"
      cta="Générer mes scripts"
      fields={[
        {
          name: 'productName',
          label: 'Ton produit',
          wide: true,
          placeholder: 'Ex. : brosse de toilettage auto-nettoyante'
        }
      ]}
    />
  );
}
