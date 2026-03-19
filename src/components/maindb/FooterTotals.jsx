import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function FooterTotals({ rows, visibleCols }) {
  const totals = useMemo(() => {
    const t = {};
    visibleCols.forEach(c => {
      if (c.numeric) {
        t[c.id] = rows.reduce((s, r) => s + (Number(r[c.id]) || 0), 0);
      }
    });
    return t;
  }, [rows, visibleCols]);

  const totalChildren = totals['total_children_vaccinated'] || 0;
  const dtp3 = totals['dtp3_count'] || 0;
  const mcv2 = totals['mcv2_count'] || 0;
  const dtp3Pct = totalChildren > 0 ? ((dtp3 / totalChildren) * 100).toFixed(1) : '–';
  const mcv2Pct = totalChildren > 0 ? ((mcv2 / totalChildren) * 100).toFixed(1) : '–';

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-3 py-2 bg-muted/60 border-t text-xs">
      <span className="font-semibold text-muted-foreground">Totals ({rows.length.toLocaleString()} rows):</span>
      {totalChildren > 0 && (
        <span>Children: <strong>{totalChildren.toLocaleString()}</strong></span>
      )}
      {totals['total_doses_administered'] > 0 && (
        <span>Doses: <strong>{totals['total_doses_administered'].toLocaleString()}</strong></span>
      )}
      {dtp3 > 0 && (
        <span>DTP3: <strong>{dtp3.toLocaleString()}</strong>
          <span className={cn('ml-1', Number(dtp3Pct) >= 80 ? 'text-emerald-600' : Number(dtp3Pct) >= 50 ? 'text-amber-600' : 'text-red-500')}>
            ({dtp3Pct}%)
          </span>
        </span>
      )}
      {mcv2 > 0 && (
        <span>MCV2: <strong>{mcv2.toLocaleString()}</strong>
          <span className={cn('ml-1', Number(mcv2Pct) >= 80 ? 'text-emerald-600' : Number(mcv2Pct) >= 50 ? 'text-amber-600' : 'text-red-500')}>
            ({mcv2Pct}%)
          </span>
        </span>
      )}
      {totals['scr_aefi'] > 0 && (
        <span className="text-red-600">AEFI: <strong>{totals['scr_aefi'].toLocaleString()}</strong></span>
      )}
    </div>
  );
}
