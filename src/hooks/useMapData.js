import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function weekKey(year, week) {
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function entryDateMs(e) {
  const jan4 = new Date(e.year, 0, 4);
  const dow = jan4.getDay() || 7;
  return new Date(jan4.getFullYear(), 0, 4 - dow + 1 + (e.week_number - 1) * 7).getTime();
}

function aggregateEntries(entries, groupKey, targets) {
  const map = {};
  entries.forEach(e => {
    const key = e[groupKey];
    if (!key) return;
    if (!map[key]) map[key] = { name: key, region: e.region || '', dtp3: 0, mcv2: 0, children: 0, doses: 0, screened: 0, sam: 0, sessions: 0 };
    const sc = e.screening || {};
    const vs = e.vaccination_sessions || {};
    map[key].dtp3     += (e.dtp3_count || 0);
    map[key].mcv2     += (e.mcv2_count || 0);
    map[key].children += (e.total_children_vaccinated || 0);
    map[key].doses    += (e.total_doses_administered || 0);
    map[key].screened += Object.values(sc).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);
    map[key].sam      += (sc.sam_male_0_11 || 0) + (sc.sam_female_0_11 || 0)
                       + (sc.sam_male_12_23 || 0) + (sc.sam_female_12_23 || 0);
    map[key].sessions += Object.values(vs).reduce((a, grp) =>
      a + (typeof grp === 'object' ? Object.values(grp).reduce((x, y) => x + y, 0) : 0), 0);
  });

  return Object.values(map).map(d => {
    const target = targets[d.name] || (groupKey === 'region' ? 3000 : 1000);
    return {
      ...d,
      dtp3Pct:     Math.min(100, Math.round(d.dtp3 / target * 100)),
      mcv2Pct:     Math.min(100, Math.round(d.mcv2 / target * 100)),
      screenedPct: Math.min(100, Math.round(d.screened / Math.max(d.children, 1) * 100)),
      samRate:     d.children > 0 ? Math.round(d.sam / d.children * 1000) / 10 : 0,
    };
  });
}

export function useMapData({ periodMode, selectedWeek, dateRange, animWeek }) {
  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
  });

  const allWeeks = useMemo(() => {
    const set = new Set();
    allEntries.forEach(e => set.add(weekKey(e.year, e.week_number)));
    return [...set].sort();
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    if (!allEntries.length) return [];
    if (animWeek) {
      const [yr, wk] = animWeek.split('-W');
      return allEntries.filter(e => e.year === parseInt(yr) && e.week_number === parseInt(wk));
    }
    if (periodMode === 'week' && selectedWeek) {
      const [yr, wk] = selectedWeek.split('-W');
      return allEntries.filter(e => e.year === parseInt(yr) && e.week_number === parseInt(wk));
    }
    if (periodMode === 'last4') {
      const cutoff = Date.now() - 28 * 86400000;
      return allEntries.filter(e => entryDateMs(e) >= cutoff);
    }
    if (periodMode === 'range' && dateRange?.from && dateRange?.to) {
      const from = new Date(dateRange.from).getTime();
      const to   = new Date(dateRange.to).getTime();
      return allEntries.filter(e => { const ms = entryDateMs(e); return ms >= from && ms <= to; });
    }
    return allEntries;
  }, [allEntries, periodMode, selectedWeek, dateRange, animWeek]);

  // Population targets per region and district
  const regionTargets = useMemo(() => {
    const map = {};
    healthAreas.forEach(ha => {
      if (!ha.region) return;
      map[ha.region] = (map[ha.region] || 0) + (ha.population0_11m || 0) + (ha.population12_23m || 0);
    });
    return map;
  }, [healthAreas]);

  const districtTargets = useMemo(() => {
    const map = {};
    healthAreas.forEach(ha => {
      if (!ha.district) return;
      map[ha.district] = (map[ha.district] || 0) + (ha.population0_11m || 0) + (ha.population12_23m || 0);
    });
    return map;
  }, [healthAreas]);

  // Region-level aggregation (for overview choropleth)
  const regionIndex = useMemo(() => {
    const arr = aggregateEntries(filteredEntries, 'region', regionTargets);
    const idx = {};
    arr.forEach(d => { idx[d.name] = d; });
    return idx;
  }, [filteredEntries, regionTargets]);

  // District-level aggregation (for drill-down choropleth)
  const districtIndex = useMemo(() => {
    const arr = aggregateEntries(filteredEntries, 'district', districtTargets);
    const idx = {};
    arr.forEach(d => { idx[d.name] = d; });
    return idx;
  }, [filteredEntries, districtTargets]);

  return { isLoading, regionIndex, districtIndex, allWeeks, filteredEntries };
}
