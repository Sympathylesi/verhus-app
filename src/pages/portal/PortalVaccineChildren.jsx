import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const ANTIGENS = ['BCG','OPV0','Penta1','Penta3','MCV1','MCV2','Yellow Fever'];
const AGE_GROUPS = {
  '0_11m':  ['0_11m_male','0_11m_female'],
  '12_23m': ['12_23m_male','12_23m_female'],
  '24_59m': ['24_59m_male','24_59m_female'],
};

function sumDoses(entries, antigen) {
  const keys = Object.values(AGE_GROUPS).flat();
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + keys.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

function sumAgeGroup(entries, group) {
  const keys = AGE_GROUPS[group];
  return entries.reduce((s, e) => {
    return s + ANTIGENS.reduce((a, ag) => {
      const d = e.vaccine_doses?.[ag] || {};
      return a + keys.reduce((x, k) => x + (d[k] || 0), 0);
    }, 0);
  }, 0);
}

export default function PortalVaccineChildren() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;
  const { expandedRegions, expandedDistricts, toggleRegion, toggleDistrict } = useCollapsible();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
  });

  const hierarchy = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const r = e.region || t('Inconnu','Unknown');
      const d = e.district || t('Inconnu','Unknown');
      const ha = e.health_area_name || t('Inconnu','Unknown');
      if (!map[r]) map[r] = {};
      if (!map[r][d]) map[r][d] = {};
      if (!map[r][d][ha]) map[r][d][ha] = [];
      map[r][d][ha].push(e);
    });
    return map;
  }, [entries, lang]);

  const totalTarget = useMemo(() => healthAreas.reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1, [healthAreas]);

  function targetFor(key, type) {
    return healthAreas.filter(ha => ha[type] === key).reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1;
  }

  const columns = [
    ...ANTIGENS.map(a => ({
      key: a, header: a,
      render: (rowEntries) => <span className="text-xs">{sumDoses(rowEntries, a).toLocaleString()}</span>,
    })),
    { key: 'g0_11',  header: t('0-11m','0-11m'),   render: (r) => <span className="text-xs">{sumAgeGroup(r,'0_11m').toLocaleString()}</span> },
    { key: 'g12_23', header: t('12-23m','12-23m'), render: (r) => <span className="text-xs">{sumAgeGroup(r,'12_23m').toLocaleString()}</span> },
    { key: 'g24_59', header: t('24-59m','24-59m'), render: (r) => <span className="text-xs">{sumAgeGroup(r,'24_59m').toLocaleString()}</span> },
  ];

  const getRowData = (type, key, parentKey) => ({
    entries: type === 'region'
      ? Object.values(hierarchy[key] || {}).flatMap(d => Object.values(d).flat())
      : type === 'district'
        ? Object.values(hierarchy[parentKey]?.[key] || {}).flat()
        : entries.filter(e => e.health_area_name === key),
    target: type === 'region' ? targetFor(key, 'region') : type === 'district' ? targetFor(key, 'district') : (healthAreas.find(h => h.name === key)?.target_population || 1),
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Vaccin et enfants','Vaccine and Children')}</h1>
        <p className="text-xs text-muted-foreground">{t('Doses par vaccin et enfants vaccinés par groupe d\'âge','Doses per vaccine and vaccinated children by age group')}</p>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-9 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <CollapsibleTable
          hierarchy={hierarchy}
          columns={columns}
          getRowData={getRowData}
          footerData={{ entries, target: totalTarget }}
          footerLabel={t('TOTAL NATIONAL','NATIONAL TOTAL')}
          expandedRegions={expandedRegions}
          expandedDistricts={expandedDistricts}
          toggleRegion={toggleRegion}
          toggleDistrict={toggleDistrict}
          lang={lang}
        />
      )}
    </div>
  );
}
