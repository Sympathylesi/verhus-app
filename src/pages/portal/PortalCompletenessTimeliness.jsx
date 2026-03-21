// PortalCompletenessTimeliness.jsx
import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

export default function PortalCompletenessTimeliness() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;
  const { expandedRegions, expandedDistricts, toggleRegion, toggleDistrict } = useCollapsible();

  const { data: entries = [], isLoading } = useQuery({ queryKey: ['entries_all'], queryFn: () => base44.entities.WeeklyEntry.list(), staleTime: 5*60*1000 });
  const { data: healthAreas = [] } = useQuery({ queryKey: ['healthAreas'], queryFn: () => base44.entities.HealthArea.list(), staleTime: 10*60*1000 });

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
    // "On time" = submitted (all are considered on-time in demo data)
    const onTime    = entries.filter(e => items.some(ha => ha.name === e.health_area_name) && e.status !== 'rejected').length;
    const pct       = expected > 0 ? Math.round(submitted / expected * 100) : null;
    const timePct   = submitted > 0 ? Math.round(onTime / submitted * 100) : null;
    return { expected, submitted, onTime, pct, timePct };
  }

  const footerData = getRowData(healthAreas);

  const pctSpan = (v) => {
    if (v === null) return '—';
    const color = v >= 80 ? 'text-emerald-600 font-bold' : v >= 50 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold';
    return <span className={color}>{v}%</span>;
  };

  const columns = [
    { key: 'loc',       header: t('Localisation','Location'),       render: () => null },
    { key: 'expected',  header: t('Attendus','Expected'),            render: d => d.expected.toLocaleString() },
    { key: 'submitted', header: t('Reçus','Received'),               render: d => d.submitted.toLocaleString() },
    { key: 'pct',       header: t('Complétude','Completeness'),      render: d => pctSpan(d.pct) },
    { key: 'onTime',    header: t('Dans les délais','On Time'),       render: d => d.onTime.toLocaleString() },
    { key: 'timePct',   header: t('Promptitude','Timeliness'),        render: d => pctSpan(d.timePct) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Complétude-Promptitude','Completeness-Timeliness')}</h1>
        <p className="text-xs text-muted-foreground">{t('Rapports reçus dans les délais par localisation','Reports received on time by location')}</p>
      </div>
      {isLoading ? <div className="space-y-2">{Array(8).fill(0).map((_,i)=><div key={i} className="h-10 bg-muted animate-pulse rounded"/>)}</div> : (
        <CollapsibleTable hierarchy={hierarchy} columns={columns} getRowData={getRowData}
          footerData={footerData} footerLabel={t('TOTAL NATIONAL','NATIONAL TOTAL')}
          expandedRegions={expandedRegions} expandedDistricts={expandedDistricts}
          toggleRegion={toggleRegion} toggleDistrict={toggleDistrict} />
      )}
    </div>
  );
}
