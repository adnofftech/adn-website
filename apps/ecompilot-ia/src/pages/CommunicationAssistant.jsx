import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function CommunicationAssistant() {
  return (
    <ToolShell
      toolKey="/communication"
      agentKey="samuel"
      icon={MessageSquareText}
      title="Communication"
      subtitle="Colle le message d’un client : Samuel prépare la réponse à envoyer, en version courte et en version détaillée."
      fn="writeCommunication"
      cta="Préparer la réponse"
      fields={[
        {
          name: 'message',
          label: 'Le message du client',
          type: 'textarea',
          wide: true,
          rows: 4,
          placeholder: 'Ex. : « Bonjour, j’ai commandé il y a 12 jours et je n’ai toujours rien reçu. Je veux un remboursement. »'
        },
        {
          name: 'context',
          label: 'Ce que tu sais de la commande',
          type: 'textarea',
          rows: 3,
          placeholder: 'Ex. : colis expédié le 3, suivi bloqué en transit, délai annoncé 8 à 14 jours.'
        },
        {
          name: 'channel',
          label: 'Canal',
          type: 'select',
          defaultValue: 'e-mail',
          options: [
            {
              value: 'e-mail',
              label: 'E-mail'
            },
            {
              value: 'message privé Instagram',
              label: 'Message privé Instagram'
            },
            {
              value: 'chat de la boutique',
              label: 'Chat de la boutique'
            },
            {
              value: 'commentaire public',
              label: 'Commentaire public'
            }
          ]
        }
      ]}
    />
  );
}
