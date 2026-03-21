import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];
const ANTIGENS = ['Penta1','Penta3','MCV1','MCV2','BCG','OPV3','Yellow Fever'];
const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

function sumDoses(entries, antigen) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + AGE_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

function Sel({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="h-8 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function PortalPDVCurve() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;

  const [fRegion,  setFRegion]  = useState('');
  const [fAntigen, setFAntigen] = useState('Penta3');
  const [fYear,    setFYear]    = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

  const regions = useMemo(() => [...new Set(entries.map(e => e.region).filter(Boolean))].sort(), [entries]);
  const years   = useMemo(() => [...new Set(entries.map(e => String(e.year)).filter(Boolean))].sort().reverse(), [entries]);

  const filtered = useMemo(() => entries.filter(e => {
    if (fRegion && e.region !== fRegion) return false;
    if (fYear   && String(e.year) !== fYear) return false;
    return true;
  }), [entries, fRegion, fYear]);

  // Weekly doses
  const weeklyDoses = useMemo(() => WEEKS.map(w => ({
    week: w,
    doses: sumDoses(filtered.filter(e => e.week_number === w), fAntigen),
  })), [filtered, fAntigen]);

  // Cumulative
  const cumulativeData = useMemo(() => {
    let cum = 0;
    return weeklyDoses.map(({ week, doses }) => { cum += doses; return { week, doses, cumulative: cum }; });
  }, [weeklyDoses]);

  const maxCum = Math.max(...cumulativeData.map(d => d.cumulative), 1);
  const maxWeekly = Math.max(...cumulativeData.map(d => d.doses), 1);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Courbe PDV (Point de vaccination)','PDV Curve (Vaccination Point Curve)')}</h1>
        <p className="text-xs text-muted-foreground">{t('Doses hebdomadaires et cumulées par semaine','Weekly and cumulative doses by week')}</p>
      </div>

      <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border">
        <Sel label={t('Région','Region')}     value={fRegion}  onChange={setFRegion}  options={regions}  placeholder={t('Nationale','National')} />
        <Sel label={t('Antigène','Antigen')}  value={fAntigen} onChange={setFAntigen} options={ANTIGENS} placeholder="—" />
        <Sel label={t('Année','Year')}        value={fYear}    onChange={setFYear}    options={years}    placeholder={t('Toutes','All')} />
      </div>

      {isLoading ? (
        <div className="h-64 bg-muted animate-pulse rounded" />
      ) : (
        <div className="rounded-lg border overflow-auto shadow-sm p-4">
          {/* Simple SVG bar + line chart */}
          <svg viewBox="0 0 780 220" className="w-full" style={{ minWidth: 600 }}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(pct => (
              <line key={pct} x1="40" y1={200 - pct * 1.8} x2="780" y2={200 - pct * 1.8}
                stroke="#e5e7eb" strokeWidth="0.5" />
            ))}
            {/* Bars (weekly) */}
            {cumulativeData.map(({ week, doses }) => {
              const barH = (doses / maxWeekly) * 160;
              const x = 40 + (week - 1) * 14.2;
              return (
                <rect key={week} x={x} y={200 - barH} width={10} height={barH}
                  fill="#93c5fd" opacity={0.7} rx={1}>
                  <title>{t(`Sem. ${week}: ${doses.toLocaleString()} doses`, `Wk ${week}: ${doses.toLocaleString()} doses`)}</title>
                </rect>
              );
            })}
            {/* Cumulative line */}
            <polyline
              points={cumulativeData.map(({ week, cumulative }) =>
                `${40 + (week - 1) * 14.2 + 5},${200 - (cumulative / maxCum) * 180}`
              ).join(' ')}
              fill="none" stroke="#1a2744" strokeWidth="2" />
            {/* X axis labels (every 4 weeks) */}
            {cumulativeData.filter(d => d.week % 4 === 0).map(({ week }) => (
              <text key={week} x={40 + (week - 1) * 14.2 + 5} y={215} textAnchor="middle" fontSize="9" fill="#6b7280">
                {t(`S${week}`, `W${week}`)}
              </text>
            ))}
            {/* Y axis label */}
            <text x="8" y="110" textAnchor="middle" fontSize="9" fill="#6b7280" transform="rotate(-90,8,110)">
              {t('Doses','Doses')}
            </text>
          </svg>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-300 inline-block" /> {t('Hebdomadaire','Weekly')}</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-[#1a2744] inline-block" /> {t('Cumulé','Cumulative')}</span>
          </div>
        </div>
      )}

      {/* Data table */}
      <div className="rounded-lg border overflow-auto shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#1a2744] text-white">
              <th className="text-center px-3 py-2 border-r border-white/20">{t('Semaine','Week')}</th>
              <th className="text-right px-3 py-2 border-r border-white/20">{t('Doses hebdo.','Weekly Doses')}</th>
              <th className="text-right px-3 py-2">{t('Cumulé','Cumulative')}</th>
            </tr>
          </thead>
          <tbody>
            {cumulativeData.map(({ week, doses, cumulative }, i) => (
              <tr key={week} className={i % 2 === 0 ? 'bg-background border-b' : 'bg-muted/10 border-b'}>
                <td className="px-3 py-1.5 border-r text-center">{t(`S${week}`,`W${week}`)}</td>
                <td className="px-3 py-1.5 border-r text-right">{doses.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right">{cumulative.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
