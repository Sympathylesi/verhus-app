import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Generic collapsible Region → District → HealthArea table.
 * Props:
 *   hierarchy   : { [region]: { [district]: HA[] } }
 *   columns     : [{ key, header, render(row, level) }]
 *   getRowData  : (items, level, name) => rowData object passed to render
 *   footerData  : object passed to render for the tfoot row
 *   footerLabel : string
 *   expandedRegions, expandedDistricts, toggleRegion, toggleDistrict
 */
export default function CollapsibleTable({
  hierarchy, columns, getRowData, footerData, footerLabel,
  expandedRegions, expandedDistricts, toggleRegion, toggleDistrict,
}) {
  const regions = Object.keys(hierarchy).sort();

  return (
    <div className="rounded-lg border overflow-auto shadow-sm">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#1a2744] text-white">
            <th className="sticky left-0 z-10 bg-[#1a2744] w-8 border-r border-white/20"/>
            <th className="sticky left-8 z-10 bg-[#1a2744] text-left px-3 py-3 font-semibold min-w-[200px] border-r border-white/20">
              {columns[0]?.header}
            </th>
            {columns.slice(1).map(c => (
              <th key={c.key} className="text-right px-3 py-3 font-semibold min-w-[100px] border-r border-white/20 whitespace-nowrap">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {regions.map((region, ri) => {
            const allItems  = Object.values(hierarchy[region]).flatMap(d => Object.values(d).flat());
            const rowData   = getRowData(allItems, 'region', region);
            const isOpen    = expandedRegions.has(region);
            const districts = Object.keys(hierarchy[region]).sort();
            return (
              <React.Fragment key={region}>
                <tr className={cn('border-b cursor-pointer transition-colors',
                  isOpen ? 'bg-blue-50 dark:bg-blue-950/20' : ri%2===0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'
                )} onClick={() => toggleRegion(region)}>
                  <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-2">
                    <span className={cn('inline-flex items-center justify-center h-5 w-5 rounded border font-bold transition-colors',
                      isOpen ? 'bg-[#1a2744] border-[#1a2744] text-white' : 'border-[#1a2744] text-[#1a2744] dark:border-blue-400 dark:text-blue-400'
                    )}>{isOpen ? <Minus className="h-3 w-3"/> : <Plus className="h-3 w-3"/>}</span>
                  </td>
                  <td className="sticky left-8 z-10 bg-inherit px-3 py-2 border-r font-semibold text-[#1a2744] dark:text-blue-300">{region}</td>
                  {columns.slice(1).map(c => (
                    <td key={c.key} className="px-3 py-2 border-r text-right">{c.render(rowData.entries ?? rowData, rowData.target, region, 'region')}</td>
                  ))}
                </tr>

                {isOpen && districts.map(district => {
                  const haMap      = hierarchy[region][district]; // { [haName]: entries[] }
                  const distFlat   = Object.values(haMap).flat();
                  const distData   = getRowData(distFlat, 'district', district);
                  const distKey    = `${region}::${district}`;
                  const isDistOpen = expandedDistricts.has(distKey);
                  const haNames    = Object.keys(haMap).sort();
                  return (
                    <React.Fragment key={distKey}>
                      <tr className={cn('border-b cursor-pointer transition-colors',
                        isDistOpen ? 'bg-violet-50 dark:bg-violet-950/20' : 'bg-blue-50/60 dark:bg-blue-950/10 hover:bg-blue-100/60'
                      )} onClick={e => { e.stopPropagation(); toggleDistrict(region, district); }}>
                        <td className="sticky left-0 z-10 bg-inherit w-8 border-r text-center py-1.5">
                          <span className={cn('inline-flex items-center justify-center h-4 w-4 rounded border font-bold transition-colors ml-2',
                            isDistOpen ? 'bg-violet-600 border-violet-600 text-white' : 'border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                          )}>{isDistOpen ? <Minus className="h-2.5 w-2.5"/> : <Plus className="h-2.5 w-2.5"/>}</span>
                        </td>
                        <td className="sticky left-8 z-10 bg-inherit px-3 py-1.5 border-r font-medium text-violet-700 dark:text-violet-300 pl-6">↳ {district}</td>
                        {columns.slice(1).map(c => (
                          <td key={c.key} className="px-3 py-1.5 border-r text-right">{c.render(distData.entries ?? distData, distData.target, district, 'district')}</td>
                        ))}
                      </tr>

                      {isDistOpen && haNames.map((haName, hi) => {
                        const haEntries = haMap[haName];
                        const itemData  = getRowData(haEntries, 'ha', haName);
                        return (
                          <tr key={haName} className={cn('border-b', hi%2===0 ? 'bg-violet-50/40 dark:bg-violet-950/10' : 'bg-violet-50/20')}>
                            <td className="sticky left-0 z-10 bg-inherit w-8 border-r"/>
                            <td className="sticky left-8 z-10 bg-inherit px-3 py-1.5 border-r text-muted-foreground pl-10">· {haName}</td>
                            {columns.slice(1).map(c => (
                              <td key={c.key} className="px-3 py-1.5 border-r text-right">{c.render(itemData.entries ?? itemData, itemData.target, haName, 'ha')}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        {footerData && (
          <tfoot>
            <tr className="border-t-2 border-[#1a2744]/30 bg-[#1a2744]/5 font-semibold">
              <td className="sticky left-0 z-10 bg-[#1a2744]/5 w-8 border-r"/>
              <td className="sticky left-8 z-10 bg-[#1a2744]/5 px-3 py-2.5 border-r text-[#1a2744] dark:text-blue-300 uppercase tracking-wide text-[11px]">{footerLabel}</td>
              {columns.slice(1).map(c => (
                <td key={c.key} className="px-3 py-2.5 border-r text-right">{c.render(footerData.entries ?? footerData, footerData.target, 'national', 'national')}</td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
