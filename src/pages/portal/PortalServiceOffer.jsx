import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const STRATEGIES = ['Fixed','Mobile','Outreach','Door-to-Door'];

export default function PortalServiceOffer() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;
  const { expandedRegions, expandedDistricts, toggleRegion, toggleDistrict } = useCollapsible();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

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

  function getRowData(items) {
    const data = { total: items.length };
    STRATEGIES.forEach(s => { data[s] = items.filter(e => e.strategy === s).length; });
    return data;
  }

  const footerData = getRowData(entries);

  const columns = [
    { key: 'loc',   header: t('Localisation','Location'), render: () => null },
    { key: 'total', header: t('Total séances','Total Sessions'), render: d => d.total.toLocaleString() },
    ...STRATEGIES.map(s => ({ key: s, header: s, render: d => (d[s] || 0).toLocaleString() })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Offre de service','Service Offer')}</h1>
        <p className="text-xs text-muted-foreground">{t('Séances de vaccination par stratégie','Vaccination sessions by strategy')}</p>
      </div>
      {isLoading ? (
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
