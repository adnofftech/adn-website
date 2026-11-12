import React from 'react';
import { UserRound } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function CustomerAvatar() {
  return (
    <ToolShell
      toolKey="/avatar-client"
      agentKey="samuel"
      icon={UserRound}
      title="Avatar client"
      subtitle="Le portrait précis de ton client idéal : ses douleurs, ses désirs, ses mots, et où le trouver."
      fn="generateCustomerAvatar"
      cta="Générer mon avatar client"
    />
  );
}
