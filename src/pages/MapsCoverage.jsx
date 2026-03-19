import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { MapPin } from 'lucide-react';
import { usePeriod } from '@/lib/PeriodContext';
import CameroonMap from '@/components/dashboard/CameroonMap';

const COVERAGE_THRESHOLD = { good: 80, fair: 50 };

export default function MapsCoverage() {
  const { lang } = useOutletContext();
  const { periodMode, selectedWeek, dateRange } = usePeriod();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const { data: allEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['entries-all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
  });

  const entries = useMemo(() => {
    if (periodMode === 'week') {
      const [yr, wk] = selectedWeek.split('-W');
      return allEntries.filter(e => e.year === parseInt(yr) && e.week_number === parseInt(wk));
    }
    if (periodMode === 'range') {
      return allEntries.filter(e => {
        const d = new Date(e.year, 0, 1 + (e.week_number - 1) * 7);
        return d >= new Date(dateRange.from) && d <= new Date(dateRange.to);
      });
    }
    return allEntries;
  }, [allEntries, periodMode, selectedWeek, dateRange]);

  // Coverage trend over weeks
  const coverageTrend = useMemo(() => {
    const totalTarget = healthAreas.reduce((s, ha) =>
      s + (ha.population0_11m || 0) + (ha.population12_23m || 0) + (ha.population24_59m || 0), 0) || 1;

    const map = {};
    entries.forEach(e => {
      const key = `${e.year}-W${String(e.week_number).padStart(2, '0')}`;
      if (!map[key]) map[key] = { week: `W${e.week_number}`, dtp3: 0, mcv2: 0 };
      map[key].dtp3 += e.dtp3_count || 0;
      map[key].mcv2 += e.mcv2_count || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-24)
      .map(r => ({
        ...r,
        dtp3Pct: Math.round(r.dtp3 / totalTarget * 100),
        mcv2Pct: Math.round(r.mcv2 / totalTarget * 100),
      }));
  }, [entries, healthAreas]);

  // District radar (vaccine mix)
  const radarData = useMemo(() => {
    const vaccines = ['dtp3_count', 'mcv2_count', 'total_children_vaccinated', 'total_doses_administered'];
    const labels = ['DTP3', 'MCV2', t('Children', 'Enfants'), t('Doses', 'Doses')];
    const totals = vaccines.map(k => entries.reduce((s, e) => s + (e[k] || 0), 0));
    const max = Math.max(...totals, 1);
    return labels.map((label, i) => ({ label, value: Math.round(totals[i] / max * 100) }));
  }, [entries, lang]);

  // Coverage buckets
  const coverageBuckets = useMemo(() => {
    const districtMap = {};
    entries.forEach(e => {
      if (!e.district) return;
      if (!districtMap[e.district]) districtMap[e.district] = { children: 0 };
      districtMap[e.district].children += e.total_children_vaccinated || 0;
    });
    const vals = Object.values(districtMap).map(d => d.children);
    const max = Math.max(...vals, 1);
    let good = 0, fair = 0, low = 0;
    vals.forEach(v => {
      const pct = v / max * 100;
      if (pct >= COVERAGE_THRESHOLD.good) good++;
      else if (pct >= COVERAGE_THRESHOLD.fair) fair++;
      else low++;
    });
    return { good, fair, low, total: vals.length };
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-violet-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t('Maps & Coverage Trends', 'Cartes & Tendances de couverture')}</h1>
      </div>

      {/* Coverage summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: t('Good (≥80%)', 'Bon (≥80%)'), count: coverageBuckets.good, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
          { label: t('Fair (50–79%)', 'Moyen (50–79%)'), count: coverageBuckets.fair, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
          { label: t('Low (<50%)', 'Faible (<50%)'), count: coverageBuckets.low, color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
        ].map(b => (
          <div key={b.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${b.color}`}>
            <span className="text-base font-bold">{b.count}</span> {b.label}
          </div>
        ))}
      </div>

      <CameroonMap lang={lang} healthAreas={healthAreas} entries={entries} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('Coverage % Over Time', 'Couverture % dans le temps')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={coverageTrend}>
                  <defs>
                    <linearGradient id="dtp3Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mcv2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Area type="monotone" dataKey="dtp3Pct" stroke="#0EA5E9" fill="url(#dtp3Grad)" name="DTP3 %" />
                  <Area type="monotone" dataKey="mcv2Pct" stroke="#8B5CF6" fill="url(#mcv2Grad)" name="MCV2 %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('Vaccine Mix (relative)', 'Mix vaccinal (relatif)')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Coverage" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                  <Tooltip formatter={(v) => `${v}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
