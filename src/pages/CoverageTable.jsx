import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────
const ANTIGENS = [
  'BCG', 'OPV0', 'OPV1', 'OPV2', 'OPV3',
  'IPV1', 'IPV2', 'Penta1', 'Penta2', 'Penta3',
  'PCV1', 'PCV2', 'PCV3', 'Rota1', 'Rota2',
  'MCV1', 'MCV2', 'Yellow Fever', 'Vitamin A', 'HPV',
];
const AGE_SEX_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sumDoses(entry, antigen) {
  const d = entry.vaccine_doses?.[antigen] || {};
  return AGE_SEX_KEYS.reduce((s, k) => s + (d[k] || 0), 0);
}

function coverageColor(pct) {
  if (pct === null) return 'text-muted-foreground';
  if (pct >= 80) return 'text-emerald-600 font-semibold';
  if (pct >= 50) return 'text-amber-500 font-semibold';
  return 'text-red-500 font-semibold';
}

function coverageBg(pct) {
  if (pct === null) return '';
  if (pct >= 80) return 'bg-emerald-50 dark:bg-emerald-950/20';
  if (pct >= 50) return 'bg-amber-50 dark:bg-amber-950/20';
  return 'bg-red-50 dark:bg-red-950/20';
}

const CHART_ANTIGENS = [
  { key: 'Penta1', color: '#0ea5e9' },
  { key: 'Penta3', color: '#10b981' },
  { key: 'MCV1',   color: '#8b5cf6' },
  { key: 'MCV2',   color: '#f59e0b' },
];

