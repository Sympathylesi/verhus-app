import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Syringe, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPage({ lang, setLang }) {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [step, setStep] = useState(1); // 1=email, 2=new password, 3=done
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleEmailStep = (e) => {
    e.preventDefault();
    // In production: send reset email. Here we just advance.
    setError('');
    setStep(2);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError(t('Password must be at least 8 characters', 'Minimum 8 caractères')); return; }
    if (password !== confirm) { setError(t('Passwords do not match', 'Les mots de passe ne correspondent pas')); return; }
    setLoading(true);
    try {
      await resetPassword(email, password);
      setStep(3);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary mb-4 shadow-lg">
            <Syringe className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">VERHUS-CAMEROON</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t('Reset Password', 'Réinitialiser le mot de passe')}</h2>
            <button
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 transition-colors"
            >
              {lang === 'en' ? 'FR' : 'EN'}
            </button>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleEmailStep} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {t("Enter your email and we'll send you a reset link.", "Entrez votre email pour recevoir un lien de réinitialisation.")}
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@verhus.cm"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">{t('Continue', 'Continuer')}</Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {t('Enter your new password below.', 'Entrez votre nouveau mot de passe ci-dessous.')}
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('New Password', 'Nouveau mot de passe')}</Label>
                <div className="relative flex items-center">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('Confirm Password', 'Confirmer')}</Label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t('Saving…', 'Enregistrement…')}
                  </span>
                ) : t('Set New Password', 'Définir le mot de passe')}
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="font-medium">{t('Password updated!', 'Mot de passe mis à jour !')}</p>
              <p className="text-xs text-muted-foreground">{t('Redirecting to login…', 'Redirection vers la connexion…')}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          <Link to="/login" className="text-primary font-medium hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            {t('Back to sign in', 'Retour à la connexion')}
          </Link>
        </p>
      </div>
    </div>
  );
}
