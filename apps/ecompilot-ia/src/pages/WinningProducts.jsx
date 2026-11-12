import React from 'react';
import { Sparkles } from 'lucide-react';
import { ToolShell } from '@/components/ai/ToolShell';
import { ProductCard } from '@/components/products/ProductCard';
import { Badge } from '@/components/ui/badge';

export default function WinningProducts() {
  return (
    <ToolShell
      toolKey="/produits-gagnants"
      agentKey="remi"
      icon={Sparkles}
      title="Produits gagnants"
      subtitle="Dix produits à fort potentiel dans ta niche, trouvés par recherche web en temps réel, avec marge réelle, concurrence et preuves de demande."
      tagline="Recherche web activée et modèle le plus précis : cette génération consomme plus de crédits que les autres outils."
      fn="generateWinningProducts"
      cta="Chercher mes produits gagnants"
      loadingMessage="Rémi fouille le web pour ta niche : comptez 30 à 60 secondes…"
      emptyHint="Rémi va chercher dix produits qui résolvent un problème réel, filmables en 5 secondes, avec au moins 60 % de marge brute."
      render={(data) => {
        const products = data?.products || [];
        if (!products.length) return null;
        const toTest = products.filter((product) => String(product.verdict || '').toLowerCase().includes('tester'));
        return (
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="muted">{products.length} produits analysés</Badge>
              <Badge variant="success">{toTest.length} à tester</Badge>
              <Badge variant="danger">{products.length - toTest.length} à éviter</Badge>
            </div>
            <div className="flex flex-col gap-4">
              {products.map((product, index) => (
                <ProductCard key={`${product.name}-${index}`} product={product} index={index} />
              ))}
            </div>
          </section>
        );
      }}
    />
  );
}
