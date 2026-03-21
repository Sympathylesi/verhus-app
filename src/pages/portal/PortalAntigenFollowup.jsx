import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const ANTIGENS = ['BCG','OPV0','OPV1','OPV2','OPV3','IPV1','IPV2','Penta1','Penta2','Penta3','PCV1','PCV2','PCV3','Rota1','Rota2','MCV1','MCV2','Yellow Fever','Vitamin A','HPV'];
const AGE_SEX_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sumDoses(entries, antigen) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + AGE_SEX_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

export default function PortalAntigenFollowup() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;
  const [fAntigen, setFAntigen] = useState('Penta3');
  const { expandedRegions, expandedDistricts, toggleRegion, toggleDistrict } = useCollapsible();

  const { data: entries = [], isLoading: le } = useQuery({ queryKey: ['entries_all'], queryFn: () => base44.entities.WeeklyEntry.list(), staleTime: 5*60*1000 });
  const { data: healthAreas = [], isLoading: lh } = useQuery({ queryKey: ['healthAreas'], queryFn: () => base44.entities.HealthArea.list(), staleTime: 10*60*1000 });

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

  function targetFor(items) {
    const names = new Set(items.map(e => e.health_area_name));
    return healthAreas.filter(ha => names.has(ha.name)).reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1;
  }

  function getRowData(items) {
    const doses  = sumDoses(items, fAntigen);
    const target = targetFor(items);
    const pct    = Math.round(doses / target * 100);
    return { doses, target, pct };
  }

  const footerData = getRowData(entries);

  const pctSpan = (v) => {
    const color = v >= 80 ? 'text-emerald-600 font-bold' : v >= 50 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold';
    return <span className={color}>{v}%</span>;
  };

  const columns = [
    { key: 'loc',    header: t('Localisation','Location'), render: () => null },
    { key: 'target', header: t('Cible','Target'),          render: d => d.target.toLocaleString() },
    { key: 'doses',  header: t('Doses','Doses'),           render: d => d.doses.toLocaleString() },
    { key: 'pct',    header: t('Couverture','Coverage'),   render: d => pctSpan(d.pct) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Suivi des antigènes','Antigen Follow-up')}</h1>
        <p className="text-xs text-muted-foreground">{t('Doses administrées et couverture par antigène','Doses administered and coverage by antigen')}</p>
      </div>
      <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('Antigène','Antigen')}</label>
          <select value={fAntigen} onChange={e => setFAntigen(e.target.value)}
            className="h-8 min-w-[140px] rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
            {ANTIGENS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
      {le || lh ? <div className="space-y-2">{Array(8).fill(0).map((_,i)=><div key={i} className="h-10 bg-muted animate-pulse rounded"/>)}</div> : (
        <CollapsibleTable hierarchy={hierarchy} columns={columns} getRowData={getRowData}
          footerData={footerData} footerLabel={t('TOTAL NATIONAL','NATIONAL TOTAL')}
          expandedRegions={expandedRegions} expandedDistricts={expandedDistricts}
          toggleRegion={toggleRegion} toggleDistrict={toggleDistrict} />
      )}
    </div>
  );
}
