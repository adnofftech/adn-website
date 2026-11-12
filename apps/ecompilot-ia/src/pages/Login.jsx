import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await base44.auth.login({ email: email.trim(), password });
      if (res?.token) base44.auth.setToken(res.token);
      await checkUserAuth();
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Connexion impossible. Vérifie ton adresse et ton mot de passe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Retrouve ta niche, tes résultats enregistrés et ta boutique connectée."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-primary underline decoration-primary/40">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="login-email">Adresse e-mail</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="login-password">Mot de passe</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2"
            required
          />
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Se connecter
        </Button>

        <Button type="button" variant="outline" onClick={() => base44.auth.loginWithGoogle()}>
          Continuer avec Google
        </Button>

        <Link
          to="/forgot-password"
          className="text-center text-xs text-muted-foreground underline decoration-white/20"
        >
          Mot de passe oublié ?
        </Link>
      </form>
    </AuthShell>
  );
}
