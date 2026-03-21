import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const ENG_GROUPS = ['religious','community','traditional'];

export default function PortalCommunication() {
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

  function getRowData(items) {
    const data = { total: 0 };
    ENG_GROUPS.forEach(g => {
      data[g] = items.reduce((s, e) => s + (e.community_engagement?.[g]?.count || 0), 0);
      data.total += data[g];
    });
    return data;
  }

  const footerData = getRowData(entries);

  const groupLabel = {
    religious:   t('Religieux','Religious'),
    community:   t('Communautaire','Community'),
    traditional: t('Traditionnel','Traditional'),
  };

  const columns = [
    { key: 'loc',   header: t('Localisation','Location'), render: () => null },
    { key: 'total', header: t('Total leaders','Total Leaders'), render: d => d.total.toLocaleString() },
    ...ENG_GROUPS.map(g => ({ key: g, header: groupLabel[g], render: d => (d[g]||0).toLocaleString() })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Communication','Communication')}</h1>
        <p className="text-xs text-muted-foreground">{t('Engagement communautaire par type de leader','Community engagement by leader type')}</p>
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
