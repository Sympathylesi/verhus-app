import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardEdit, TableProperties, FileBarChart, Map, Settings, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/Dashboard', icon: LayoutDashboard, label: { en: 'Dashboard', fr: 'Tableau de bord' } },
  { path: '/DataEntry', icon: ClipboardEdit, label: { en: 'Data Entry', fr: 'Saisie de données' } },
  { path: '/HealthAreas', icon: TableProperties, label: { en: 'Health Areas', fr: 'Aires de santé' } },
  { path: '/Reports', icon: FileBarChart, label: { en: 'Reports', fr: 'Rapports' } },
  { path: '/Analytics', icon: Map, label: { en: 'Analytics & Maps', fr: 'Analyses & Cartes' } },
  { path: '/OneTimeIndicators', icon: Bookmark, label: { en: 'One-Time Indicators', fr: 'Indicateurs ponctuels' } },
  { path: '/Settings', icon: Settings, label: { en: 'Settings', fr: 'Paramètres' } },
];

export default function Sidebar({ lang, open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed top-16 left-0 bottom-0 z-40 w-60 bg-card border-r border-border transition-transform duration-200 flex flex-col",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                {item.label[lang]}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}