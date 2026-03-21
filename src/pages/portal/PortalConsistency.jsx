import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sumDoses(entries, antigen) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + AGE_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

const PAIRS = [
  { key: 'p1_p3',   label: 'Penta1→3',    a: 'Penta1', b: 'Penta3' },
  { key: 'p1_mcv1', label: 'Penta1→MCV1', a: 'Penta1', b: 'MCV1' },
  { key: 'mcv1_mcv2',label:'MCV1→MCV2',   a: 'MCV1',   b: 'MCV2' },
  { key: 'opv1_opv3',label:'OPV1→OPV3',   a: 'OPV1',   b: 'OPV3' },
  { key: 'pcv1_pcv3',label:'PCV1→PCV3',   a: 'PCV1',   b: 'PCV3' },
];

function dropout(entries, a, b) {
  const dA = sumDoses(entries, a);
  const dB = sumDoses(entries, b);
  if (!dA) return null;
  return Math.round((dA - dB) / dA * 100);
}

function dropColor(pct) {
  if (pct === null) return 'text-muted-foreground';
  if (pct <= 10) return 'text-emerald-600 font-bold';
  if (pct <= 20) return 'text-amber-500 font-bold';
  return 'text-red-500 font-bold';
}

export default function PortalConsistency() {
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

  const columns = PAIRS.map(p => ({
    key: p.key, header: p.label,
    render: (rowEntries) => {
      const d = dropout(rowEntries, p.a, p.b);
      return <span className={`text-xs ${dropColor(d)}`}>{d !== null ? `${d}%` : '—'}</span>;
    },
  }));

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
        <h1 className="text-lg font-bold">{t('Cohérence / Consistance','Consistency / Coherence')}</h1>
        <p className="text-xs text-muted-foreground">{t('Taux d\'abandon entre antigènes liés','Dropout rate between linked antigens')}</p>
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        <span className="font-medium">{t('Abandon :','Dropout:')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-100 inline-block border border-emerald-200" /> ≤ 10%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 inline-block border border-amber-200" /> 11–20%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 inline-block border border-red-200" /> &gt; 20%</span>
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
