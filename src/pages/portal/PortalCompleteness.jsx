import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';
import { cn } from '@/lib/utils';

function pctCell(submitted, expected) {
  const pct = expected > 0 ? Math.round(submitted / expected * 100) : null;
  const color = pct === null ? '' : pct >= 80 ? 'text-emerald-600 font-bold' : pct >= 50 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold';
  return <span className={color}>{pct !== null ? `${pct}%` : '—'}</span>;
}

export default function PortalCompleteness() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;
  const { expandedRegions, expandedDistricts, toggleRegion, toggleDistrict } = useCollapsible();

  const { data: entries = [], isLoading: loadingE } = useQuery({ queryKey: ['entries_all'], queryFn: () => base44.entities.WeeklyEntry.list(), staleTime: 5*60*1000 });
  const { data: healthAreas = [], isLoading: loadingH } = useQuery({ queryKey: ['healthAreas'], queryFn: () => base44.entities.HealthArea.list(), staleTime: 10*60*1000 });

  // Expected = number of health areas × 52 weeks (or use distinct weeks in data)
  const weeksInData = useMemo(() => new Set(entries.map(e => `${e.year}-${e.week_number}`)).size || 1, [entries]);

  const hierarchy = useMemo(() => {
    const map = {};
    healthAreas.forEach(ha => {
      const r = ha.region || t('Inconnu','Unknown');
      const d = ha.district || t('Inconnu','Unknown');
      if (!map[r]) map[r] = {};
      if (!map[r][d]) map[r][d] = [];
      map[r][d].push(ha);
    });
    return map;
  }, [healthAreas, lang]);

  function getRowData(items) {
    const expected  = items.length * weeksInData;
    const submitted = entries.filter(e => items.some(ha => ha.name === e.health_area_name)).length;
    return { expected, submitted };
  }

  const footerData = { expected: healthAreas.length * weeksInData, submitted: entries.length };

  const columns = [
    { key: 'loc',       header: t('Localisation','Location'),   render: () => null },
    { key: 'expected',  header: t('Attendus','Expected'),        render: d => d.expected.toLocaleString() },
    { key: 'submitted', header: t('Reçus','Received'),           render: d => d.submitted.toLocaleString() },
    { key: 'pct',       header: t('Complétude','Completeness'),  render: d => pctCell(d.submitted, d.expected) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Complétude','Completeness')}</h1>
        <p className="text-xs text-muted-foreground">{t('Rapports reçus vs attendus par localisation','Reports received vs expected by location')}</p>
      </div>
      {loadingE || loadingH ? (
        <div className="space-y-2">{Array(8).fill(0).map((_,i)=><div key={i} className="h-10 bg-muted animate-pulse rounded"/>)}</div>
      ) : (
        <CollapsibleTable
          hierarchy={hierarchy} columns={columns} getRowData={getRowData}
          footerData={footerData} footerLabel={t('TOTAL NATIONAL','NATIONAL TOTAL')}
          expandedRegions={expandedRegions} expandedDistricts={expandedDistricts}
          toggleRegion={toggleRegion} toggleDistrict={toggleDistrict}
        />
      )}
    </div>
  );
}
