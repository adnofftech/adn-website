import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function TrustBuilder() {
  return (
    <ToolShell
      toolKey="/trust-builder"
      agentKey="samuel"
      icon={ShieldCheck}
      title="Trust builder"
      subtitle="Garanties, réassurances, questions fréquentes : tout ce qui donne envie d’acheter à un inconnu, et où le placer."
      tagline="Samuel n’invente aucun avis client : les faux avis sont interdits en France."
      fn="generateTrustContent"
      cta="Générer mes éléments de confiance"
    />
  );
}
