import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const OTHER_ANTIGENS = [
  { key: 'BCG',               color: '#0ea5e9' },
  { key: 'OPV0',              color: '#06b6d4' },
  { key: 'OPV1',              color: '#0891b2' },
  { key: 'OPV2',              color: '#0e7490' },
  { key: 'OPV3',              color: '#155e75' },
  { key: 'IPV1',              color: '#6366f1' },
  { key: 'IPV2',              color: '#4f46e5' },
  { key: 'PCV-13 1',          color: '#10b981' },
  { key: 'PCV-13 2',          color: '#059669' },
  { key: 'PCV-13 3',          color: '#047857' },
  { key: 'Rota1',             color: '#f59e0b' },
  { key: 'Rota2',             color: '#d97706' },
  { key: 'Rota3',             color: '#b45309' },
  { key: 'Yellow Fever',      color: '#ef4444' },
  { key: 'Vitamin A',         color: '#f97316' },
  { key: 'IPTi oral',         color: '#a855f7' },
  { key: 'Mosquirix injectable', color: '#ec4899' },
  { key: 'Meningitis',        color: '#14b8a6' },
  { key: 'HepB-0',            color: '#84cc16' },
];

const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sumDoses(entries, antigen) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + AGE_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

export default function OtherAntigensChart({ lang, entries }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const [view, setView] = useState('chart'); // 'chart' | 'table'

  const data = OTHER_ANTIGENS.map(a => ({
    name: a.key,
    color: a.color,
    doses: sumDoses(entries || [], a.key),
  })).filter(d => d.doses > 0);

  const empty = data.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">
              {t('Other Antigens', 'Autres antigènes')}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t('Doses administered (excl. MCV & Penta/DTP)', 'Doses administrées (hors MCV & Penta/DTP)')}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            {['chart', 'table'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn('px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                  view === v ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {v === 'chart' ? t('Chart', 'Graphe') : t('Table', 'Tableau')}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            {t('No data for this period', 'Aucune donnée pour cette période')}
          </div>
        ) : view === 'chart' ? (
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Bar dataKey="doses" name={t('Doses', 'Doses')} radius={[3, 3, 0, 0]}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-auto max-h-56 rounded-md border">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-muted/80">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold border-b border-r">{t('Antigen', 'Antigène')}</th>
                  <th className="px-3 py-2 text-right font-semibold border-b">{t('Doses', 'Doses')}</th>
                </tr>
              </thead>
              <tbody>
                {data.sort((a, b) => b.doses - a.doses).map((row, i) => (
                  <tr key={row.name} className={cn('border-b last:border-b-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                    <td className="px-3 py-1.5 border-r flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: row.color }} />
                      {row.name}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium">{row.doses.toLocaleString()}</td>
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
