import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { PeriodProvider, usePeriod } from '@/lib/PeriodContext';
import { History, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

// Historical routes that trigger historical mode automatically
const HISTORICAL_PATHS = ['/HistoryDB', '/AggregatedDashboard', '/MapsCoverage', '/ExportsMigration', '/MainDB', '/main-db', '/history'];
// Current-reporting routes (weekly entry — never show period selector)
const ENTRY_PATHS = ['/DataEntry'];

function LayoutInner({ lang, setLang }) {
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { appMode, setAppMode, selectedWeek, setSelectedWeek } = usePeriod();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Auto-switch mode based on route
  useEffect(() => {
    if (HISTORICAL_PATHS.some(p => location.pathname.startsWith(p))) {
      setAppMode('historical');
    } else if (ENTRY_PATHS.some(p => location.pathname.startsWith(p))) {
      setAppMode('current');
    }
  }, [location.pathname, setAppMode]);

  const isHistorical = appMode === 'historical';
  const isEntryPage = ENTRY_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        lang={lang} setLang={setLang}
        dark={dark} setDark={setDark}
        selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
        showPeriodSelector={!isEntryPage}
      />
      <Sidebar lang={lang} open={sidebarOpen} onClose={() => setSidebarOpen(false)} appMode={appMode} />
      <BottomNav lang={lang} />

      <main className="pt-16 pb-20 lg:pb-0 lg:pl-60 min-h-screen">
        {/* Mode banner */}
        {isHistorical ? (
          <div className="sticky top-16 z-30 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-medium">
            <History className="h-3.5 w-3.5 shrink-0" />
            {lang === 'fr' ? 'Mode historique — base de données principale' : 'Historical view — main database'}
            <button
              onClick={() => setAppMode('current')}
              className="ml-auto underline underline-offset-2 hover:no-underline"
            >
              {lang === 'fr' ? 'Retour au mode actif' : 'Switch to active reporting'}
            </button>
          </div>
        ) : (
          <div className="sticky top-16 z-30 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-medium">
            <Radio className="h-3.5 w-3.5 shrink-0 animate-pulse" />
            {lang === 'fr' ? 'Rapport actif — saisie hebdomadaire en cours' : 'Active reporting — current weekly entry'}
            <button
              onClick={() => setAppMode('historical')}
              className="ml-auto underline underline-offset-2 hover:no-underline"
            >
              {lang === 'fr' ? 'Voir l\'historique' : 'Browse history'}
            </button>
          </div>
        )}

        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet context={{ lang, selectedWeek, setSelectedWeek, appMode }} />
        </div>
      </main>
    </div>
  );
}

export default function AppLayout({ lang, setLang }) {
  return (
    <PeriodProvider>
      <LayoutInner lang={lang} setLang={setLang} />
    </PeriodProvider>
  );
}