// ─── Coverage trend chart ─────────────────────────────────────────────────────
function CoverageTrendChart({ filtered, totalTarget, lang }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const data = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const key = `${e.year}-W${String(e.week_number).padStart(2,'0')}`;
      if (!map[key]) map[key] = { week: `W${e.week_number}`, Penta1:0, Penta3:0, MCV1:0, MCV2:0 };
      const doses = e.vaccine_doses || {};
      const vsum = v => Object.values(doses[v]||{}).reduce((a,b)=>a+(b||0),0);
      map[key].Penta1 += vsum('Penta1');
      map[key].Penta3 += vsum('Penta3');
      map[key].MCV1   += vsum('MCV1');
      map[key].MCV2   += (e.mcv2_count || vsum('MCV2 (MR2)'));
    });
    const tgt = totalTarget || 1;
    return Object.values(map)
      .sort((a,b) => a.week.localeCompare(b.week))
      .map(d => ({ ...d, Penta1: Math.round(d.Penta1/tgt*100), Penta3: Math.round(d.Penta3/tgt*100), MCV1: Math.round(d.MCV1/tgt*100), MCV2: Math.round(d.MCV2/tgt*100) }));
  }, [filtered, totalTarget]);

  if (!data.length) return null;
  return (
    <div className="rounded-lg border p-4 bg-card">
      <p className="text-sm font-semibold mb-3">{t('Coverage Trend (filtered)', 'Tendance couverture (filtrée)')}</p>
      <div className="h-52 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0,'auto']} />
            <Tooltip formatter={v => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {CHART_ANTIGENS.map(a => (
              <Line key={a.key} type="monotone" dataKey={a.key} stroke={a.color} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Select component ─────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CoverageTable() {
  const { lang } = useOutletContext();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filterRegion,   setFilterRegion]   = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterYear,     setFilterYear]     = useState('');
  const [filterWeekFrom, setFilterWeekFrom] = useState('');
  const [filterWeekTo,   setFilterWeekTo]   = useState('');
  const [filterAntigen,  setFilterAntigen]  = useState('');

  // ── Drilldown state: null = region level, string = drilled into that region/district ──
  const [drillRegion,   setDrillRegion]   = useState(null); // region name
  const [drillDistrict, setDrillDistrict] = useState(null); // district name

  const level = drillDistrict ? 'healtharea' : drillRegion ? 'district' : 'region';

  // ── Data ───────────────────────────────────────────────────────────────────
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

  // ── Filter options ─────────────────────────────────────────────────────────
  const regions   = useMemo(() => [...new Set(entries.map(e => e.region).filter(Boolean))].sort(), [entries]);
  const districts = useMemo(() => {
    const base = filterRegion ? entries.filter(e => e.region === filterRegion) : entries;
    return [...new Set(base.map(e => e.district).filter(Boolean))].sort();
  }, [entries, filterRegion]);
  const years = useMemo(() => [...new Set(entries.map(e => String(e.year)).filter(Boolean))].sort().reverse(), [entries]);
  const weeks = useMemo(() => Array.from({ length: 52 }, (_, i) => String(i + 1)), []);

  // ── Apply filters ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => entries.filter(e => {
    if (filterRegion   && e.region   !== filterRegion)   return false;
    if (filterDistrict && e.district !== filterDistrict) return false;
    if (filterYear     && String(e.year) !== filterYear) return false;
    if (filterWeekFrom && e.week_number < Number(filterWeekFrom)) return false;
    if (filterWeekTo   && e.week_number > Number(filterWeekTo))   return false;
    return true;
  }), [entries, filterRegion, filterDistrict, filterYear, filterWeekFrom, filterWeekTo]);

  // ── Total target population ────────────────────────────────────────────────
  const totalTarget = useMemo(() => {
    const relevant = healthAreas.filter(ha => {
      if (filterRegion   && ha.region   !== filterRegion)   return false;
      if (filterDistrict && ha.district !== filterDistrict) return false;
      return true;
    });
    return relevant.reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1;
  }, [healthAreas, filterRegion, filterDistrict]);

  // ── Group entries by the current drill level ───────────────────────────────
  const groupedData = useMemo(() => {
    let scope = filtered;
    if (level === 'district')  scope = filtered.filter(e => e.region   === drillRegion);
    if (level === 'healtharea') scope = filtered.filter(e => e.district === drillDistrict);

    const groupKey = level === 'region' ? 'region' : level === 'district' ? 'district' : 'health_area_name';

    const map = {};
    scope.forEach(e => {
      const key = e[groupKey] || 'Unknown';
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [filtered, level, drillRegion, drillDistrict]);

  const groupKeys = useMemo(() => Object.keys(groupedData).sort(), [groupedData]);

  // ── Antigens to display ────────────────────────────────────────────────────
  const displayAntigens = filterAntigen ? [filterAntigen] : ANTIGENS;

  // ── Compute coverage for a set of entries + a target ──────────────────────
  function computeRow(entriesArr, target, antigen) {
    const vaccinated = entriesArr.reduce((s, e) => s + sumDoses(e, antigen), 0);
    const pct = target > 0 ? Math.round(vaccinated / target * 100) : null;
    return { vaccinated, target, pct };
  }

  // ── Target per group ──────────────────────────────────────────────────────
  function targetForGroup(groupName) {
    if (level === 'region') {
      return healthAreas
        .filter(ha => ha.region === groupName && (!filterDistrict || ha.district === filterDistrict))
        .reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1;
    }
    if (level === 'district') {
      return healthAreas
        .filter(ha => ha.district === groupName)
        .reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1;
    }
    // health area level
    const ha = healthAreas.find(h => h.name === groupName);
    return (ha?.target_population || ha?.population0_11m || 0) || 1;
  }

  // ── Breadcrumb ─────────────────────────────────────────────────────────────
  function resetDrill() { setDrillRegion(null); setDrillDistrict(null); }
  function drillUp()    { setDrillDistrict(null); }

  const levelLabel = level === 'region' ? t('Region', 'Région')
    : level === 'district' ? t('District', 'District')
    : t('Health Area', 'Aire de santé');

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t('Coverage Table', 'Tableau de couverture')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Antigen coverage by region, district and health area', 'Couverture par antigène, région, district et aire de santé')}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border">
        <FilterSelect label={t('Region','Région')}   value={filterRegion}   onChange={v => { setFilterRegion(v); setFilterDistrict(''); resetDrill(); }} options={regions}   placeholder={t('All regions','Toutes')} />
        <FilterSelect label={t('District','District')} value={filterDistrict} onChange={v => { setFilterDistrict(v); resetDrill(); }} options={districts} placeholder={t('All districts','Tous')} />
        <FilterSelect label={t('Year','Année')}       value={filterYear}     onChange={setFilterYear}     options={years}   placeholder={t('All years','Toutes')} />
        <FilterSelect label={t('Week from','Sem. de')} value={filterWeekFrom} onChange={setFilterWeekFrom} options={weeks}   placeholder="—" />
        <FilterSelect label={t('Week to','Sem. à')}   value={filterWeekTo}   onChange={setFilterWeekTo}   options={weeks}   placeholder="—" />
        <FilterSelect label={t('Antigen','Antigène')} value={filterAntigen}  onChange={setFilterAntigen}  options={ANTIGENS} placeholder={t('All antigens','Tous')} />
        <button
          onClick={() => { setFilterRegion(''); setFilterDistrict(''); setFilterYear(''); setFilterWeekFrom(''); setFilterWeekTo(''); setFilterAntigen(''); resetDrill(); }}
          className="self-end h-8 px-3 rounded-md border text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5"
        >
          <RotateCcw className="h-3 w-3" /> {t('Reset','Réinitialiser')}
        </button>
      </div>

      {/* ── Trend chart (reacts to filters) ── */}
      <CoverageTrendChart filtered={filtered} totalTarget={totalTarget} lang={lang} />

      {/* ── Breadcrumb / drill nav ── */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          onClick={resetDrill}
          className={cn('hover:underline', !drillRegion ? 'font-semibold text-foreground' : 'text-muted-foreground')}
        >
          {t('All Regions', 'Toutes les régions')}
        </button>
        {drillRegion && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <button
              onClick={drillUp}
              className={cn('hover:underline', !drillDistrict ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            >
              {drillRegion}
            </button>
          </>
        )}
        {drillDistrict && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-semibold text-foreground">{drillDistrict}</span>
          </>
        )}
        <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[10px] font-medium">
          {levelLabel}
        </span>
        {level !== 'healtharea' && (
          <span className="text-muted-foreground ml-1">
            — {t('click a row to drill down', 'cliquez une ligne pour descendre')}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b">
                <th className="sticky left-0 z-10 bg-muted/80 text-left px-3 py-2.5 font-semibold min-w-[140px] border-r">
                  {t('Antigen', 'Antigène')}
                </th>
                {/* Overall totals column */}
                <th className="text-center px-2 py-2.5 font-semibold border-r min-w-[90px] bg-violet-50 dark:bg-violet-950/20">
                  {t('Overall', 'Global')}
                </th>
                {/* Per-group columns */}
                {groupKeys.map(gk => (
                  <th
                    key={gk}
                    className={cn(
                      'text-center px-2 py-2.5 font-semibold min-w-[110px] border-r',
                      level !== 'healtharea' ? 'cursor-pointer hover:bg-primary/10' : ''
                    )}
                    onClick={() => {
                      if (level === 'region')   { setDrillRegion(gk); setDrillDistrict(null); }
                      if (level === 'district') { setDrillDistrict(gk); }
                    }}
                  >
                    <span className="flex items-center justify-center gap-1">
                      {gk}
                      {level !== 'healtharea' && <ChevronDown className="h-3 w-3 opacity-50" />}
                    </span>
                  </th>
                ))}
              </tr>
              {/* Sub-header: Target / Vacc / % */}
              <tr className="bg-muted/30 border-b text-[10px] text-muted-foreground">
                <th className="sticky left-0 z-10 bg-muted/50 px-3 py-1 border-r" />
                <th className="border-r px-1 py-1">
                  <div className="grid grid-cols-3 gap-0 text-center">
                    <span>{t('Target','Cible')}</span>
                    <span>{t('Vacc.','Vacc.')}</span>
                    <span>%</span>
                  </div>
                </th>
                {groupKeys.map(gk => (
                  <th key={gk} className="border-r px-1 py-1">
                    <div className="grid grid-cols-3 gap-0 text-center">
                      <span>{t('Target','Cible')}</span>
                      <span>{t('Vacc.','Vacc.')}</span>
                      <span>%</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayAntigens.map((antigen, ai) => {
                const overall = computeRow(
                  Object.values(groupedData).flat(),
                  totalTarget,
                  antigen
                );
                return (
                  <tr
                    key={antigen}
                    className={cn(
                      'border-b transition-colors hover:bg-muted/30',
                      ai % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    )}
                  >
                    {/* Antigen label */}
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-medium border-r whitespace-nowrap">
                      {antigen}
                    </td>

                    {/* Overall */}
                    <td className={cn('border-r px-1 py-2', coverageBg(overall.pct))}>
                      <div className="grid grid-cols-3 gap-0 text-center">
                        <span className="text-muted-foreground">{overall.target.toLocaleString()}</span>
                        <span>{overall.vaccinated.toLocaleString()}</span>
                        <span className={coverageColor(overall.pct)}>
                          {overall.pct !== null ? `${overall.pct}%` : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Per-group */}
                    {groupKeys.map(gk => {
                      const grpEntries = groupedData[gk] || [];
                      const grpTarget  = targetForGroup(gk);
                      const row = computeRow(grpEntries, grpTarget, antigen);
                      return (
                        <td
                          key={gk}
                          className={cn(
                            'border-r px-1 py-2',
                            coverageBg(row.pct),
                            level !== 'healtharea' ? 'cursor-pointer' : ''
                          )}
                          onClick={() => {
                            if (level === 'region')   { setDrillRegion(gk); setDrillDistrict(null); }
                            if (level === 'district') { setDrillDistrict(gk); }
                          }}
                        >
                          <div className="grid grid-cols-3 gap-0 text-center">
                            <span className="text-muted-foreground">{row.target.toLocaleString()}</span>
                            <span>{row.vaccinated.toLocaleString()}</span>
                            <span className={coverageColor(row.pct)}>
                              {row.pct !== null ? `${row.pct}%` : '—'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {groupKeys.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t('No data for the selected filters.', 'Aucune donnée pour les filtres sélectionnés.')}
            </div>
          )}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="font-medium">{t('Coverage:','Couverture :')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-950/40 inline-block" /> ≥ 80%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-950/40 inline-block" /> 50–79%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-950/40 inline-block" /> &lt; 50%</span>
      </div>
    </div>
  );
}
