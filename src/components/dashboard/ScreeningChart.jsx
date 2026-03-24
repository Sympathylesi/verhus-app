import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

const SERIES = [
  { key: 'screened', label: { en: 'Children Screened', fr: 'Enfants dépistés' }, color: '#0ea5e9', grad: 'screenedGrad' },
  { key: 'sam',      label: { en: 'SAM',               fr: 'MAS' },              color: '#ef4444', grad: 'samGrad' },
  { key: 'mam',      label: { en: 'MAM',               fr: 'MAM' },              color: '#f59e0b', grad: 'mamGrad' },
];

export default function ScreeningChart({ lang, data, loading }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [activeSeries, setActiveSeries] = useState(new Set(['screened', 'sam', 'mam']));
  const [filterRegion,   setFilterRegion]   = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  // data is the malnutritionTrend array: [{ period, sam, mam, screened, region, district }]
  const regions   = useMemo(() => [...new Set((data || []).map(d => d.region).filter(Boolean))].sort(), [data]);
  const districts = useMemo(() => [...new Set((data || []).filter(d => !filterRegion || d.region === filterRegion).map(d => d.district).filter(Boolean))].sort(), [data, filterRegion]);

  const filtered = useMemo(() => (data || []).filter(d => {
    if (filterRegion   && d.region   !== filterRegion)   return false;
    if (filterDistrict && d.district !== filterDistrict) return false;
    return true;
  }), [data, filterRegion, filterDistrict]);

  // Re-aggregate by period after filtering
  const chartData = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.period]) map[d.period] = { period: d.period, screened: 0, sam: 0, mam: 0 };
      map[d.period].screened += (d.screened || 0);
      map[d.period].sam      += (d.sam || 0);
      map[d.period].mam      += (d.mam || 0);
    });
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period));
  }, [filtered]);

  function toggleSeries(key) {
    setActiveSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }

  const empty = !loading && chartData.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Nutrition Screening Over Time', 'Dépistage nutritionnel dans le temps')}
        </CardTitle>

        <div className="flex flex-wrap gap-2 mt-2">
          {/* Series toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {SERIES.map(s => (
              <button key={s.key} onClick={() => toggleSeries(s.key)}
                className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                  activeSeries.has(s.key) ? 'text-white border-transparent' : 'bg-background text-muted-foreground border-border'
                )}
                style={activeSeries.has(s.key) ? { backgroundColor: s.color, borderColor: s.color } : {}}>
                {s.label[lang]}
              </button>
            ))}
          </div>
          {/* Region / District filters */}
          {regions.length > 0 && (
            <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setFilterDistrict(''); }}
              className="h-7 rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">{t('All regions', 'Toutes régions')}</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          {districts.length > 0 && (
            <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}
              className="h-7 rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">{t('All districts', 'Tous districts')}</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="h-64 bg-muted animate-pulse rounded" />
        ) : empty ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            {t('No data for this period', 'Aucune donnée pour cette période')}
          </div>
        ) : (
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  {SERIES.map(s => (
                    <linearGradient key={s.grad} id={s.grad} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={s.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {SERIES.filter(s => activeSeries.has(s.key)).map(s => (
                  <Area key={s.key} type="monotone" dataKey={s.key}
                    stroke={s.color} fill={`url(#${s.grad})`} strokeWidth={2}
                    name={s.label[lang]} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        {!loading && chartData.length > 0 && (
          <div className="overflow-auto max-h-56 rounded-md border">
            <table className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/80">
                <tr>
                  {[t('Period','Période'), t('Screened','Dépistés'), 'SAM', 'MAM',
                    t('SAM Rate','Taux MAS'), t('MAM Rate','Taux MAM')].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold border-b border-r last:border-r-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => {
                  const samRate = row.screened > 0 ? Math.round(row.sam / row.screened * 100) : null;
                  const mamRate = row.screened > 0 ? Math.round(row.mam / row.screened * 100) : null;
                  return (
                    <tr key={row.period} className={cn('border-b last:border-b-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                      <td className="px-3 py-1.5 border-r font-medium">{row.period}</td>
                      <td className="px-3 py-1.5 border-r text-right">{row.screened.toLocaleString()}</td>
                      <td className="px-3 py-1.5 border-r text-right text-red-600 font-medium">{row.sam.toLocaleString()}</td>
                      <td className="px-3 py-1.5 border-r text-right text-amber-600 font-medium">{row.mam.toLocaleString()}</td>
                      <td className="px-3 py-1.5 border-r text-right">{samRate !== null ? `${samRate}%` : '—'}</td>
                      <td className="px-3 py-1.5 text-right">{mamRate !== null ? `${mamRate}%` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
