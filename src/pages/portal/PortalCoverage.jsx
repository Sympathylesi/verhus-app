import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const ANTIGENS = [
  'BCG','OPV0','OPV1','OPV2','OPV3',
  'IPV1','IPV2','Penta1','Penta2','Penta3',
  'PCV1','PCV2','PCV3','Rota1','Rota2',
  'MCV1','MCV2','Yellow Fever','Vitamin A','HPV',
];
const AGE_SEX_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];

function sumDoses(entry, antigen) {
  const d = entry.vaccine_doses?.[antigen] || {};
  return AGE_SEX_KEYS.reduce((s, k) => s + (d[k] || 0), 0);
}
function pctColor(pct) {
  if (pct === null) return 'text-muted-foreground';
  if (pct >= 80) return 'text-emerald-600 font-bold';
  if (pct >= 50) return 'text-amber-500 font-bold';
  return 'text-red-500 font-bold';
}
function pctBg(pct) {
  if (pct === null) return '';
  if (pct >= 80) return 'bg-emerald-50 dark:bg-emerald-950/20';
  if (pct >= 50) return 'bg-amber-50 dark:bg-amber-950/20';
  return 'bg-red-50 dark:bg-red-950/20';
}

function Sel({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="h-8 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CoverageCell({ entries, target, antigen }) {
  const vacc = entries.reduce((s, e) => s + sumDoses(e, antigen), 0);
  const pct  = target > 0 ? Math.round(vacc / target * 100) : null;
  return (
    <td className={cn('border-r border-border px-2 py-1.5 text-center whitespace-nowrap', pctBg(pct))}>
      <div className="flex flex-col items-center leading-tight">
        <span className={cn('text-xs', pctColor(pct))}>{pct !== null ? `${pct}%` : '—'}</span>
        <span className="text-[10px] text-muted-foreground">{vacc.toLocaleString()}</span>
      </div>
    </td>
  );
}

export default function PortalCoverage() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;

  const [fYear,    setFYear]    = useState('');
  const [fWkFrom,  setFWkFrom]  = useState('');
  const [fWkTo,    setFWkTo]    = useState('');
  const [fAntigen, setFAntigen] = useState('');
  const [expandedRegions,   setExpandedRegions]   = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());

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

  const years = useMemo(() => [...new Set(entries.map(e => String(e.year)).filter(Boolean))].sort().reverse(), [entries]);
  const weeks = useMemo(() => Array.from({ length: 52 }, (_, i) => String(i + 1)), []);

  const filtered = useMemo(() => entries.filter(e => {
    if (fYear   && String(e.year) !== fYear) return false;
    if (fWkFrom && e.week_number < Number(fWkFrom)) return false;
    if (fWkTo   && e.week_number > Number(fWkTo))   return false;
    return true;
  }), [entries, fYear, fWkFrom, fWkTo]);

  const hierarchy = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const r  = e.region           || t('Inconnu', 'Unknown');
      const d  = e.district         || t('Inconnu', 'Unknown');
      const ha = e.health_area_name || t('Inconnu', 'Unknown');
      if (!map[r])        map[r] = {};
      if (!map[r][d])     map[r][d] = {};
      if (!map[r][d][ha]) map[r][d][ha] = [];
      map[r][d][ha].push(e);
    });
    return map;
  }, [filtered, lang]);

  const regions = useMemo(() => Object.keys(hierarchy).sort(), [hierarchy]);

  const totalTarget = useMemo(
    () => healthAreas.reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1,
    [healthAreas]
  );

  function targetForRegion(region) {
    return healthAreas.filter(ha => ha.region === region).reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1;
  }
  function targetForDistrict(district) {
    return healthAreas.filter(ha => ha.district === district).reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1;
  }
  function targetForHA(haName) {
    const ha = healthAreas.find(h => h.name === haName);
    return (ha?.target_population || ha?.population0_11m || 0) || 1;
  }

  function toggleRegion(region) {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
        setExpandedDistricts(pd => { const nd = new Set(pd); [...nd].filter(k => k.startsWith(region + '::')).forEach(k => nd.delete(k)); return nd; });
      } else next.add(region);
      return next;
    });
  }
  function toggleDistrict(region, district) {
    const key = `${region}::${district}`;
    setExpandedDistricts(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  function reset() {
    setFYear(''); setFWkFrom(''); setFWkTo(''); setFAntigen('');
    setExpandedRegions(new Set()); setExpandedDistricts(new Set());
  }

  const displayAntigens = fAntigen ? [fAntigen] : ANTIGENS;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Tableau de couverture vaccinale', 'Vaccination Coverage Table')}</h1>
        <p className="text-xs text-muted-foreground">
          {t('Cliquez + pour développer une région → districts → aires de santé',
             'Click + to expand a region → districts → health areas')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border">
        <Sel label={t('Année','Year')}     value={fYear}    onChange={setFYear}    options={years}    placeholder={t('Toutes','All')} />
        <Sel label={t('Sem. de','Wk from')} value={fWkFrom} onChange={setFWkFrom}  options={weeks}    placeholder="—" />
        <Sel label={t('Sem. à','Wk to')}   value={fWkTo}   onChange={setFWkTo}    options={weeks}    placeholder="—" />
        <Sel label={t('Antigène','Antigen')} value={fAntigen} onChange={setFAntigen} options={ANTIGENS} placeholder={t('Tous','All')} />
        <button onClick={reset}
          className="self-end h-8 px-3 rounded-md border text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5">
          <RotateCcw className="h-3 w-3" /> {t('Réinitialiser','Reset')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array(10).fill(0).map((_, i) => <div key={i} className="h-9 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <div className="rounded-lg border overflow-auto shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a2744] text-white">
                <th className="sticky left-0 z-10 bg-[#1a2744] w-8 border-r border-white/20" />
                <th className="sticky left-8 z-10 bg-[#1a2744] text-left px-3 py-3 font-semibold min-w-[180px] border-r border-white/20">
                  {t('Localisation','Location')}
                </th>
                <th className="text-right px-3 py-3 font-semibold min-w-[80px] border-r border-white/20 bg-[#243460]">
                  {t('Cible','Target')}
                </th>
                {displayAntigens.map(a => (
                  <th key={a} className="text-center px-2 py-3 font-semibold min-w-[80px] border-r border-white/20 whitespace-nowrap">{a}</th>
                ))}
              </tr>
              <tr className="bg-muted/50 border-b text-[10px] text-muted-foreground font-semibold">
                <th className="sticky left-0 z-10 bg-muted/70 w-8 border-r" />
                <th className="sticky left-8 z-10 bg-muted/70 px-3 py-1.5 border-r" />
                <th className="px-3 py-1.5 border-r text-right">{t('Pop.','Pop.')}</th>
                {displayAntigens.map(a => (
                  <th key={a} className="border-r px-1 py-1.5 text-center">
                    <div className="flex flex-col items-center leading-none gap-0.5">
                      <span>{t('Vacc.','Vacc.')}</span><span>%</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regions.map((region, ri) => {
                const regionEntries = Object.values(hierarchy[region]).flatMap(d => Object.values(d).flat());
                const regionTarget  = targetForRegion(region);
                const isRegionOpen  = expandedRegions.has(region);
                const districts     = Object.keys(hierarchy[region]).sort();
                return (
                  <React.Fragment key={region}>
                    <tr className={cn('border-b cursor-pointer transition-colors',
                      isRegionOpen ? 'bg-blue-50 dark:bg-blue-950/20' : ri % 2 === 0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'
                    )} onClick={() => toggleRegion(region)}>
                      <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-2">
                        <span className={cn('inline-flex items-center justify-center h-5 w-5 rounded border font-bold transition-colors',
                          isRegionOpen ? 'bg-[#1a2744] border-[#1a2744] text-white' : 'border-[#1a2744] text-[#1a2744] dark:border-blue-400 dark:text-blue-400'
                        )}>
                          {isRegionOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </span>
                      </td>
                      <td className="sticky left-8 z-10 bg-inherit px-3 py-2 border-r font-semibold text-[#1a2744] dark:text-blue-300">{region}</td>
                      <td className="px-3 py-2 border-r text-right text-muted-foreground">{regionTarget.toLocaleString()}</td>
                      {displayAntigens.map(a => (
                        <CoverageCell key={a} entries={regionEntries} target={regionTarget} antigen={a} />
                      ))}
                    </tr>

                    {isRegionOpen && districts.map((district, di) => {
                      const districtEntries = Object.values(hierarchy[region][district]).flat();
                      const districtTarget  = targetForDistrict(district);
                      const distKey         = `${region}::${district}`;
                      const isDistOpen      = expandedDistricts.has(distKey);
                      const haNames         = Object.keys(hierarchy[region][district]).sort();
                      return (
                        <React.Fragment key={distKey}>
                          <tr className={cn('border-b cursor-pointer transition-colors',
                            isDistOpen ? 'bg-violet-50 dark:bg-violet-950/20' : 'bg-blue-50/60 dark:bg-blue-950/10 hover:bg-blue-100/60'
                          )} onClick={e => { e.stopPropagation(); toggleDistrict(region, district); }}>
                            <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-1.5">
                              <span className={cn('inline-flex items-center justify-center h-4 w-4 rounded border font-bold transition-colors ml-2',
                                isDistOpen ? 'bg-violet-600 border-violet-600 text-white' : 'border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                              )}>
                                {isDistOpen ? <Minus className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                              </span>
                            </td>
                            <td className="sticky left-8 z-10 bg-inherit px-3 py-1.5 border-r font-medium text-violet-700 dark:text-violet-300 pl-6">↳ {district}</td>
                            <td className="px-3 py-1.5 border-r text-right text-muted-foreground">{districtTarget.toLocaleString()}</td>
                            {displayAntigens.map(a => (
                              <CoverageCell key={a} entries={districtEntries} target={districtTarget} antigen={a} />
                            ))}
                          </tr>

                          {isDistOpen && haNames.map((haName, hi) => (
                            <tr key={haName} className={cn('border-b', hi % 2 === 0 ? 'bg-violet-50/40 dark:bg-violet-950/10' : 'bg-violet-50/20')}>
                              <td className="sticky left-0 z-10 bg-inherit w-8 border-r" />
                              <td className="sticky left-8 z-10 bg-inherit px-3 py-1.5 border-r text-muted-foreground pl-10">· {haName}</td>
                              <td className="px-3 py-1.5 border-r text-right text-muted-foreground">{targetForHA(haName).toLocaleString()}</td>
                              {displayAntigens.map(a => (
                                <CoverageCell key={a} entries={hierarchy[region][district][haName]} target={targetForHA(haName)} antigen={a} />
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#1a2744]/30 bg-[#1a2744]/5 font-semibold">
                <td className="sticky left-0 z-10 bg-[#1a2744]/5 w-8 border-r" />
                <td className="sticky left-8 z-10 bg-[#1a2744]/5 px-3 py-2.5 border-r text-[#1a2744] dark:text-blue-300 uppercase tracking-wide text-[11px]">
                  {t('TOTAL NATIONAL','NATIONAL TOTAL')}
                </td>
                <td className="px-3 py-2.5 border-r text-right text-muted-foreground">{totalTarget.toLocaleString()}</td>
                {displayAntigens.map(a => (
                  <CoverageCell key={a} entries={filtered} target={totalTarget} antigen={a} />
                ))}
              </tr>
            </tfoot>
          </table>
          {regions.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t('Aucune donnée pour les filtres sélectionnés.','No data for the selected filters.')}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        <span className="font-medium">{t('Couverture :','Coverage:')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-100 inline-block border border-emerald-200" /> ≥ 80%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 inline-block border border-amber-200" /> 50–79%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 inline-block border border-red-200" /> &lt; 50%</span>
      </div>
    </div>
  );
}
