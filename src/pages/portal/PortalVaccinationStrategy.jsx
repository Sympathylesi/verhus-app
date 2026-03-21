import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CollapsibleTable from './CollapsibleTable';
import { useCollapsible } from './useCollapsible';

const STRATEGIES = ['fixed','mobile','outreach','door_to_door'];
const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];
const ANTIGENS = ['Penta1','Penta3','MCV1','MCV2','BCG','OPV3'];

function sumByStrategy(entries, strategy) {
  return entries.reduce((s, e) => {
    const strat = e.sessions_by_strategy?.[strategy] || {};
    return s + ANTIGENS.reduce((a, ag) => {
      const d = strat[ag] || {};
      return a + AGE_KEYS.reduce((x, k) => x + (d[k] || 0), 0);
    }, 0);
  }, 0);
}

function totalDoses(entries) {
  return STRATEGIES.reduce((s, st) => s + sumByStrategy(entries, st), 0) ||
    entries.reduce((s, e) => {
      return s + ANTIGENS.reduce((a, ag) => {
        const d = e.vaccine_doses?.[ag] || {};
        return a + AGE_KEYS.reduce((x, k) => x + (d[k] || 0), 0);
      }, 0);
    }, 0);
}

export default function PortalVaccinationStrategy() {
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

  const stratLabels = {
    fixed:        { fr: 'Fixe',          en: 'Fixed' },
    mobile:       { fr: 'Mobile',        en: 'Mobile' },
    outreach:     { fr: 'Avancée',       en: 'Outreach' },
    door_to_door: { fr: 'Porte-à-porte', en: 'Door-to-Door' },
  };

  const columns = [
    ...STRATEGIES.map(st => ({
      key: st, header: stratLabels[st][lang] || stratLabels[st].en,
      render: (rowEntries) => {
        const doses = sumByStrategy(rowEntries, st);
        const tot = totalDoses(rowEntries);
        const pct = tot > 0 ? Math.round(doses / tot * 100) : 0;
        return (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-xs font-medium">{doses.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">{pct}%</span>
          </div>
        );
      },
    })),
    {
      key: 'total', header: t('Total','Total'),
      render: (rowEntries) => <span className="text-xs font-semibold">{totalDoses(rowEntries).toLocaleString()}</span>,
    },
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
        <h1 className="text-lg font-bold">{t('Stratégie de vaccination','Vaccination Strategy')}</h1>
        <p className="text-xs text-muted-foreground">{t('Doses administrées par stratégie de prestation','Doses administered by delivery strategy')}</p>
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
