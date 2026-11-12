import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GenerateButton({ loading, children = 'Générer', onClick, variant = 'default', ...props }) {
  return (
    <Button onClick={onClick} disabled={loading} variant={variant} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {loading ? 'Génération en cours…' : children}
    </Button>
  );
}

export default GenerateButton;
