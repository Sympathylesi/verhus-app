import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCollapsible } from './useCollapsible';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ANTIGENS = ['Penta1','Penta3','MCV1','MCV2','BCG','OPV0','OPV3','IPV1','Yellow Fever'];
const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sumDoses(entries, antigen) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + AGE_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

export default function PortalAnnualComparison() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;
  const { expandedRegions, toggleRegion } = useCollapsible();
  const [antigen, setAntigen] = useState('Penta3');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

  const years = useMemo(() => [...new Set(entries.map(e => e.year).filter(Boolean))].sort().reverse(), [entries]);
  const [yearA, setYearA] = useState('');
  const [yearB, setYearB] = useState('');

  const yA = yearA || years[0];
  const yB = yearB || years[1];

  const byRegion = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const r = e.region || t('Inconnu','Unknown');
      if (!map[r]) map[r] = {};
      if (!map[r][e.year]) map[r][e.year] = [];
      map[r][e.year].push(e);
    });
    return map;
  }, [entries, lang]);

  const regions = useMemo(() => Object.keys(byRegion).sort(), [byRegion]);

  const totalA = useMemo(() => sumDoses(entries.filter(e => e.year === yA), antigen), [entries, yA, antigen]);
  const totalB = useMemo(() => sumDoses(entries.filter(e => e.year === yB), antigen), [entries, yB, antigen]);

  function diff(a, b) {
    if (!b) return null;
    return Math.round((a - b) / b * 100);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Comparaison annuelle','Annual Comparison')}</h1>
        <p className="text-xs text-muted-foreground">{t('Comparer les doses administrées entre deux années','Compare doses administered between two years')}</p>
      </div>

      <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border">
        {[['Antigène','Antigen', antigen, setAntigen, ANTIGENS],
          [t('Année A','Year A'), t('Année A','Year A'), yearA, setYearA, years],
          [t('Année B','Year B'), t('Année B','Year B'), yearB, setYearB, years],
        ].map(([labelFr, labelEn, val, setter, opts]) => (
          <div key={labelEn} className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t(labelFr, labelEn)}</label>
            <select value={val} onChange={e => setter(e.target.value)}
              className="h-8 min-w-[110px] rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">{opts[0]}</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-9 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <div className="rounded-lg border overflow-auto shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a2744] text-white">
                <th className="sticky left-0 z-10 bg-[#1a2744] w-8 border-r border-white/20" />
                <th className="sticky left-8 z-10 bg-[#1a2744] text-left px-3 py-3 font-semibold min-w-[180px] border-r border-white/20">{t('Région','Region')}</th>
                <th className="text-right px-3 py-3 font-semibold min-w-[90px] border-r border-white/20">{yA || '—'}</th>
                <th className="text-right px-3 py-3 font-semibold min-w-[90px] border-r border-white/20">{yB || '—'}</th>
                <th className="text-right px-3 py-3 font-semibold min-w-[80px] border-r border-white/20">{t('Évolution','Change')}</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region, ri) => {
                const dA = sumDoses(byRegion[region]?.[yA] || [], antigen);
                const dB = sumDoses(byRegion[region]?.[yB] || [], antigen);
                const d  = diff(dA, dB);
                const isOpen = expandedRegions.has(region);
                return (
                  <React.Fragment key={region}>
                    <tr className={cn('border-b cursor-pointer transition-colors', ri % 2 === 0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30')}
                      onClick={() => toggleRegion(region)}>
                      <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-2">
                        <span className={cn('inline-flex items-center justify-center h-5 w-5 rounded border font-bold',
                          isOpen ? 'bg-[#1a2744] border-[#1a2744] text-white' : 'border-[#1a2744] text-[#1a2744]')}>
                          {isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </span>
                      </td>
                      <td className="sticky left-8 z-10 bg-inherit px-3 py-2 border-r font-semibold text-[#1a2744] dark:text-blue-300">{region}</td>
                      <td className="px-3 py-2 border-r text-right">{dA.toLocaleString()}</td>
                      <td className="px-3 py-2 border-r text-right text-muted-foreground">{dB.toLocaleString()}</td>
                      <td className={cn('px-3 py-2 border-r text-right font-semibold', d === null ? '' : d >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {d === null ? '—' : `${d > 0 ? '+' : ''}${d}%`}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#1a2744]/30 bg-[#1a2744]/5 font-semibold">
                <td className="sticky left-0 z-10 bg-[#1a2744]/5 w-8 border-r" />
                <td className="sticky left-8 z-10 bg-[#1a2744]/5 px-3 py-2.5 border-r text-[#1a2744] dark:text-blue-300 uppercase tracking-wide text-[11px]">{t('TOTAL NATIONAL','NATIONAL TOTAL')}</td>
                <td className="px-3 py-2.5 border-r text-right">{totalA.toLocaleString()}</td>
                <td className="px-3 py-2.5 border-r text-right text-muted-foreground">{totalB.toLocaleString()}</td>
                <td className={cn('px-3 py-2.5 border-r text-right', diff(totalA, totalB) === null ? '' : diff(totalA, totalB) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {diff(totalA, totalB) === null ? '—' : `${diff(totalA, totalB) > 0 ? '+' : ''}${diff(totalA, totalB)}%`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
