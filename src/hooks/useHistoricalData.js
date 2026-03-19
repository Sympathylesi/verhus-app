import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function isoWeekToDate(year, week) {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

function entryDate(e) {
  return isoWeekToDate(e.year, e.week_number);
}

export function useHistoricalData({ periodMode, selectedWeek, dateRange }) {
  // Always fetch all entries (cached by react-query)
  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(periodMode),
  });

  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(periodMode),
  });

  const entries = useMemo(() => {
    if (!allEntries.length || !periodMode) return [];

    if (periodMode === 'all') return allEntries;

    if (periodMode === 'last4') {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 28);
      return allEntries.filter(e => entryDate(e) >= cutoff);
    }

    if (periodMode === 'week' && selectedWeek) {
      const [yr, wStr] = selectedWeek.split('-W');
      return allEntries.filter(e => e.year === parseInt(yr) && e.week_number === parseInt(wStr));
    }

    if (periodMode === 'range' && dateRange?.from && dateRange?.to) {
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      return allEntries.filter(e => {
        const d = entryDate(e);
        return d >= from && d <= to;
      });
    }

    return allEntries;
  }, [allEntries, periodMode, selectedWeek, dateRange]);

  const totalTarget = useMemo(
    () => healthAreas.reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1,
    [healthAreas]
  );

  const sum = (arr, key) => arr.reduce((s, e) => s + (e[key] || 0), 0);

  // Previous-period entries (for delta comparison)
  const prevEntries = useMemo(() => {
    if (!allEntries.length || !periodMode || periodMode === 'all') return [];
    if (periodMode === 'last4') {
      const now = new Date();
      const to = new Date(now); to.setDate(now.getDate() - 28);
      const from = new Date(to); from.setDate(to.getDate() - 28);
      return allEntries.filter(e => { const d = entryDate(e); return d >= from && d < to; });
    }
    if (periodMode === 'week' && selectedWeek) {
      const [yr, wStr] = selectedWeek.split('-W');
      const w = parseInt(wStr);
      return allEntries.filter(e => e.year === parseInt(yr) && e.week_number === w - 1);
    }
    if (periodMode === 'range' && dateRange?.from && dateRange?.to) {
      const from = new Date(dateRange.from);
      const to   = new Date(dateRange.to);
      const span = to - from;
      const prevTo   = new Date(from); prevTo.setDate(prevTo.getDate() - 1);
      const prevFrom = new Date(prevTo.getTime() - span);
      return allEntries.filter(e => { const d = entryDate(e); return d >= prevFrom && d <= prevTo; });
    }
    return [];
  }, [allEntries, periodMode, selectedWeek, dateRange]);

  // Human-readable period label
  const periodLabel = useMemo(() => {
    if (!entries.length) return '';
    const weeks = [...new Set(entries.map(e => `${e.year}-W${String(e.week_number).padStart(2, '0')}`))].sort();
    if (weeks.length === 1) return weeks[0];
    return `${weeks[0]} – ${weeks[weeks.length - 1]}`;
  }, [entries]);

  // Cumulative KPIs
  const prevKpis = useMemo(() => ({
    children: sum(prevEntries, 'total_children_vaccinated'),
    doses:    sum(prevEntries, 'total_doses_administered'),
    dtp3:     prevEntries.length ? Math.round(sum(prevEntries, 'dtp3_count') / totalTarget * 100) : 0,
    mcv2:     prevEntries.length ? Math.round(sum(prevEntries, 'mcv2_count') / totalTarget * 100) : 0,
    sam: prevEntries.reduce((s, e) => {
      const sc = e.screening || {};
      return s + (sc.sam_male_0_11 || 0) + (sc.sam_female_0_11 || 0) + (sc.sam_male_12_23 || 0) + (sc.sam_female_12_23 || 0);
    }, 0),
    humanitarian: prevEntries.reduce((s, e) => {
      const hi = e.humanitarian_items || {};
      return s + Object.values(hi).reduce((a, b) => a + (b || 0), 0);
    }, 0),
  }), [prevEntries, totalTarget]);

  const kpis = useMemo(() => ({
    children: sum(entries, 'total_children_vaccinated'),
    doses: sum(entries, 'total_doses_administered'),
    dtp3: entries.length ? Math.round(sum(entries, 'dtp3_count') / totalTarget * 100) : 0,
    mcv1: entries.length ? Math.round(
      entries.reduce((s, e) => {
        const doses = e.vaccine_doses?.MCV1 || {};
        return s + Object.values(doses).reduce((a, b) => a + b, 0);
      }, 0) / totalTarget * 100
    ) : 0,
    mcv2: entries.length ? Math.round(sum(entries, 'mcv2_count') / totalTarget * 100) : 0,
    sam: entries.reduce((s, e) => {
      const sc = e.screening || {};
      return s + (sc.sam_male_0_11 || 0) + (sc.sam_female_0_11 || 0) +
        (sc.sam_male_12_23 || 0) + (sc.sam_female_12_23 || 0);
    }, 0),
    mam: entries.reduce((s, e) => {
      const sc = e.screening || {};
      return s + (sc.mam_male_0_11 || 0) + (sc.mam_female_0_11 || 0) +
        (sc.mam_male_12_23 || 0) + (sc.mam_female_12_23 || 0);
    }, 0),
    sessions: entries.reduce((s, e) => {
      const vs = e.vaccination_sessions || {};
      return s + Object.values(vs).reduce((a, grp) =>
        a + (typeof grp === 'object' ? Object.values(grp).reduce((x, y) => x + y, 0) : 0), 0);
    }, 0),
    humanitarian: entries.reduce((s, e) => {
      const hi = e.humanitarian_items || {};
      return s + Object.values(hi).reduce((a, b) => a + (b || 0), 0);
    }, 0),
  }), [entries, totalTarget]);

  // Coverage trend — group by year-week
  const coverageTrend = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const key = `${e.year}-W${String(e.week_number).padStart(2, '0')}`;
      if (!map[key]) map[key] = { period: key, dtp3: 0, mcv1: 0, mcv2: 0, children: 0 };
      map[key].dtp3 += (e.dtp3_count || 0);
      map[key].mcv2 += (e.mcv2_count || 0);
      map[key].children += (e.total_children_vaccinated || 0);
      const mcv1doses = e.vaccine_doses?.MCV1 || {};
      map[key].mcv1 += Object.values(mcv1doses).reduce((a, b) => a + b, 0);
    });
    return Object.values(map)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(d => ({
        ...d,
        dtp3: totalTarget > 0 ? Math.round(d.dtp3 / totalTarget * 100) : 0,
        mcv1: totalTarget > 0 ? Math.round(d.mcv1 / totalTarget * 100) : 0,
        mcv2: totalTarget > 0 ? Math.round(d.mcv2 / totalTarget * 100) : 0,
      }));
  }, [entries, totalTarget]);

  // Malnutrition trend
  const malnutritionTrend = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const key = `${e.year}-W${String(e.week_number).padStart(2, '0')}`;
      if (!map[key]) map[key] = { period: key, sam: 0, mam: 0 };
      const sc = e.screening || {};
      map[key].sam += (sc.sam_male_0_11 || 0) + (sc.sam_female_0_11 || 0) +
        (sc.sam_male_12_23 || 0) + (sc.sam_female_12_23 || 0);
      map[key].mam += (sc.mam_male_0_11 || 0) + (sc.mam_female_0_11 || 0) +
        (sc.mam_male_12_23 || 0) + (sc.mam_female_12_23 || 0);
    });
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period));
  }, [entries]);

  // Top/bottom health areas by coverage
  const topBottomAreas = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const name = e.health_area_name || 'Unknown';
      if (!map[name]) map[name] = { name, children: 0, dtp3: 0, mam: 0 };
      map[name].children += (e.total_children_vaccinated || 0);
      map[name].dtp3 += (e.dtp3_count || 0);
      const sc = e.screening || {};
      map[name].mam += (sc.mam_male_0_11 || 0) + (sc.mam_female_0_11 || 0) +
        (sc.mam_male_12_23 || 0) + (sc.mam_female_12_23 || 0);
    });
    const sorted = Object.values(map).sort((a, b) => b.children - a.children);
    return {
      top5: sorted.slice(0, 5).map(d => ({ ...d, name: d.name.substring(0, 14) })),
      bottom5: sorted.slice(-5).reverse().map(d => ({ ...d, name: d.name.substring(0, 14) })),
    };
  }, [entries]);

  // Dropout rate trend — Penta1→Penta3, MCV1→MCV2
  const dropoutTrend = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const key = `${e.year}-W${String(e.week_number).padStart(2, '0')}`;
      if (!map[key]) map[key] = { period: key, penta1: 0, penta3: 0, mcv1: 0, mcv2: 0 };
      const doses = e.vaccine_doses || {};
      const sum = (vac) => Object.values(doses[vac] || {}).reduce((a, b) => a + (b || 0), 0);
      map[key].penta1 += sum('Penta1');
      map[key].penta3 += sum('Penta3');
      map[key].mcv1   += sum('MCV1');
      map[key].mcv2   += (e.mcv2_count || 0);
    });
    return Object.values(map)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(d => ({
        period: d.period,
        pentaDropout: d.penta1 > 0 ? Math.round((d.penta1 - d.penta3) / d.penta1 * 100) : null,
        mcvDropout:   d.mcv1  > 0 ? Math.round((d.mcv1  - d.mcv2)  / d.mcv1  * 100) : null,
      }))
      .filter(d => d.pentaDropout !== null || d.mcvDropout !== null);
  }, [entries]);

  // District heatmap — district × week DTP3 coverage
  const districtHeatmap = useMemo(() => {
    const map = {}; // map[district][period] = { dtp3, children }
    entries.forEach(e => {
      const district = e.district || 'Unknown';
      const period   = `${e.year}-W${String(e.week_number).padStart(2, '0')}`;
      if (!map[district]) map[district] = {};
      if (!map[district][period]) map[district][period] = { dtp3: 0, children: 0 };
      map[district][period].dtp3     += (e.dtp3_count || 0);
      map[district][period].children += (e.total_children_vaccinated || 0);
    });
    const districts = Object.keys(map).sort();
    const periods   = [...new Set(entries.map(e => `${e.year}-W${String(e.week_number).padStart(2, '0')}`))].sort();
    const cells = {};
    districts.forEach(d => {
      cells[d] = {};
      periods.forEach(p => {
        const cell = map[d]?.[p];
        cells[d][p] = cell && cell.children > 0
          ? Math.min(100, Math.round(cell.dtp3 / cell.children * 100))
          : null;
      });
    });
    return { districts, periods, cells };
  }, [entries]);

  // Humanitarian vs sessions trend
  const humanitarianTrend = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const key = `${e.year}-W${String(e.week_number).padStart(2, '0')}`;
      if (!map[key]) map[key] = { period: key, humanitarian: 0, sessions: 0 };
      const hi = e.humanitarian_items || {};
      map[key].humanitarian += Object.values(hi).reduce((a, b) => a + (b || 0), 0);
      const vs = e.vaccination_sessions || {};
      map[key].sessions += Object.values(vs).reduce((a, grp) =>
        a + (typeof grp === 'object' ? Object.values(grp).reduce((x, y) => x + y, 0) : 0), 0);
    });
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period));
  }, [entries]);

  return {
    isLoading,
    entries,
    kpis,
    prevKpis,
    periodLabel,
    coverageTrend,
    malnutritionTrend,
    topBottomAreas,
    dropoutTrend,
    districtHeatmap,
    humanitarianTrend,
    healthAreas,
  };
}
