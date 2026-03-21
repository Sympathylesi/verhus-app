import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PortalMissingReports() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;
  const [expandedRegions,   setExpandedRegions]   = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());

  const { data: entries = [],     isLoading: le } = useQuery({ queryKey: ['entries_all'],  queryFn: () => base44.entities.WeeklyEntry.list(), staleTime: 5*60*1000 });
  const { data: healthAreas = [], isLoading: lh } = useQuery({ queryKey: ['healthAreas'],  queryFn: () => base44.entities.HealthArea.list(),  staleTime: 10*60*1000 });

  const reportedHAs = useMemo(() => new Set(entries.map(e => e.health_area_name).filter(Boolean)), [entries]);

  const missingHAs = useMemo(() => healthAreas.filter(ha => !reportedHAs.has(ha.name)), [healthAreas, reportedHAs]);

  const hierarchy = useMemo(() => {
    const map = {};
    missingHAs.forEach(ha => {
      const r = ha.region   || t('Inconnu','Unknown');
      const d = ha.district || t('Inconnu','Unknown');
      if (!map[r])    map[r] = {};
      if (!map[r][d]) map[r][d] = [];
      map[r][d].push(ha);
    });
    return map;
  }, [missingHAs, lang]);

  const regions = useMemo(() => Object.keys(hierarchy).sort(), [hierarchy]);

  function toggleRegion(r) {
    setExpandedRegions(prev => { const next = new Set(prev); if (next.has(r)) { next.delete(r); setExpandedDistricts(pd => { const nd = new Set(pd); [...nd].filter(k=>k.startsWith(r+'::')).forEach(k=>nd.delete(k)); return nd; }); } else next.add(r); return next; });
  }
  function toggleDistrict(r, d) {
    const key = `${r}::${d}`;
    setExpandedDistricts(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Rapports manquants','Missing Reports')}</h1>
        <p className="text-xs text-muted-foreground">
          {missingHAs.length > 0
            ? `${missingHAs.length} ${t('aire(s) de santé sans aucun rapport enregistré','health area(s) with no recorded report')}`
            : t('Toutes les aires de santé ont au moins un rapport.','All health areas have at least one report.')}
        </p>
      </div>

      {missingHAs.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {missingHAs.length} {t('aires de santé manquantes sur','missing health areas out of')} {healthAreas.length}
        </div>
      )}

      {le || lh ? (
        <div className="space-y-2">{Array(6).fill(0).map((_,i)=><div key={i} className="h-10 bg-muted animate-pulse rounded"/>)}</div>
      ) : missingHAs.length === 0 ? (
        <div className="py-16 text-center text-sm text-emerald-600 font-medium border rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
          ✓ {t('Aucun rapport manquant','No missing reports')}
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a2744] text-white">
                <th className="sticky left-0 z-10 bg-[#1a2744] w-8 border-r border-white/20"/>
                <th className="sticky left-8 z-10 bg-[#1a2744] text-left px-3 py-3 font-semibold min-w-[220px] border-r border-white/20">{t('Localisation','Location')}</th>
                <th className="text-right px-3 py-3 font-semibold min-w-[100px] border-r border-white/20">{t('Aires manquantes','Missing Areas')}</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region, ri) => {
                const allMissing = Object.values(hierarchy[region]).flat();
                const isOpen     = expandedRegions.has(region);
                const districts  = Object.keys(hierarchy[region]).sort();
                return (
                  <React.Fragment key={region}>
                    <tr className={cn('border-b cursor-pointer transition-colors',
                      isOpen ? 'bg-amber-50 dark:bg-amber-950/20' : ri%2===0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'
                    )} onClick={()=>toggleRegion(region)}>
                      <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-2">
                        <span className={cn('inline-flex items-center justify-center h-5 w-5 rounded border font-bold transition-colors',
                          isOpen ? 'bg-[#1a2744] border-[#1a2744] text-white' : 'border-[#1a2744] text-[#1a2744] dark:border-blue-400 dark:text-blue-400'
                        )}>{isOpen ? <Minus className="h-3 w-3"/> : <Plus className="h-3 w-3"/>}</span>
                      </td>
                      <td className="sticky left-8 z-10 bg-inherit px-3 py-2 border-r font-semibold text-[#1a2744] dark:text-blue-300">{region}</td>
                      <td className="px-3 py-2 border-r text-right text-amber-600 font-semibold">{allMissing.length}</td>
                    </tr>
                    {isOpen && districts.map(district => {
                      const distMissing = hierarchy[region][district];
                      const distKey     = `${region}::${district}`;
                      const isDistOpen  = expandedDistricts.has(distKey);
                      return (
                        <React.Fragment key={distKey}>
                          <tr className={cn('border-b cursor-pointer transition-colors',
                            isDistOpen ? 'bg-amber-50/80 dark:bg-amber-950/10' : 'bg-amber-50/40 dark:bg-amber-950/5 hover:bg-amber-50/60'
                          )} onClick={e=>{e.stopPropagation();toggleDistrict(region,district);}}>
                            <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-1.5">
                              <span className={cn('inline-flex items-center justify-center h-4 w-4 rounded border font-bold transition-colors ml-2',
                                isDistOpen ? 'bg-amber-500 border-amber-500 text-white' : 'border-amber-400 text-amber-600'
                              )}>{isDistOpen ? <Minus className="h-2.5 w-2.5"/> : <Plus className="h-2.5 w-2.5"/>}</span>
                            </td>
                            <td className="sticky left-8 z-10 bg-inherit px-3 py-1.5 border-r font-medium text-amber-700 dark:text-amber-300 pl-6">↳ {district}</td>
                            <td className="px-3 py-1.5 border-r text-right text-amber-600">{distMissing.length}</td>
                          </tr>
                          {isDistOpen && distMissing.map((ha, hi) => (
                            <tr key={ha.id} className={cn('border-b', hi%2===0 ? 'bg-amber-50/20' : 'bg-background')}>
                              <td className="sticky left-0 z-10 bg-inherit w-8 border-r"/>
                              <td className="sticky left-8 z-10 bg-inherit px-3 py-1.5 border-r text-muted-foreground pl-10">· {ha.name}</td>
                              <td className="px-3 py-1.5 border-r text-right text-red-500">0</td>
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
                <td className="sticky left-0 z-10 bg-[#1a2744]/5 w-8 border-r"/>
                <td className="sticky left-8 z-10 bg-[#1a2744]/5 px-3 py-2.5 border-r text-[#1a2744] dark:text-blue-300 uppercase tracking-wide text-[11px]">{t('TOTAL','TOTAL')}</td>
                <td className="px-3 py-2.5 border-r text-right text-amber-600">{missingHAs.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
