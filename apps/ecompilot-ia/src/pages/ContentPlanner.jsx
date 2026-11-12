import React from 'react';
import { CalendarDays } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function ContentPlanner() {
  return (
    <ToolShell
      toolKey="/contenu-organique"
      agentKey="camille"
      icon={CalendarDays}
      title="Contenu organique"
      subtitle="Ton calendrier de publications, un contenu par jour, avec l’accroche, la légende et les hashtags prêts à copier."
      fn="generateContentPlan"
      cta="Générer mon calendrier"
      fields={[
        {
          name: 'platform',
          label: 'Plateformes',
          type: 'select',
          defaultValue: 'Instagram et TikTok',
          options: [
            {
              value: 'Instagram et TikTok',
              label: 'Instagram et TikTok'
            },
            {
              value: 'TikTok',
              label: 'TikTok'
            },
            {
              value: 'Instagram',
              label: 'Instagram'
            },
            {
              value: 'Facebook',
              label: 'Facebook'
            },
            {
              value: 'Pinterest',
              label: 'Pinterest'
            }
          ]
        },
        {
          name: 'days',
          label: 'Nombre de jours',
          type: 'select',
          defaultValue: '14',
          options: [
            {
              value: '7',
              label: '7 jours'
            },
            {
              value: '14',
              label: '14 jours'
            },
            {
              value: '30',
              label: '30 jours'
            }
          ]
        }
      ]}
    />
  );
}
