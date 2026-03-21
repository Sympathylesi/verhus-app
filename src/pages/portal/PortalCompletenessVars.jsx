import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

export default function PortalCompletenessVars() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;
  const { expandedRegions, expandedDistricts, toggleRegion, toggleDistrict } = useCollapsible();

  const { data: entries = [], isLoading } = useQuery({ queryKey: ['entries_all'], queryFn: () => base44.entities.WeeklyEntry.list(), staleTime: 5*60*1000 });

  const hierarchy = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const r = e.region || t('Inconnu','Unknown');
      const d = e.district || t('Inconnu','Unknown');
      if (!map[r]) map[r] = {};
      if (!map[r][d]) map[r][d] = [];
      map[r][d].push(e);
    });
    return map;
  }, [entries, lang]);

  function hasVar(e, key) {
    if (key === 'doses')        return !!e.vaccine_doses && Object.keys(e.vaccine_doses).length > 0;
    if (key === 'sessions')     return !!e.vaccination_sessions;
    if (key === 'screening')    return !!e.screening;
    if (key === 'humanitarian') return !!e.humanitarian_items;
    if (key === 'engagement')   return !!e.community_engagement;
    return false;
  }

  function pct(n, total) {
    const v = total > 0 ? Math.round(n / total * 100) : null;
    if (v === null) return '—';
    const color = v >= 80 ? 'text-emerald-600 font-bold' : v >= 50 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold';
    return <span className={color}>{v}%</span>;
  }

  const VARS = ['doses','sessions','screening','humanitarian','engagement'];

  function getRowData(items) {
    const n = items.length || 1;
    const data = { total: items.length };
    VARS.forEach(v => { data[v] = items.filter(e => hasVar(e, v)).length; });
    return data;
  }

  const footerData = getRowData(entries);

  const varLabel = { doses: t('Doses','Doses'), sessions: t('Séances','Sessions'), screening: t('Dépistage','Screening'), humanitarian: t('Humanitaire','Humanitarian'), engagement: t('Engagement','Engagement') };

  const columns = [
    { key: 'loc',   header: t('Localisation','Location'), render: () => null },
    { key: 'total', header: t('Rapports','Reports'), render: d => d.total.toLocaleString() },
    ...VARS.map(v => ({ key: v, header: varLabel[v], render: d => pct(d[v], d.total) })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Variables de complétude','Completeness Variables')}</h1>
        <p className="text-xs text-muted-foreground">{t('Taux de remplissage par variable de rapport','Fill rate per report variable')}</p>
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
