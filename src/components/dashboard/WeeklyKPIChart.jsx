import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

const KPI_LINES = [
  { key: 'mcv1',  label: 'MCV1',  color: '#0ea5e9' },
  { key: 'mcv2',  label: 'MCV2',  color: '#8b5cf6' },
  { key: 'dtp1',  label: 'DTP1',  color: '#10b981' },
  { key: 'dtp3',  label: 'DTP3',  color: '#f59e0b' },
];

const Empty = ({ lang }) => (
  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
    {lang === 'fr' ? 'Aucune donnée pour cette période' : 'No data for this period'}
  </div>
);

function pctColor(pct) {
  if (pct === null || pct === undefined) return '';
  if (pct >= 80) return 'text-emerald-600 font-semibold';
  if (pct >= 50) return 'text-amber-500 font-semibold';
  return 'text-red-500 font-semibold';
}

export default function WeeklyKPIChart({ lang, entries, totalTarget = 1 }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [activeKPIs, setActiveKPIs] = useState(new Set(['mcv1', 'mcv2', 'dtp1', 'dtp3']));
  const [filterRegion,   setFilterRegion]   = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  const regions   = useMemo(() => [...new Set((entries || []).map(e => e.region).filter(Boolean))].sort(), [entries]);
  const districts = useMemo(() => [...new Set((entries || []).filter(e => !filterRegion || e.region === filterRegion).map(e => e.district).filter(Boolean))].sort(), [entries, filterRegion]);

  const filtered = useMemo(() => (entries || []).filter(e => {
    if (filterRegion   && e.region   !== filterRegion)   return false;
    if (filterDistrict && e.district !== filterDistrict) return false;
    return true;
  }), [entries, filterRegion, filterDistrict]);

  // Build per-week chart data
  const chartData = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const key = `W${e.week_number}`;
      if (!map[key]) map[key] = { week: key, weekNum: e.week_number, mcv1: 0, mcv2: 0, dtp1: 0, dtp3: 0, children: 0 };
      const doses = e.vaccine_doses || {};
      const vsum = (vac) => Object.values(doses[vac] || {}).reduce((a, b) => a + (b || 0), 0);
      map[key].mcv1     += vsum('MCV1');
      map[key].mcv2     += (e.mcv2_count || 0);
      map[key].dtp1     += vsum('Penta1');   // DTP1 = Penta1
      map[key].dtp3     += (e.dtp3_count || vsum('Penta3'));
      map[key].children += (e.total_children_vaccinated || 0);
    });
    const tgt = totalTarget || 1;
    return Object.values(map)
      .sort((a, b) => a.weekNum - b.weekNum)
      .map(d => ({
        week: d.week,
        mcv1: tgt > 0 ? Math.round(d.mcv1 / tgt * 100) : 0,
        mcv2: tgt > 0 ? Math.round(d.mcv2 / tgt * 100) : 0,
        dtp1: tgt > 0 ? Math.round(d.dtp1 / tgt * 100) : 0,
        dtp3: tgt > 0 ? Math.round(d.dtp3 / tgt * 100) : 0,
        _raw: d,
      }));
  }, [filtered, totalTarget]);

  // Table data: one row per district per week
  const tableData = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const key = `${e.district || '—'}::W${e.week_number}`;
      if (!map[key]) map[key] = { district: e.district || '—', region: e.region || '—', week: `W${e.week_number}`, weekNum: e.week_number, mcv1: 0, mcv2: 0, dtp1: 0, dtp3: 0 };
      const doses = e.vaccine_doses || {};
      const vsum = (vac) => Object.values(doses[vac] || {}).reduce((a, b) => a + (b || 0), 0);
      map[key].mcv1 += vsum('MCV1');
      map[key].mcv2 += (e.mcv2_count || 0);
      map[key].dtp1 += vsum('Penta1');
      map[key].dtp3 += (e.dtp3_count || vsum('Penta3'));
    });
    const tgt = totalTarget || 1;
    return Object.values(map)
      .sort((a, b) => a.weekNum - b.weekNum || a.district.localeCompare(b.district))
      .map(d => ({
        ...d,
        mcv1Pct: tgt > 0 ? Math.round(d.mcv1 / tgt * 100) : 0,
        mcv2Pct: tgt > 0 ? Math.round(d.mcv2 / tgt * 100) : 0,
        dtp1Pct: tgt > 0 ? Math.round(d.dtp1 / tgt * 100) : 0,
        dtp3Pct: tgt > 0 ? Math.round(d.dtp3 / tgt * 100) : 0,
      }));
  }, [filtered, totalTarget]);

  function toggleKPI(key) {
    setActiveKPIs(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Weekly KPI Performance', 'Performance KPI hebdomadaire')}
        </CardTitle>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* KPI toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {KPI_LINES.map(k => (
              <button key={k.key} onClick={() => toggleKPI(k.key)}
                className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                  activeKPIs.has(k.key)
                    ? 'text-white border-transparent'
                    : 'bg-background text-muted-foreground border-border'
                )}
                style={activeKPIs.has(k.key) ? { backgroundColor: k.color, borderColor: k.color } : {}}>
                {k.label}
              </button>
            ))}
          </div>
          {/* Region / District selects */}
          <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setFilterDistrict(''); }}
            className="h-7 rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">{t('All regions', 'Toutes régions')}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}
            className="h-7 rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">{t('All districts', 'Tous districts')}</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chart */}
        {chartData.length === 0 ? <Empty lang={lang} /> : (
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 'auto']} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {KPI_LINES.filter(k => activeKPIs.has(k.key)).map(k => (
                  <Line key={k.key} type="monotone" dataKey={k.key} stroke={k.color}
                    strokeWidth={2} dot={{ r: 3 }} name={k.label} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        {tableData.length > 0 && (
          <div className="overflow-auto max-h-64 rounded-md border">
            <table className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/80">
                <tr>
                  {[t('Week','Sem.'), t('Region','Région'), t('District','District'),
                    'MCV1 %', 'MCV2 %', 'DTP1 %', 'DTP3 %'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold border-b border-r last:border-r-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i} className={cn('border-b last:border-b-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                    <td className="px-3 py-1.5 border-r font-medium">{row.week}</td>
                    <td className="px-3 py-1.5 border-r text-muted-foreground">{row.region}</td>
                    <td className="px-3 py-1.5 border-r">{row.district}</td>
                    <td className={cn('px-3 py-1.5 border-r text-right', pctColor(row.mcv1Pct))}>{row.mcv1Pct}%</td>
                    <td className={cn('px-3 py-1.5 border-r text-right', pctColor(row.mcv2Pct))}>{row.mcv2Pct}%</td>
                    <td className={cn('px-3 py-1.5 border-r text-right', pctColor(row.dtp1Pct))}>{row.dtp1Pct}%</td>
                    <td className={cn('px-3 py-1.5 text-right', pctColor(row.dtp3Pct))}>{row.dtp3Pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
