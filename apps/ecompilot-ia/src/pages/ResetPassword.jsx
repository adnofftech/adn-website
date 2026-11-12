import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (password.length < 8) {
      setError('Choisis un mot de passe de 8 caractères au minimum.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne sont pas identiques.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await base44.auth.resetPassword({ token, password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'Ce lien n’est plus valide. Demande-en un nouveau.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle={token ? 'Choisis un mot de passe que tu retiendras.' : 'Le lien est incomplet : demande un nouvel envoi.'}
      footer={
        <Link to="/forgot-password" className="font-semibold text-primary underline decoration-primary/40">
          Demander un nouveau lien
        </Link>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="reset-password">Mot de passe</Label>
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label htmlFor="reset-confirm">Confirmation</Label>
          <Input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="mt-2"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <Button type="submit" disabled={loading || !token}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer le mot de passe
        </Button>
      </form>
    </AuthShell>
  );
}
