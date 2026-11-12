import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { base44 } from '@/api/base44';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest({ email: email.trim() });
    } catch {
      /* message volontairement générique */
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Indique ton adresse : nous t’envoyons un lien pour choisir un nouveau mot de passe."
      footer={
        <Link to="/login" className="font-semibold text-primary underline decoration-primary/40">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-4">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p className="text-sm text-emerald-100">
            Si un compte existe pour cette adresse, le lien de réinitialisation vient de partir. Pense à regarder tes
            courriers indésirables.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="forgot-email">Adresse e-mail</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
