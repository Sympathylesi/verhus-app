import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardEdit, History, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { path: '/Dashboard', icon: LayoutDashboard, label: { en: 'Home', fr: 'Accueil' } },
  { path: '/DataEntry', icon: ClipboardEdit, label: { en: 'Entry', fr: 'Saisie' } },
  { path: '/HistoryDB', icon: History, label: { en: 'History', fr: 'Historique' } },
  { path: '/AggregatedDashboard', icon: BarChart3, label: { en: 'Stats', fr: 'Stats' } },
  { path: '/Settings', icon: Settings, label: { en: 'More', fr: 'Plus' } },
];

export default function BottomNav({ lang }) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t border-border flex items-center justify-around lg:hidden">
      {items.map(item => {
        const active = location.pathname === item.path;
        const isHistorical = ['/HistoryDB', '/AggregatedDashboard'].includes(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
              active
                ? isHistorical ? 'text-violet-600' : 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label[lang]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
