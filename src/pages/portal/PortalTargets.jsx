import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PortalTargets() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;

  const [expandedRegions,   setExpandedRegions]   = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());

  const { data: healthAreas = [], isLoading } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
  });

  // Build region → district → HA hierarchy from healthAreas
  const hierarchy = useMemo(() => {
    const map = {};
    healthAreas.forEach(ha => {
      const r = ha.region   || t('Inconnu','Unknown');
      const d = ha.district || t('Inconnu','Unknown');
      if (!map[r])     map[r] = {};
      if (!map[r][d])  map[r][d] = [];
      map[r][d].push(ha);
    });
    return map;
  }, [healthAreas, lang]);

  const regions = useMemo(() => Object.keys(hierarchy).sort(), [hierarchy]);

  function pop(ha) { return ha.target_population || ha.population0_11m || 0; }
  function sumPop(arr) { return arr.reduce((s, ha) => s + pop(ha), 0); }

  function toggleRegion(r) {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(r)) { next.delete(r); setExpandedDistricts(pd => { const nd = new Set(pd); [...nd].filter(k=>k.startsWith(r+'::')).forEach(k=>nd.delete(k)); return nd; }); }
      else next.add(r);
      return next;
    });
  }
  function toggleDistrict(r, d) {
    const key = `${r}::${d}`;
    setExpandedDistricts(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  const totalPop = useMemo(() => healthAreas.reduce((s, ha) => s + pop(ha), 0), [healthAreas]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Cibles','Targets')}</h1>
        <p className="text-xs text-muted-foreground">
          {t('Population cible par région, district et aire de santé','Target population by region, district and health area')}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array(8).fill(0).map((_,i)=><div key={i} className="h-10 bg-muted animate-pulse rounded"/>)}</div>
      ) : (
        <div className="rounded-lg border overflow-auto shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a2744] text-white">
                <th className="sticky left-0 z-10 bg-[#1a2744] w-8 border-r border-white/20"/>
                <th className="sticky left-8 z-10 bg-[#1a2744] text-left px-3 py-3 font-semibold min-w-[200px] border-r border-white/20">{t('Localisation','Location')}</th>
                <th className="text-right px-3 py-3 font-semibold min-w-[100px] border-r border-white/20">{t('Pop. 0-11m','Pop. 0-11m')}</th>
                <th className="text-right px-3 py-3 font-semibold min-w-[100px] border-r border-white/20">{t('Pop. 12-23m','Pop. 12-23m')}</th>
                <th className="text-right px-3 py-3 font-semibold min-w-[100px] border-r border-white/20">{t('Pop. 24-59m','Pop. 24-59m')}</th>
                <th className="text-right px-3 py-3 font-semibold min-w-[110px] border-r border-white/20">{t('Cible totale','Total Target')}</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region, ri) => {
                const allHA        = Object.values(hierarchy[region]).flat();
                const regionTarget = sumPop(allHA);
                const isOpen       = expandedRegions.has(region);
                const districts    = Object.keys(hierarchy[region]).sort();
                return (
                  <React.Fragment key={region}>
                    <tr className={cn('border-b cursor-pointer transition-colors',
                      isOpen ? 'bg-blue-50 dark:bg-blue-950/20' : ri%2===0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'
                    )} onClick={()=>toggleRegion(region)}>
                      <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-2">
                        <span className={cn('inline-flex items-center justify-center h-5 w-5 rounded border font-bold transition-colors',
                          isOpen ? 'bg-[#1a2744] border-[#1a2744] text-white' : 'border-[#1a2744] text-[#1a2744] dark:border-blue-400 dark:text-blue-400'
                        )}>{isOpen ? <Minus className="h-3 w-3"/> : <Plus className="h-3 w-3"/>}</span>
                      </td>
                      <td className="sticky left-8 z-10 bg-inherit px-3 py-2 border-r font-semibold text-[#1a2744] dark:text-blue-300">{region}</td>
                      <td className="px-3 py-2 border-r text-right">{allHA.reduce((s,ha)=>s+(ha.population0_11m||0),0).toLocaleString()}</td>
                      <td className="px-3 py-2 border-r text-right">{allHA.reduce((s,ha)=>s+(ha.population12_23m||0),0).toLocaleString()}</td>
                      <td className="px-3 py-2 border-r text-right">{allHA.reduce((s,ha)=>s+(ha.population24_59m||0),0).toLocaleString()}</td>
                      <td className="px-3 py-2 border-r text-right font-semibold">{regionTarget.toLocaleString()}</td>
                    </tr>

                    {isOpen && districts.map((district) => {
                      const distHA     = hierarchy[region][district];
                      const distTarget = sumPop(distHA);
                      const distKey    = `${region}::${district}`;
                      const isDistOpen = expandedDistricts.has(distKey);
                      return (
                        <React.Fragment key={distKey}>
                          <tr className={cn('border-b cursor-pointer transition-colors',
                            isDistOpen ? 'bg-violet-50 dark:bg-violet-950/20' : 'bg-blue-50/60 dark:bg-blue-950/10 hover:bg-blue-100/60'
                          )} onClick={e=>{e.stopPropagation();toggleDistrict(region,district);}}>
                            <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-1.5">
                              <span className={cn('inline-flex items-center justify-center h-4 w-4 rounded border font-bold transition-colors ml-2',
                                isDistOpen ? 'bg-violet-600 border-violet-600 text-white' : 'border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                              )}>{isDistOpen ? <Minus className="h-2.5 w-2.5"/> : <Plus className="h-2.5 w-2.5"/>}</span>
                            </td>
                            <td className="sticky left-8 z-10 bg-inherit px-3 py-1.5 border-r font-medium text-violet-700 dark:text-violet-300 pl-6">↳ {district}</td>
                            <td className="px-3 py-1.5 border-r text-right">{distHA.reduce((s,ha)=>s+(ha.population0_11m||0),0).toLocaleString()}</td>
                            <td className="px-3 py-1.5 border-r text-right">{distHA.reduce((s,ha)=>s+(ha.population12_23m||0),0).toLocaleString()}</td>
                            <td className="px-3 py-1.5 border-r text-right">{distHA.reduce((s,ha)=>s+(ha.population24_59m||0),0).toLocaleString()}</td>
                            <td className="px-3 py-1.5 border-r text-right font-medium">{distTarget.toLocaleString()}</td>
                          </tr>
                          {isDistOpen && distHA.map((ha, hi) => (
                            <tr key={ha.id} className={cn('border-b', hi%2===0 ? 'bg-violet-50/40 dark:bg-violet-950/10' : 'bg-violet-50/20')}>
                              <td className="sticky left-0 z-10 bg-inherit w-8 border-r"/>
                              <td className="sticky left-8 z-10 bg-inherit px-3 py-1.5 border-r text-muted-foreground pl-10">· {ha.name}</td>
                              <td className="px-3 py-1.5 border-r text-right">{(ha.population0_11m||0).toLocaleString()}</td>
                              <td className="px-3 py-1.5 border-r text-right">{(ha.population12_23m||0).toLocaleString()}</td>
                              <td className="px-3 py-1.5 border-r text-right">{(ha.population24_59m||0).toLocaleString()}</td>
                              <td className="px-3 py-1.5 border-r text-right">{pop(ha).toLocaleString()}</td>
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
                <td className="sticky left-8 z-10 bg-[#1a2744]/5 px-3 py-2.5 border-r text-[#1a2744] dark:text-blue-300 uppercase tracking-wide text-[11px]">{t('TOTAL NATIONAL','NATIONAL TOTAL')}</td>
                <td className="px-3 py-2.5 border-r text-right">{healthAreas.reduce((s,ha)=>s+(ha.population0_11m||0),0).toLocaleString()}</td>
                <td className="px-3 py-2.5 border-r text-right">{healthAreas.reduce((s,ha)=>s+(ha.population12_23m||0),0).toLocaleString()}</td>
                <td className="px-3 py-2.5 border-r text-right">{healthAreas.reduce((s,ha)=>s+(ha.population24_59m||0),0).toLocaleString()}</td>
                <td className="px-3 py-2.5 border-r text-right">{totalPop.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
