import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Menu, X, Syringe, WifiOff, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function generateWeekOptions(year) {
  return Array.from({ length: 52 }, (_, i) => ({
    value: `${year}-W${i + 1}`,
    label: `W${i + 1} – ${year}`,
  }));
}

const ROLE_STYLES = {
  admin: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400',
  supervisor: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
  collector: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400',
};

const ROLE_LABELS = {
  admin: { en: 'Admin', fr: 'Admin' },
  supervisor: { en: 'Supervisor', fr: 'Superviseur' },
  collector: { en: 'Collector', fr: 'Collecteur' },
};

export default function Navbar({ lang, setLang, dark, setDark, selectedWeek, setSelectedWeek, onToggleSidebar, sidebarOpen }) {
  const { user, logout, isOnline } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const now = new Date();
  const weekOptions = generateWeekOptions(now.getFullYear());
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  const role = user?.role || 'collector';
  const roleLabel = ROLE_LABELS[role]?.[lang] ?? role;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white text-xs text-center py-1 flex items-center justify-center gap-1.5">
          <WifiOff className="h-3 w-3" />
          {lang === 'fr' ? 'Hors ligne — connexion limitée' : 'Offline — limited connectivity'}
        </div>
      )}

      <header className={cn(
        "fixed left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center px-4 gap-3",
        !isOnline ? 'top-6' : 'top-0'
      )}>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Brand */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Syringe className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-base tracking-tight">VERHUS</span>
            <span className="text-xs text-muted-foreground ml-1.5">Cameroon</span>
          </div>
        </div>

        {/* Week selector */}
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-32 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Lang toggle */}
        <Button variant="ghost" size="sm" className="h-9 px-2 text-xs font-medium" onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}>
          {lang === 'en' ? 'FR' : 'EN'}
        </Button>

        {/* Dark toggle */}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDark(d => !d)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs font-medium leading-tight max-w-[100px] truncate">{user?.full_name}</span>
              <Badge className={cn('text-[9px] h-4 px-1.5 border font-medium mt-0.5', ROLE_STYLES[role])}>
                {roleLabel}
              </Badge>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
              {/* User info header */}
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <Badge className={cn('text-[9px] h-4 px-1.5 border font-medium mt-1.5', ROLE_STYLES[role])}>
                  {roleLabel}
                </Badge>
              </div>

              <button
                onClick={() => { setDropdownOpen(false); navigate('/Settings'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                {lang === 'fr' ? 'Paramètres' : 'Settings'}
              </button>

              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {lang === 'fr' ? 'Déconnexion' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
