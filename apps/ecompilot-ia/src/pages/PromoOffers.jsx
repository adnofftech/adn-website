import React from 'react';
import { Percent } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function PromoOffers() {
  return (
    <ToolShell
      toolKey="/offres-promos"
      agentKey="remi"
      icon={Percent}
      title="Offres & promos"
      subtitle="Cinq mécaniques de promotion adaptées à ta niche, avec le texte d’annonce prêt à publier et l’effet réel sur ta marge."
      fn="generatePromoOffers"
      cta="Générer mes promos"
    />
  );
}
