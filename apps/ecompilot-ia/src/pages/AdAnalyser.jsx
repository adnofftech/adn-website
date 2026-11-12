import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { LinkButton } from '@/components/ai/LinkButton';

export default function AdAnalyser() {
  return (
    <ToolShell
      toolKey="/analyseur-pubs"
      agentKey="remi"
      icon={BarChart3}
      title="Analyseur de pubs"
      subtitle="Colle une publicité concurrente : Rémi décortique l’accroche, le visuel, l’offre et te dit quoi reprendre."
      fn="analyzeAds"
      cta="Analyser la publicité"
      fields={[
        {
          name: 'ads',
          label: 'La publicité à analyser',
          type: 'textarea',
          wide: true,
          rows: 6,
          placeholder: 'Colle le texte de la publicité, décris la vidéo, le prix affiché, l’offre, les commentaires que tu as vus…',
          hint: 'Plus tu donnes de détails, plus l’analyse est précise.'
        }
      ]}
    >
      <div className="flex flex-wrap gap-2">
        <LinkButton href="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=FR">Facebook Ad Library</LinkButton>
        <LinkButton href="https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/fr">TikTok Creative Center</LinkButton>
      </div>
    </ToolShell>
  );
}
