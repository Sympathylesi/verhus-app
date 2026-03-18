import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Syringe, Eye, EyeOff } from 'lucide-react';

const roleOptions = [
  { value: ROLES.COLLECTOR, en: 'Data Collector', fr: 'Collecteur de données' },
  { value: ROLES.SUPERVISOR, en: 'Supervisor', fr: 'Superviseur' },
  { value: ROLES.ADMIN, en: 'Administrator', fr: 'Administrateur' },
];

export default function RegisterPage({ lang, setLang }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', role: ROLES.COLLECTOR });
  const [showPw, setShowPw] = useState(false);

  const toggleShowPw = () => setShowPw(v => !v);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.full_name.trim()) return t('Full name is required', 'Le nom complet est requis');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return t('Enter a valid email', 'Entrez un email valide');
    if (form.password.length < 8) return t('Password must be at least 8 characters', 'Le mot de passe doit contenir au moins 8 caractères');
    if (form.password !== form.confirm) return t('Passwords do not match', 'Les mots de passe ne correspondent pas');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password, role: form.role });
      navigate('/Dashboard', { replace: true });
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
          <p className="text-sm text-muted-foreground mt-1">
            {t('Create your account', 'Créer votre compte')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t('Sign up', "S'inscrire")}</h2>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Full Name', 'Nom complet')}</Label>
              <Input
                value={form.full_name}
                onChange={set('full_name')}
                placeholder={t('Jean Dupont', 'Jean Dupont')}
                autoComplete="name"
                required
              />
            </div>

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
              <Label className="text-xs">{t('Role', 'Rôle')}</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {t(r.en, r.fr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('Password', 'Mot de passe')}</Label>
              <div className="relative flex items-center">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={toggleShowPw}
                  className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">{t('Minimum 8 characters', 'Minimum 8 caractères')}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('Confirm Password', 'Confirmer le mot de passe')}</Label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t('Creating account…', 'Création du compte…')}
                </span>
              ) : t('Create Account', 'Créer le compte')}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          {t('Already have an account?', 'Vous avez déjà un compte ?')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('Sign in', 'Se connecter')}
          </Link>
        </p>
      </div>
    </div>
  );
}
