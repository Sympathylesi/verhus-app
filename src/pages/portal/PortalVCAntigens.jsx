import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const ANTIGENS = ['BCG','OPV0','OPV1','OPV2','OPV3','IPV1','IPV2','Penta1','Penta2','Penta3','PCV1','PCV2','PCV3','Rota1','Rota2','MCV1','MCV2','Yellow Fever','Vitamin A','HPV'];
const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sumDoses(entries, antigen) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + AGE_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

export default function PortalVCAntigens() {
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

  const columns = ANTIGENS.map(a => ({
    key: a, header: a,
    render: (rowEntries, target) => {
      const doses = sumDoses(rowEntries, a);
      const pct = target > 0 ? Math.round(doses / target * 100) : null;
      const color = pct === null ? 'text-muted-foreground' : pct >= 80 ? 'text-emerald-600 font-bold' : pct >= 50 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold';
      return (
        <div className="flex flex-col items-center leading-tight">
          <span className={`text-xs ${color}`}>{pct !== null ? `${pct}%` : '—'}</span>
          <span className="text-[10px] text-muted-foreground">{doses.toLocaleString()}</span>
        </div>
      );
    },
  }));

  const getRowData = (type, key) => ({
    entries: type === 'region'
      ? Object.values(hierarchy[key] || {}).flatMap(d => Object.values(d).flat())
      : type === 'district'
        ? Object.values(Object.values(hierarchy).find(r => r[key]) || {})[0]
          ? Object.values(Object.values(hierarchy).find(r => r[key])[key]).flat()
          : []
        : entries.filter(e => e.health_area_name === key),
    target: type === 'region' ? targetFor(key, 'region') : type === 'district' ? targetFor(key, 'district') : (healthAreas.find(h => h.name === key)?.target_population || 1),
  });

  const footerData = { entries, target: totalTarget };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Couverture vaccinale par antigène','VC-Antigens / Vaccination Coverage by Antigen')}</h1>
        <p className="text-xs text-muted-foreground">{t('Doses administrées et couverture % par antigène','Doses administered and coverage % by antigen')}</p>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-9 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <CollapsibleTable
          hierarchy={hierarchy}
          columns={columns}
          getRowData={getRowData}
          footerData={footerData}
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
