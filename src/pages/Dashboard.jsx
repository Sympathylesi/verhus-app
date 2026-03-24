import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardEdit, History, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

import KPICards from '../components/dashboard/KPICards';
import WeeklyTrendChart from '../components/dashboard/WeeklyTrendChart';
import AlertsBanner from '../components/dashboard/AlertsBanner';
import SessionsBreakdownChart from '../components/dashboard/SessionsBreakdownChart';
import StockOutAEFIChart from '../components/dashboard/StockOutAEFIChart';
import AgeSexCoverageChart from '../components/dashboard/AgeSexCoverageChart';
import HistoricalKPICards from '../components/dashboard/HistoricalKPICards';
import CoverageTrendChart from '../components/dashboard/CoverageTrendChart';
import ScreeningChart from '../components/dashboard/ScreeningChart';
import TopBottomAreas from '../components/dashboard/TopBottomAreas';
import DropoutRateChart from '../components/dashboard/DropoutRateChart';
import WeeklyKPIChart from '../components/dashboard/WeeklyKPIChart';
import HumanitarianChart from '../components/dashboard/HumanitarianChart';
import OtherAntigensChart from '../components/dashboard/OtherAntigensChart';
import { useHistoricalData } from '../hooks/useHistoricalData';

// ─── Period presets ───────────────────────────────────────────────────────────
const PRESETS = [
  { id: 'week',   label: { en: 'This week',    fr: 'Cette semaine' } },
  { id: 'last4',  label: { en: 'Last 4 weeks', fr: '4 dernières sem.' } },
  { id: 'range',  label: { en: 'Custom range', fr: 'Plage perso.' } },
  { id: 'all',    label: { en: 'All history',  fr: 'Tout l\'historique' } },
];

function SkeletonCard() {
  return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
}

