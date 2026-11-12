import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';

export default function Register() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function register(event) {
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
      const res = await base44.auth.register({ email: email.trim(), password });
      if (res?.token) {
        base44.auth.setToken(res.token);
        await checkUserAuth();
        navigate('/', { replace: true });
        return;
      }
      setStep('otp');
    } catch (err) {
      setError(err?.message || 'La création du compte a échoué.');
    } finally {
      setLoading(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await base44.auth.verifyOtp({ email: email.trim(), code: code.trim() });
      if (res?.token) base44.auth.setToken(res.token);
      await checkUserAuth();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Code incorrect ou expiré.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'otp') {
    return (
      <AuthShell title="Vérifie ton adresse" subtitle={`Nous avons envoyé un code à ${email}.`}>
        <form onSubmit={verify} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="otp-code">Code reçu</Label>
            <Input
              id="otp-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
              className="mt-2 text-center font-mono text-lg tracking-[0.3em]"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Valider
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Ta niche, tes résultats et ta progression sont alors enregistrés."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-semibold text-primary underline decoration-primary/40">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={register} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="register-email">Adresse e-mail</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="register-password">Mot de passe</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2"
            required
          />
          <p className="mt-1.5 text-xs text-[#7f7c75]">8 caractères minimum.</p>
        </div>

        <div>
          <Label htmlFor="register-confirm">Confirmation</Label>
          <Input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="mt-2"
            required
          />
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Créer mon compte
        </Button>

        <Button type="button" variant="outline" onClick={() => base44.auth.loginWithGoogle()}>
          Continuer avec Google
        </Button>
      </form>
    </AuthShell>
  );
}
