import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Syringe, Eye, EyeOff, Wifi, WifiOff, Zap } from 'lucide-react';

export default function LoginPage({ lang, setLang }) {
  const { login, sendMagicLink, isOnline } = useAuth();
  const navigate = useNavigate();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [form, setForm] = useState({ email: '', password: '' });
  const [magicEmail, setMagicEmail] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/Dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendMagicLink(magicEmail);
      setMagicSent(true);
      setTimeout(() => navigate('/Dashboard', { replace: true }), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center p-4">
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-xs text-center py-1.5 flex items-center justify-center gap-1.5 z-50">
          <WifiOff className="h-3.5 w-3.5" />
          {t('No internet connection — some features may be unavailable', 'Pas de connexion internet — certaines fonctionnalités peuvent être indisponibles')}
        </div>
      )}

      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary mb-4 shadow-lg">
            <Syringe className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">VERHUS-CAMEROON</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Vaccination & Health Reporting — Cameroon', 'Vaccination & Rapports de Santé — Cameroun')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t('Sign in', 'Connexion')}</h2>
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

          <Tabs defaultValue="password">
            <TabsList className="w-full">
              <TabsTrigger value="password" className="flex-1 text-xs">
                {t('Password', 'Mot de passe')}
              </TabsTrigger>
              <TabsTrigger value="magic" className="flex-1 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {t('Magic Link', 'Lien magique')}
              </TabsTrigger>
            </TabsList>

            {/* Password tab */}
            <TabsContent value="password">
              <form onSubmit={handleLogin} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@verhus.cm"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('Password', 'Mot de passe')}</Label>
                    <Link to="/reset-password" className="text-[11px] text-primary hover:underline">
                      {t('Forgot password?', 'Mot de passe oublié ?')}
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder=""
                      autoComplete="current-password"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 z-10 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !isOnline}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {t('Signing in...', 'Connexion...')}
                    </span>
                  ) : t('Sign in', 'Se connecter')}
                </Button>
              </form>
            </TabsContent>

            {/* Magic link tab */}
            <TabsContent value="magic">
              <form onSubmit={handleMagicLink} className="space-y-4 pt-3">
                {magicSent ? (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-2xl">✉️</div>
                    <p className="text-sm font-medium">{t('Signing you in…', 'Connexion en cours…')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('In production, a link would be sent to your email.', 'En production, un lien serait envoyé à votre email.')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={magicEmail}
                        onChange={e => setMagicEmail(e.target.value)}
                        placeholder="you@verhus.cm"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {t("We'll send a one-click sign-in link to your email.", "Nous enverrons un lien de connexion à votre email.")}
                    </p>
                    <Button type="submit" className="w-full" disabled={loading || !isOnline}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          {t('Sending…', 'Envoi…')}
                        </span>
                      ) : t('Send Magic Link', 'Envoyer le lien')}
                    </Button>
                  </>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          {t("Don't have an account?", "Pas encore de compte ?")}{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('Sign up', "S'inscrire")}
          </Link>
        </p>

        {/* Demo hint */}
        <div className="mt-4 bg-muted/60 border border-border rounded-xl p-3 text-[11px] text-muted-foreground space-y-0.5">
          <p className="font-medium text-foreground">{t('Demo credentials', 'Identifiants de démo')}</p>
          <p>admin@verhus.cm / Admin1234!</p>
        </div>
      </div>
    </div>
  );
}
