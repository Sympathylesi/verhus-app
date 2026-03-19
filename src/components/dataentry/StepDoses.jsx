import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const VACCINE_GROUPS = [
  { label: 'Birth Doses',    vaccines: ['BCG', 'OPV0'] },
  { label: 'Polio',          vaccines: ['OPV1', 'OPV2', 'OPV3', 'IPV1', 'IPV2'] },
  { label: 'Pentavalent',    vaccines: ['Penta1', 'Penta2', 'Penta3'] },
  { label: 'Pneumococcal',   vaccines: ['PCV1', 'PCV2', 'PCV3'] },
  { label: 'Rotavirus',      vaccines: ['Rota1', 'Rota2'] },
  { label: 'Measles / YF',   vaccines: ['MCV1', 'MCV2', 'Yellow Fever'] },
  { label: 'Supplements',    vaccines: ['Vitamin A'] },
  { label: 'HPV',            vaccines: ['HPV'] },
];

const ALL_VACCINES = VACCINE_GROUPS.flatMap(g => g.vaccines);

const COLUMNS = [
  { key: '0_11m_male',   label: '0–11m M' },
  { key: '0_11m_female', label: '0–11m F' },
  { key: '12_23m_male',  label: '12–23m M' },
  { key: '12_23m_female',label: '12–23m F' },
  { key: '24_59m_male',  label: '24–59m M' },
  { key: '24_59m_female',label: '24–59m F' },
  { key: 'hpv_9_13y',   label: '9–13y' },
];

export default function StepDoses({ lang, data, setData }) {
  const doses = data.vaccine_doses || {};
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const update = (vaccine, col, value) => {
    setData(prev => ({
      ...prev,
      vaccine_doses: {
        ...prev.vaccine_doses,
        [vaccine]: { ...(prev.vaccine_doses?.[vaccine] || {}), [col]: parseInt(value) || 0 }
      }
    }));
  };

  const rowTotal = (vaccine) => {
    const v = doses[vaccine] || {};
    return Object.values(v).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);
  };

  const grandTotal = ALL_VACCINES.reduce((s, v) => s + rowTotal(v), 0);

  return (
    <div className="space-y-4">
      {/* Grand total banner */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg border">
        <span className="text-sm font-medium">{t('Total doses entered', 'Total doses saisies')}</span>
        <span className="text-2xl font-bold text-primary">{grandTotal}</span>
      </div>

      {VACCINE_GROUPS.map(group => {
        const groupTotal = group.vaccines.reduce((s, v) => s + rowTotal(v), 0);
        return (
          <Card key={group.label}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</span>
              {groupTotal > 0 && (
                <span className="text-xs font-bold text-primary">{groupTotal} {t('doses', 'doses')}</span>
              )}
            </div>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b bg-muted/10">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[90px]">
                      {t('Vaccine', 'Vaccin')}
                    </th>
                    {COLUMNS.map(col => (
                      <th key={col.key} className="text-center py-2 px-1 font-medium text-muted-foreground whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                    <th className="text-center py-2 px-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {group.vaccines.map(vac => {
                    const total = rowTotal(vac);
                    const isHPV = vac === 'HPV';
                    return (
                      <tr key={vac} className={cn(
                        'border-b last:border-0 transition-colors',
                        total > 0 ? 'bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/50' : 'hover:bg-muted/20'
                      )}>
                        <td className="py-1.5 px-3 font-semibold sticky left-0 bg-inherit z-10">{vac}</td>
                        {COLUMNS.map(col => {
                          const isHPVCol = col.key === 'hpv_9_13y';
                          const disabled = (isHPV && !isHPVCol) || (!isHPV && isHPVCol);
                          return (
                            <td key={col.key} className="py-1.5 px-0.5">
                              <Input
                                type="number" inputMode="numeric" min={0}
                                disabled={disabled}
                                value={disabled ? '' : (doses[vac]?.[col.key] || '')}
                                onChange={e => update(vac, col.key, e.target.value)}
                                className="h-7 w-16 text-center text-xs mx-auto disabled:opacity-20 disabled:cursor-not-allowed"
                              />
                            </td>
                          );
                        })}
                        <td className={cn('py-1.5 px-2 text-center font-bold', total > 0 ? 'text-primary' : 'text-muted-foreground/30')}>
                          {total || '–'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
