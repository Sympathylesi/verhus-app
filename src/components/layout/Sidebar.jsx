import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardEdit, TableProperties,
  Settings, History, BarChart3, MapPin, FileDown, Table2, Book
} from 'lucide-react';
import { cn } from '@/lib/utils';

const currentItems = [
  { path: '/Dashboard', icon: LayoutDashboard, label: { en: 'Dashboard', fr: 'Tableau de bord' } },
  { path: '/DataEntry', icon: ClipboardEdit, label: { en: 'Live Weekly Entry', fr: 'Saisie hebdomadaire' } },
  { path: '/HealthAreas', icon: TableProperties, label: { en: 'Health Areas', fr: 'Aires de santé' } },
];

const historicalItems = [
  { path: '/MainDB', icon: Table2, label: { en: 'Main Database', fr: 'Base principale' } },
  { path: '/MapsCoverage', icon: MapPin, label: { en: 'Maps & Coverage', fr: 'Cartes & Couverture' } },
  { path: '/ExportsMigration', icon: FileDown, label: { en: 'Exports & Migration', fr: 'Exports & Migration' } },
];

function NavGroup({ title, items, lang, location, onClose, accent }) {
  return (
    <div className="mb-2">
      <p className={cn('px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest', accent)}>
        {title}
      </p>
      {items.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon style={{ width: 18, height: 18 }} className="shrink-0" />
            {item.label[lang]}
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar({ lang, open, onClose, navTop = 0 }) {
  const location = useLocation();
  const sidebarTop = navTop + 64; // navbar height is always h-16 = 64px

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}
      <aside
        style={{ top: sidebarTop }}
        className={cn(
          'fixed left-0 bottom-0 z-40 w-60 bg-card border-r border-border transition-transform duration-200 flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
        <nav className="flex-1 py-3 px-3 space-y-0 overflow-y-auto">
          <NavGroup
            title={lang === 'fr' ? 'Rapport actif' : 'Active Reporting'}
            items={currentItems}
            lang={lang}
            location={location}
            onClose={onClose}
            accent="text-emerald-600 dark:text-emerald-400"
          />

          <div className="my-2 border-t border-border" />

          <NavGroup
            title={lang === 'fr' ? 'Historique & Analyse' : 'History & Analysis'}
            items={historicalItems}
            lang={lang}
            location={location}
            onClose={onClose}
            accent="text-violet-600 dark:text-violet-400"
          />

          <div className="my-2 border-t border-border" />

          <Link
            to="/UserManual"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname === '/UserManual'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Book style={{ width: 18, height: 18 }} className="shrink-0" />
            {lang === 'fr' ? 'Manuel d\'utilisation' : 'User Manual'}
          </Link>

          <Link
            to="/Settings"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname === '/Settings'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings style={{ width: 18, height: 18 }} className="shrink-0" />
            {lang === 'fr' ? 'Paramètres' : 'Settings'}
          </Link>
        </nav>
      </aside>
    </>
  );
}
