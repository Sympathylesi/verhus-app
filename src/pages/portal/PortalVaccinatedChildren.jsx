import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const AGE_GROUPS = [
  { key: '0_11m',   labelFr: '0-11 mois',  labelEn: '0-11 months' },
  { key: '12_23m',  labelFr: '12-23 mois', labelEn: '12-23 months' },
  { key: '24_59m',  labelFr: '24-59 mois', labelEn: '24-59 months' },
];

function ageSum(entries, ageKey) {
  return entries.reduce((s, e) => {
    const total = Object.values(e.vaccine_doses || {}).reduce((a, vac) => {
      return a + (vac[`${ageKey}_male`] || 0) + (vac[`${ageKey}_female`] || 0);
    }, 0);
    return s + total;
  }, 0);
}

export default function PortalVaccinatedChildren() {
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
    const data = { total: items.reduce((s,e)=>s+(e.total_children_vaccinated||0),0) };
    AGE_GROUPS.forEach(ag => { data[ag.key] = ageSum(items, ag.key); });
    return data;
  }

  const footerData = getRowData(entries);

  const columns = [
    { key: 'loc',   header: t('Localisation','Location'), render: () => null },
    { key: 'total', header: t('Total enfants','Total Children'), render: d => d.total.toLocaleString() },
    ...AGE_GROUPS.map(ag => ({
      key: ag.key,
      header: lang === 'en' ? ag.labelEn : ag.labelFr,
      render: d => (d[ag.key]||0).toLocaleString(),
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Enfants vaccinés','Vaccinated Children')}</h1>
        <p className="text-xs text-muted-foreground">{t('Enfants vaccinés par groupe d\'âge','Children vaccinated by age group')}</p>
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
