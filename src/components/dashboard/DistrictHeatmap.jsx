import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function coverageBg(pct) {
  if (pct === null) return 'bg-muted/40 text-muted-foreground/40';
  if (pct >= 80)   return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200';
  if (pct >= 50)   return 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200';
  return 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200';
}

const Empty = ({ lang }) => (
  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
    {lang === 'fr' ? 'Aucune donnée pour cette période' : 'No data for this period'}
  </div>
);

export default function DistrictHeatmap({ lang, data, loading }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const { districts = [], periods = [], cells = {} } = data || {};
  const empty = !loading && districts.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('DTP3 Coverage by District & Week (%)', 'Couverture DTP3 par district et semaine (%)')}
        </CardTitle>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-950/50 border" />≥80%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-950/50 border" />50–79%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-950/50 border" />&lt;50%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted/40 border" />{t('No data', 'Sans données')}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="h-40 bg-muted animate-pulse rounded-b-lg" />
        ) : empty ? (
          <Empty lang={lang} />
        ) : (
          <div className="overflow-auto max-h-72">
            <table className="text-[11px] border-collapse w-full">
              <thead className="sticky top-0 z-10 bg-card">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-r whitespace-nowrap bg-muted/50 min-w-[120px]">
                    {t('District', 'District')}
                  </th>
                  {periods.map(p => (
                    <th key={p} className="px-2 py-2 text-center font-medium text-muted-foreground border-b border-r last:border-r-0 whitespace-nowrap bg-muted/50">
                      {p.replace(/^\d{4}-/, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {districts.map(district => (
                  <tr key={district} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-1.5 font-medium border-r whitespace-nowrap">{district}</td>
                    {periods.map(p => {
                      const pct = cells[district]?.[p] ?? null;
                      return (
                        <td key={p} className={cn('px-2 py-1.5 text-center border-r last:border-r-0 font-medium tabular-nums', coverageBg(pct))}>
                          {pct !== null ? `${pct}%` : '–'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
