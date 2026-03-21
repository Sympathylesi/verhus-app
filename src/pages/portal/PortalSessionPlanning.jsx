import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const SESSION_TYPES = ['mobile','outreach','fixed','door_to_door'];
const AGE_SEX_KEYS  = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sessSum(entries, type) {
  return entries.reduce((s, e) => {
    const g = e.vaccination_sessions?.[type] || {};
    return s + AGE_SEX_KEYS.reduce((a, k) => a + (g[k] || 0), 0);
  }, 0);
}

export default function PortalSessionPlanning() {
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
    SESSION_TYPES.forEach(st => { data[st] = sessSum(items, st); data.total += data[st]; });
    return data;
  }

  const footerData = getRowData(entries);

  const typeLabel = {
    mobile:       t('Mobile','Mobile'),
    outreach:     t('Avancée','Outreach'),
    fixed:        t('Fixe','Fixed'),
    door_to_door: t('Porte-à-porte','Door-to-Door'),
  };

  const columns = [
    { key: 'loc',   header: t('Localisation','Location'), render: () => null },
    { key: 'total', header: t('Total enfants','Total Children'), render: d => d.total.toLocaleString() },
    ...SESSION_TYPES.map(st => ({ key: st, header: typeLabel[st], render: d => (d[st]||0).toLocaleString() })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Planification des séances','Session Planning')}</h1>
        <p className="text-xs text-muted-foreground">{t('Enfants vaccinés par type de séance','Children vaccinated by session type')}</p>
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
