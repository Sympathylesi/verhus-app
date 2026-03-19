import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { BarChart3, Users, Syringe, TrendingUp } from 'lucide-react';
import { usePeriod } from '@/lib/PeriodContext';

function KPI({ icon: Icon, label, value, color }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AggregatedDashboard() {
  const { lang } = useOutletContext();
  const { periodMode, selectedWeek, dateRange } = usePeriod();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['entries-all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
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

  const sum = (key) => entries.reduce((s, e) => s + (e[key] || 0), 0);

  // Weekly trend (last 20 weeks of filtered data)
  const weeklyTrend = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const key = `${e.year}-W${String(e.week_number).padStart(2, '0')}`;
      if (!map[key]) map[key] = { week: `W${e.week_number}`, children: 0, doses: 0 };
      map[key].children += e.total_children_vaccinated || 0;
      map[key].doses += e.total_doses_administered || 0;
    });
    return Object.values(map).sort((a, b) => a.week.localeCompare(b.week)).slice(-20);
  }, [entries]);

  // District breakdown (top 10)
  const districtData = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      if (!e.district) return;
      if (!map[e.district]) map[e.district] = { name: e.district.substring(0, 15), children: 0, dtp3: 0 };
      map[e.district].children += e.total_children_vaccinated || 0;
      map[e.district].dtp3 += e.dtp3_count || 0;
    });
    return Object.values(map).sort((a, b) => b.children - a.children).slice(0, 10);
  }, [entries]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('Aggregated Dashboard', 'Tableau de bord agrégé')}</h1>
          <p className="text-xs text-muted-foreground">{entries.length.toLocaleString()} {t('records in view', 'enregistrements affichés')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Users} label={t('Children Vaccinated', 'Enfants vaccinés')} value={sum('total_children_vaccinated').toLocaleString()} color="bg-sky-50 dark:bg-sky-950/30 text-sky-500" />
        <KPI icon={Syringe} label={t('Total Doses', 'Doses totales')} value={sum('total_doses_administered').toLocaleString()} color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" />
        <KPI icon={TrendingUp} label="DTP3" value={sum('dtp3_count').toLocaleString()} color="bg-amber-50 dark:bg-amber-950/30 text-amber-500" />
        <KPI icon={TrendingUp} label="MCV2" value={sum('mcv2_count').toLocaleString()} color="bg-violet-50 dark:bg-violet-950/30 text-violet-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('Weekly Trend', 'Tendance hebdomadaire')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="children" stroke="#0EA5E9" dot={false} name={t('Children', 'Enfants')} />
                  <Line type="monotone" dataKey="doses" stroke="#10B981" dot={false} name="Doses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('Top Districts by Coverage', 'Top districts par couverture')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={districtData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="children" fill="#8B5CF6" radius={[0, 4, 4, 0]} name={t('Children', 'Enfants')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