export default function Dashboard() {
  const { lang, selectedWeek } = useOutletContext();
  const [year, weekStr] = selectedWeek.split('-W');
  const weekNum = parseInt(weekStr);

  // Dashboard mode
  const [mode, setMode] = useState('current'); // 'current' | 'historical'

  // Historical period controls
  const now = new Date();
  const [periodMode, setPeriodMode] = useState('last4');
  const [dateRange, setDateRange] = useState({
    from: `${now.getFullYear()}-01-01`,
    to: now.toISOString().slice(0, 10),
  });

  const t = (en, fr) => lang === 'fr' ? fr : en;

  // ── Current-week data ──────────────────────────────────────────────────────
  const { data: entries = [], isLoading: loadingCurrent } = useQuery({
    queryKey: ['entries', year],
    queryFn: () => base44.entities.WeeklyEntry.filter({ year: parseInt(year) }),
    enabled: mode === 'current',
  });

  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_read: false }),
  });

  const thisWeek = entries.filter(e => e.week_number === weekNum);
  const prevWeek = entries.filter(e => e.week_number === weekNum - 1);
  const sum = (arr, key) => arr.reduce((s, e) => s + (e[key] || 0), 0);
  const totalTarget = healthAreas.reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1;

  const vaccineSum = (arr, vac) => arr.reduce((s, e) => {
    const doses = e.vaccine_doses?.[vac] || {};
    return s + Object.values(doses).reduce((a, b) => a + (b || 0), 0);
  }, 0);

  const OTHER_ANTIGENS = ['BCG','OPV0','OPV1','OPV2','OPV3','IPV1','IPV2',
    'PCV1','PCV2','PCV3','Rota1','Rota2','Yellow Fever','Vitamin A','HPV'];

  const kpiData = {
    children:       sum(thisWeek, 'total_children_vaccinated'),
    children_prev:  sum(prevWeek, 'total_children_vaccinated'),
    penta1:         totalTarget > 0 ? Math.round(vaccineSum(thisWeek, 'Penta1') / totalTarget * 100) : 0,
    penta1_prev:    totalTarget > 0 ? Math.round(vaccineSum(prevWeek, 'Penta1') / totalTarget * 100) : 0,
    penta1_raw:     vaccineSum(thisWeek, 'Penta1'),
    penta3:         totalTarget > 0 ? Math.round(vaccineSum(thisWeek, 'Penta3') / totalTarget * 100) : 0,
    penta3_prev:    totalTarget > 0 ? Math.round(vaccineSum(prevWeek, 'Penta3') / totalTarget * 100) : 0,
    penta3_raw:     vaccineSum(thisWeek, 'Penta3'),
    mcv1:           totalTarget > 0 ? Math.round(vaccineSum(thisWeek, 'MCV1')   / totalTarget * 100) : 0,
    mcv1_prev:      totalTarget > 0 ? Math.round(vaccineSum(prevWeek, 'MCV1')   / totalTarget * 100) : 0,
    mcv1_raw:       vaccineSum(thisWeek, 'MCV1'),
    mcv2:           totalTarget > 0 ? Math.round(sum(thisWeek, 'mcv2_count')    / totalTarget * 100) : 0,
    mcv2_prev:      totalTarget > 0 ? Math.round(sum(prevWeek, 'mcv2_count')    / totalTarget * 100) : 0,
    mcv2_raw:       sum(thisWeek, 'mcv2_count'),
    otherAntigens:  thisWeek.reduce((s, e) => s + OTHER_ANTIGENS.reduce((a, v) => {
      const doses = e.vaccine_doses?.[v] || {};
      return a + Object.values(doses).reduce((x, y) => x + (y || 0), 0);
    }, 0), 0),
    otherAntigens_prev: prevWeek.reduce((s, e) => s + OTHER_ANTIGENS.reduce((a, v) => {
      const doses = e.vaccine_doses?.[v] || {};
      return a + Object.values(doses).reduce((x, y) => x + (y || 0), 0);
    }, 0), 0),
    doses:          sum(thisWeek, 'total_doses_administered'),
    doses_prev:     sum(prevWeek, 'total_doses_administered'),
  };

  // ── Historical data ────────────────────────────────────────────────────────
  const {
    isLoading: loadingHist,
    entries: histEntries,
    kpis,
    prevKpis,
    periodLabel,
    coverageTrend,
    malnutritionTrend,
    topBottomAreas,
    dropoutTrend,
  } = useHistoricalData({
    periodMode: mode === 'historical' ? periodMode : null,
    selectedWeek,
    dateRange,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('Dashboard', 'Tableau de bord')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mode === 'current'
              ? t(`Week ${weekNum}, ${year}`, `Semaine ${weekNum}, ${year}`)
              : periodLabel
                ? t(`History · ${periodLabel}`, `Historique · ${periodLabel}`)
                : t('Historical view', 'Vue historique')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
            <button
              onClick={() => setMode('current')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                mode === 'current'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Radio className="h-3.5 w-3.5" />
              {t('This week', 'Cette semaine')}
            </button>
            <button
              onClick={() => setMode('historical')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                mode === 'historical'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <History className="h-3.5 w-3.5" />
              {t('History', 'Historique')}
            </button>
          </div>

          {mode === 'current' && (
            <Link to="/DataEntry">
              <Button className="bg-primary hover:bg-primary/90 gap-2 h-9">
                <ClipboardEdit className="h-4 w-4" />
                <span className="hidden sm:inline">{t('New Weekly Entry', 'Nouvelle saisie')}</span>
                <span className="sm:hidden">{t('New Entry', 'Saisie')}</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Historical period controls */}
      {mode === 'historical' && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-lg border">
          <span className="text-xs font-medium text-muted-foreground mr-1">{t('Period:', 'Période :')}</span>
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodMode(p.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                periodMode === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border hover:bg-muted'
              )}
            >
              {p.label[lang]}
            </button>
          ))}
          {periodMode === 'range' && (
            <div className="flex items-center gap-1.5 ml-1">
              <Input
                type="date"
                value={dateRange.from}
                onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
                className="h-8 w-36 text-xs"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <Input
                type="date"
                value={dateRange.to}
                onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
                className="h-8 w-36 text-xs"
              />
            </div>
          )}
          {periodLabel && periodMode !== 'range' && (
            <span className="ml-auto text-xs text-muted-foreground italic">{periodLabel}</span>
          )}
        </div>
      )}

      {/* ── Current-week view ── */}
      {mode === 'current' && (
        <>
          <AlertsBanner alerts={alerts} lang={lang} />
          {loadingCurrent ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <KPICards lang={lang} data={kpiData} />
          )}
          <WeeklyTrendChart lang={lang} entries={entries} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SessionsBreakdownChart lang={lang} entries={thisWeek} />
            <StockOutAEFIChart      lang={lang} entries={thisWeek} />
            <AgeSexCoverageChart    lang={lang} entries={thisWeek} />
          </div>
          <HumanitarianChart lang={lang} entries={thisWeek} />
          <OtherAntigensChart lang={lang} entries={thisWeek} />
          <WeeklyKPIChart lang={lang} entries={entries} totalTarget={totalTarget} />
        </>
      )}

      {/* ── Historical view ── */}
      {mode === 'historical' && (
        <>
          <HistoricalKPICards lang={lang} kpis={kpis} prevKpis={prevKpis} loading={loadingHist} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loadingHist ? (
              <><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <CoverageTrendChart lang={lang} data={coverageTrend} loading={loadingHist} />
                <ScreeningChart lang={lang} data={malnutritionTrend} loading={loadingHist} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loadingHist ? (
              <><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <TopBottomAreas  lang={lang} data={topBottomAreas}    loading={loadingHist} />
                <DropoutRateChart lang={lang} data={dropoutTrend}      loading={loadingHist} />
              </>
            )}
          </div>

          <HumanitarianChart lang={lang} entries={histEntries} />
          <OtherAntigensChart lang={lang} entries={histEntries} />
          <WeeklyKPIChart lang={lang} entries={histEntries} totalTarget={totalTarget} />
        </>
      )}
    </div>
  );
}
