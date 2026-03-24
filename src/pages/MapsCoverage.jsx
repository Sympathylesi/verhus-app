import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMapData } from '@/hooks/useMapData';
import ChoroplethMap from '@/components/maps/ChoroplethMap';

const PRESETS = [
  { id: 'week',   label: { en: 'This week',    fr: 'Cette semaine' } },
  { id: 'last4',  label: { en: 'Last 4 weeks', fr: '4 dernières sem.' } },
  { id: 'range',  label: { en: 'Custom range', fr: 'Plage perso.' } },
  { id: 'all',    label: { en: 'All history',  fr: 'Tout l\'historique' } },
];

const COVERAGE_THRESHOLD = { good: 80, fair: 50 };

export default function MapsCoverage() {
  const { lang, selectedWeek } = useOutletContext();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  // Period controls (local — independent of global PeriodContext)
  const now = new Date();
  const [periodMode, setPeriodMode] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: `${now.getFullYear()}-01-01`,
    to: now.toISOString().slice(0, 10),
  });

  // Animation week (null = use periodMode)
  const [animWeek, setAnimWeek] = useState(null);

  // GeoJSON (fetched once, cached forever — static asset)
  const { data: geojson } = useQuery({
    queryKey: ['cameroon-districts-geojson'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}cameroon-districts.geojson`).then(r => r.json()),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { isLoading, regionIndex, districtIndex, allWeeks, filteredEntries } = useMapData({
    periodMode,
    selectedWeek,
    dateRange,
    animWeek,
  });

  // ── Trend charts data (uses filteredEntries from hook) ──────────────────────
  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
  });

  const totalTarget = healthAreas.reduce((s, ha) =>
    s + (ha.population0_11m || 0) + (ha.population12_23m || 0), 0) || 1;

  const coverageTrend = React.useMemo(() => {
    const map = {};
    filteredEntries.forEach(e => {
      const key = `${e.year}-W${String(e.week_number).padStart(2, '0')}`;
      if (!map[key]) map[key] = { week: `W${e.week_number}`, dtp1: 0, dtp3: 0, mcv1: 0, mcv2: 0 };
      const doses = e.vaccine_doses || {};
      const vsum = v => Object.values(doses[v]||{}).reduce((a,b)=>a+(b||0),0);
      map[key].dtp1 += vsum('Penta1');
      map[key].dtp3 += e.dtp3_count || 0;
      map[key].mcv1 += vsum('MCV1');
      map[key].mcv2 += e.mcv2_count || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-24)
      .map(r => ({
        ...r,
        dtp1Pct: Math.round(r.dtp1 / totalTarget * 100),
        dtp3Pct: Math.round(r.dtp3 / totalTarget * 100),
        mcv1Pct: Math.round(r.mcv1 / totalTarget * 100),
        mcv2Pct: Math.round(r.mcv2 / totalTarget * 100),
      }));
  }, [filteredEntries, totalTarget]);

  const radarData = React.useMemo(() => {
    const vaccines = ['dtp3_count', 'mcv2_count', 'total_children_vaccinated', 'total_doses_administered'];
    const labels = ['DTP3', 'MCV2', t('Children', 'Enfants'), t('Doses', 'Doses')];
    // add DTP1 and MCV1
    const dtp1 = filteredEntries.reduce((s,e) => {
      const d = e.vaccine_doses?.['Penta1'] || {};
      return s + Object.values(d).reduce((a,b)=>a+(b||0),0);
    }, 0);
    const mcv1 = filteredEntries.reduce((s,e) => {
      const d = e.vaccine_doses?.['MCV1'] || {};
      return s + Object.values(d).reduce((a,b)=>a+(b||0),0);
    }, 0);
    const totals = vaccines.map(k => filteredEntries.reduce((s, e) => s + (e[k] || 0), 0));
    const allVals = [...totals, dtp1, mcv1];
    const allLabels = [...labels, 'DTP1', 'MCV1'];
    const max = Math.max(...allVals, 1);
    return allLabels.map((label, i) => ({ label, value: Math.round(allVals[i] / max * 100) }));
  }, [filteredEntries, lang]);

  const coverageBuckets = React.useMemo(() => {
    const vals = Object.values(regionIndex).map(d => d.dtp3Pct);
    let good = 0, fair = 0, low = 0;
    vals.forEach(v => {
      if (v >= COVERAGE_THRESHOLD.good) good++;
      else if (v >= COVERAGE_THRESHOLD.fair) fair++;
      else low++;
    });
    return { good, fair, low, total: vals.length };
  }, [regionIndex]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-violet-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Maps & Geographic Trends', 'Cartes & Tendances géographiques')}
        </h1>
      </div>

      {/* Period controls */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-lg border">
        <span className="text-xs font-medium text-muted-foreground mr-1">{t('Period:', 'Période :')}</span>
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => { setPeriodMode(p.id); setAnimWeek(null); }}
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
      </div>

      {/* Coverage summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: t('Good (≥80%)', 'Bon (≥80%)'),   count: coverageBuckets.good, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
          { label: t('Fair (50–79%)', 'Moyen (50–79%)'), count: coverageBuckets.fair, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
          { label: t('Low (<50%)', 'Faible (<50%)'),  count: coverageBuckets.low,  color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
        ].map(b => (
          <div key={b.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${b.color}`}>
            <span className="text-base font-bold">{b.count}</span> {b.label}
          </div>
        ))}
        <div className="ml-auto text-xs text-muted-foreground self-center">
          {filteredEntries.length.toLocaleString()} {t('entries in period', 'entrées dans la période')}
        </div>
      </div>

      {/* Choropleth map */}
      <ChoroplethMap
        lang={lang}
        geojson={geojson}
        regionIndex={regionIndex}
        districtIndex={districtIndex}
        allWeeks={allWeeks}
        isLoading={isLoading}
      />

      {/* Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {t('Coverage % Over Time', 'Couverture % dans le temps')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={coverageTrend}>
                  <defs>
                    <linearGradient id="dtp1Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dtp3Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mcv1Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mcv2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Area type="monotone" dataKey="dtp1Pct" stroke="#10b981" fill="url(#dtp1Grad)" name="DTP1 %" />
                  <Area type="monotone" dataKey="dtp3Pct" stroke="#0EA5E9" fill="url(#dtp3Grad)" name="DTP3 %" />
                  <Area type="monotone" dataKey="mcv1Pct" stroke="#f59e0b" fill="url(#mcv1Grad)" name="MCV1 %" />
                  <Area type="monotone" dataKey="mcv2Pct" stroke="#8B5CF6" fill="url(#mcv2Grad)" name="MCV2 %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {t('Vaccine Mix (relative)', 'Mix vaccinal (relatif)')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name={t('Coverage', 'Couverture')} dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                  <Tooltip formatter={v => `${v}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
