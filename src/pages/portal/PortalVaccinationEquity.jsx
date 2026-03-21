import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const ANTIGENS = ['Penta1','Penta3','MCV1','MCV2','BCG','OPV3'];
const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sumDoses(entries, antigen) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + AGE_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

function equityColor(range) {
  if (range === null) return 'text-muted-foreground';
  if (range <= 20) return 'text-emerald-600 font-bold';
  if (range <= 40) return 'text-amber-500 font-bold';
  return 'text-red-500 font-bold';
}

export default function PortalVaccinationEquity() {
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

  // For equity: compute coverage % per HA within a region, then range = max - min
  function equityStats(regionKey, antigen) {
    const region = hierarchy[regionKey] || {};
    const pcts = [];
    Object.entries(region).forEach(([, districts]) => {
      Object.entries(districts).forEach(([haName, haEntries]) => {
        const ha = healthAreas.find(h => h.name === haName);
        const tgt = (ha?.target_population || ha?.population0_11m || 0) || 1;
        pcts.push(Math.round(sumDoses(haEntries, antigen) / tgt * 100));
      });
    });
    if (!pcts.length) return { min: null, max: null, range: null };
    return { min: Math.min(...pcts), max: Math.max(...pcts), range: Math.max(...pcts) - Math.min(...pcts) };
  }

  const columns = ANTIGENS.map(a => ({
    key: a, header: a,
    render: (rowEntries, target, rowKey, rowType) => {
      if (rowType === 'region') {
        const { min, max, range } = equityStats(rowKey, a);
        return (
          <div className="flex flex-col items-center leading-tight">
            <span className={`text-xs ${equityColor(range)}`}>{range !== null ? `Δ${range}%` : '—'}</span>
            <span className="text-[10px] text-muted-foreground">{min !== null ? `${min}–${max}%` : ''}</span>
          </div>
        );
      }
      const doses = sumDoses(rowEntries, a);
      const pct = target > 0 ? Math.round(doses / target * 100) : null;
      return <span className="text-xs">{pct !== null ? `${pct}%` : '—'}</span>;
    },
  }));

  const getRowData = (type, key, parentKey) => ({
    entries: type === 'region'
      ? Object.values(hierarchy[key] || {}).flatMap(d => Object.values(d).flat())
      : type === 'district'
        ? Object.values(hierarchy[parentKey]?.[key] || {}).flat()
        : entries.filter(e => e.health_area_name === key),
    target: type === 'region' ? targetFor(key, 'region') : type === 'district' ? targetFor(key, 'district') : (healthAreas.find(h => h.name === key)?.target_population || 1),
    rowKey: key, rowType: type,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Équité vaccinale','Vaccination Equity')}</h1>
        <p className="text-xs text-muted-foreground">{t('Écart de couverture entre aires de santé (Δ = max − min)','Coverage gap across health areas (Δ = max − min)')}</p>
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        <span className="font-medium">{t('Écart :','Gap:')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-100 inline-block border border-emerald-200" /> ≤ 20%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 inline-block border border-amber-200" /> 21–40%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 inline-block border border-red-200" /> &gt; 40%</span>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-9 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <CollapsibleTable
          hierarchy={hierarchy}
          columns={columns}
          getRowData={getRowData}
          footerData={{ entries, target: totalTarget, rowKey: 'national', rowType: 'national' }}
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
