import React from 'react';
import { Map } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';

export default function Roadmap() {
  return (
    <ToolShell
      toolKey="/roadmap"
      agentKey="antoine"
      icon={Map}
      title="Mes premiers 1 000 €"
      subtitle="La feuille de route complète, de la boutique vide aux premiers 1 000 € de chiffre d’affaires. Une étape à la fois, dans l’ordre."
      tagline="Antoine te dit quoi faire ensuite, sans te noyer."
      fn="generateRoadmap"
      cta="Générer ma feuille de route"
    />
  );
}
