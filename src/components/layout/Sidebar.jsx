import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardEdit, TableProperties,
  Settings, MapPin, FileDown, Table2, Book, TableCellsMerge,
  Syringe, FileText, Database, Map, ChevronDown, ChevronRight,
  Home, Target, Activity, CheckSquare, AlertCircle, Clock,
  BarChart2, List, FlaskConical, Radio, CalendarDays, Users, ShieldCheck,
  TrendingUp, Scale, GitCompare, Layers, Microscope, Baby, SearchCode, LineChart, MapPin as PinIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const currentItems = [
  { path: '/Dashboard',  icon: LayoutDashboard, label: { en: 'Dashboard',         fr: 'Tableau de bord' } },
  { path: '/DataEntry',  icon: ClipboardEdit,   label: { en: 'Live Weekly Entry',  fr: 'Saisie hebdomadaire' } },
  { path: '/HealthAreas',icon: TableProperties, label: { en: 'Health Areas',       fr: 'Aires de santé' } },
];

const historicalItems = [
  { path: '/MainDB',           icon: Table2,          label: { en: 'Main Database',       fr: 'Base principale' } },
  { path: '/CoverageTable',    icon: TableCellsMerge, label: { en: 'Coverage Table',      fr: 'Tableau couverture' } },
  { path: '/MapsCoverage',     icon: MapPin,          label: { en: 'Maps & Coverage',     fr: 'Cartes & Couverture' } },
  { path: '/ExportsMigration', icon: FileDown,        label: { en: 'Exports & Migration', fr: 'Exports & Migration' } },
];

const portalItems = [
  { path: '/Portal/home',                icon: Home,         label: { en: 'Home / Welcome',          fr: 'Accueil / Bienvenue' } },
  { path: '/Portal/targets',             icon: Target,       label: { en: 'Targets',                 fr: 'Cibles' } },
  { path: '/Portal/service-offer',       icon: Activity,     label: { en: 'Service Offer',           fr: 'Offre de service' } },
  { path: '/Portal/completeness',        icon: CheckSquare,  label: { en: 'Completeness',            fr: 'Complétude' } },
  { path: '/Portal/missing-reports',     icon: AlertCircle,  label: { en: 'Missing Reports',         fr: 'Rapports manquants' } },
  { path: '/Portal/completeness-timeliness', icon: Clock,    label: { en: 'Completeness-Timeliness', fr: 'Complétude-Promptitude' } },
  { path: '/Portal/service-offer-ecdf',  icon: BarChart2,    label: { en: 'Service Offer-ECDF',      fr: 'Offre de service-ECDF' } },
  { path: '/Portal/completeness-vars',   icon: List,         label: { en: 'Completeness Variables',  fr: 'Variables de complétude' } },
  { path: '/Portal/antigen-followup',    icon: FlaskConical, label: { en: 'Antigen Follow-up',       fr: 'Suivi des antigènes' } },
  { path: '/Portal/communication',       icon: Radio,        label: { en: 'Communication',           fr: 'Communication' } },
  { path: '/Portal/session-planning',    icon: CalendarDays, label: { en: 'Session Planning',        fr: 'Planification des séances' } },
  { path: '/Portal/vaccinated-children', icon: Users,        label: { en: 'Vaccinated Children',     fr: 'Enfants vaccinés' } },
  { path: '/Portal/coverage',            icon: ShieldCheck,  label: { en: 'Vaccination Coverage',    fr: 'Couverture vaccinale' } },
  { path: '/Portal/vc-antigens',          icon: Microscope,   label: { en: 'VC-Antigens',              fr: 'CV-Antigènes' } },
  { path: '/Portal/annual-comparison',    icon: TrendingUp,   label: { en: 'Annual Comparison',        fr: 'Comparaison annuelle' } },
  { path: '/Portal/equity',               icon: Scale,        label: { en: 'Vaccination Equity',       fr: 'Équité vaccinale' } },
  { path: '/Portal/consistency',          icon: GitCompare,   label: { en: 'Consistency / Coherence',  fr: 'Cohérence / Consistance' } },
  { path: '/Portal/consistency-ou',       icon: Layers,       label: { en: 'Consistency by Oper. Unit',fr: 'Cohérence par unité opér.' } },
  { path: '/Portal/vaccination-strategy', icon: Activity,     label: { en: 'Vaccination Strategy',     fr: 'Stratégie de vaccination' } },
  { path: '/Portal/vaccine-children',     icon: Baby,         label: { en: 'Vaccine and Children',     fr: 'Vaccin et enfants' } },
  { path: '/Portal/monitoring-lookup',    icon: SearchCode,   label: { en: 'Monitoring Lookup',        fr: 'Recherche de suivi' } },
  { path: '/Portal/pdv-curve',            icon: LineChart,    label: { en: 'PDV Curve',                fr: 'Courbe PDV' } },
  { path: '/Portal/pdv-search',           icon: PinIcon,      label: { en: 'PDV Search',               fr: 'Recherche PDV' } },
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
  const location  = useLocation();
  const sidebarTop = navTop + 64;

  // Auto-open portal group if currently on a portal sub-page
  const isOnPortal = location.pathname.startsWith('/Portal');
  const [portalOpen, setPortalOpen] = useState(isOnPortal);

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

          {/* ── Vaccination Portal collapsible group ── */}
          <div className="mb-2">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {lang === 'fr' ? 'Portail de vaccination' : 'Vaccination Portal'}
            </p>

            {/* Parent toggle button */}
            <button
              onClick={() => setPortalOpen(o => !o)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isOnPortal
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Syringe style={{ width: 18, height: 18 }} className="shrink-0" />
              <span className="flex-1 text-left">
                {lang === 'fr' ? 'Portail' : 'Portal'}
              </span>
              {portalOpen
                ? <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                : <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </button>

            {/* Sub-items */}
            {portalOpen && (
              <div className="mt-0.5 ml-3 pl-3 border-l-2 border-blue-200 dark:border-blue-800 space-y-0.5">
                {portalItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors',
                        active
                          ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon style={{ width: 14, height: 14 }} className="shrink-0" />
                      {item.label[lang]}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

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
            {lang === 'fr' ? "Manuel d'utilisation" : 'User Manual'}
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
