import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="ta-team flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Erreur 404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cream">Cette page n’existe pas</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Le lien est peut-être ancien. Reviens à l’accueil : tes six agents t’y attendent.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Retour à l’accueil</Link>
        </Button>
      </div>
    </div>
  );
}
