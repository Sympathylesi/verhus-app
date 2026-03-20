import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const VACCINE_GROUPS = [
  { key: 'penta',     vaccines: ['Penta1', 'Penta2', 'Penta3'] },
  { key: 'mcv',       vaccines: ['MCV1 (MR1)', 'MCV2 (MR2)'] },
  { key: 'bcg_hepb',  vaccines: ['BCG', 'HepB-0'] },
  { key: 'opv',       vaccines: ['OPV0', 'OPV1', 'OPV2', 'OPV3'] },
  { key: 'ipv',       vaccines: ['IPV1', 'IPV2'] },
  { key: 'pcv',       vaccines: ['PCV-13 1', 'PCV-13 2', 'PCV-13 3'] },
  { key: 'rota',      vaccines: ['Rota1', 'Rota2', 'Rota3'] },
  { key: 'mening',    vaccines: ['Meningitis'] },
  { key: 'yf',        vaccines: ['Yellow Fever'] },
  { key: 'ipti',      vaccines: ['IPTi oral'] },
  { key: 'mosquirix', vaccines: ['Mosquirix injectable'] },
  { key: 'vita',      vaccines: ['Vitamin A'] },
];

const VACCINES = VACCINE_GROUPS.flatMap(g => g.vaccines);

const AGE_COLS = [
  { key: '0_11m_male',    label: '0-11m M' },
  { key: '0_11m_female',  label: '0-11m F' },
  { key: '12_23m_male',   label: '12-23m M' },
  { key: '12_23m_female', label: '12-23m F' },
  { key: '24_59m_male',   label: '24-59m M' },
  { key: '24_59m_female', label: '24-59m F' },
];

const CONTACT_TYPES = [
  { key: 'first',    label: { en: 'First Contact',    fr: 'Premier contact' } },
  { key: 'followup', label: { en: 'Follow-up Contact', fr: 'Contact de suivi' } },
];

const OTHER_VARS = [
  { key: 'newly_vaccinated',      label: { en: 'Children newly vaccinated by project team', fr: "Enfants nouvellement vaccin\u00e9s par l'\u00e9quipe" } },
  { key: 'serious_aefi',          label: { en: 'Number of Serious AEFI',                    fr: "Nombre d'EIAS graves" } },
  { key: 'disability_vaccinated', label: { en: 'Children with disability vaccinated',        fr: 'Enfants handicap\u00e9s vaccin\u00e9s' } },
  { key: 'screened_malnutrition', label: { en: 'Children screened for malnutrition',         fr: 'Enfants d\u00e9pist\u00e9s malnutrition' } },
  { key: 'sam_identified',        label: { en: 'SAM identified',                             fr: 'MAS identifi\u00e9s' } },
  { key: 'moderate_identified',   label: { en: 'Moderate malnutrition identified',           fr: 'Malnutrition mod\u00e9r\u00e9e identifi\u00e9e' } },
  { key: 'educational_talks',     label: { en: 'Number of educational talks',                fr: 'Nombre de causeries \u00e9ducatives' } },
];

export default function StepDoses({ lang, data, setData }) {
  const doses = data.vaccine_doses || {};
  const other = data.other_variables || {};
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const updateDose = (vaccine, contact, col, value) =>
    setData(prev => ({
      ...prev,
      vaccine_doses: {
        ...prev.vaccine_doses,
        [vaccine]: {
          ...(prev.vaccine_doses?.[vaccine] || {}),
          [`${contact}_${col}`]: parseInt(value) || 0,
        }
      }
    }));

  const updateOther = (key, value) =>
    setData(prev => ({ ...prev, other_variables: { ...(prev.other_variables || {}), [key]: parseInt(value) || 0 } }));

  const updateStockout = (groupKey, value) =>
    setData(prev => ({
      ...prev,
      stockouts: { ...(prev.stockouts || {}), [groupKey]: value }
    }));

  const contactTotal = (vaccine, contact) =>
    AGE_COLS.reduce((s, col) => s + (doses[vaccine]?.[`${contact}_${col.key}`] || 0), 0);

  const stockouts = data.stockouts || {};

  const grandTotal = VACCINES.reduce((s, v) =>
    s + CONTACT_TYPES.reduce((ss, ct) => ss + contactTotal(v, ct.key), 0), 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg border">
        <span className="text-sm font-medium">{t('Total doses entered', 'Total doses saisies')}</span>
        <span className="text-2xl font-bold text-primary">{grandTotal}</span>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[140px]" rowSpan={2}>
                  {t('Vaccine', 'Vaccin')}
                </th>
                {CONTACT_TYPES.map(ct => (
                  <th key={ct.key} className="text-center py-2 px-2 font-medium text-muted-foreground" colSpan={7}>
                    {ct.label[lang]}
                  </th>
                ))}
                <th className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap" rowSpan={2}>
                  {t('Stockout?', 'Rupture?')}
                </th>
              </tr>
              <tr className="border-b bg-muted/10">
                {CONTACT_TYPES.map(ct => (
                  <React.Fragment key={ct.key}>
                    {AGE_COLS.map(col => (
                      <th key={col.key} className="text-center py-1.5 px-1 font-medium text-muted-foreground whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                    <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Total</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {VACCINE_GROUPS.map(group =>
                group.vaccines.map((vac, vi) => {
                  const row = doses[vac] || {};
                  const totals = CONTACT_TYPES.map(ct => contactTotal(vac, ct.key));
                  const rowTotal = totals.reduce((s, n) => s + n, 0);
                  const isFirst = vi === 0;
                  return (
                    <tr key={vac} className={cn(
                      'border-b last:border-0',
                      rowTotal > 0 ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : 'hover:bg-muted/20'
                    )}>
                      <td className="py-1.5 px-3 font-semibold sticky left-0 bg-inherit z-10">{vac}</td>
                      {CONTACT_TYPES.map((ct, ci) => (
                        <React.Fragment key={ct.key}>
                          {AGE_COLS.map(col => (
                            <td key={col.key} className="py-1 px-0.5">
                              <Input
                                type="number" inputMode="numeric" min={0}
                                value={row[`${ct.key}_${col.key}`] || ''}
                                onChange={e => updateDose(vac, ct.key, col.key, e.target.value)}
                                className="h-7 w-14 text-center text-xs mx-auto"
                              />
                            </td>
                          ))}
                          <td className={cn('py-1.5 px-2 text-center font-bold', totals[ci] > 0 ? 'text-primary' : 'text-muted-foreground/30')}>
                            {totals[ci] || '–'}
                          </td>
                        </React.Fragment>
                      ))}
                      {isFirst && (
                        <td className="py-1.5 px-2 text-center align-middle" rowSpan={group.vaccines.length}>
                          <button
                            type="button"
                            onClick={() => updateStockout(group.key, !stockouts[group.key])}
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded border',
                              stockouts[group.key]
                                ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {stockouts[group.key] ? 'Y' : 'N'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Other variables — same columns as vaccine table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <tbody>
              {OTHER_VARS.map(v => (
                <tr key={v.key} className="border-b last:border-0 bg-muted/10">
                  <td className="py-1 px-3 font-medium text-muted-foreground sticky left-0 bg-muted/10 z-10 min-w-[140px] leading-tight">
                    <span className="block max-w-[130px] truncate" title={v.label[lang]}>{v.label[lang]}</span>
                  </td>
                  {AGE_COLS.map(col => (
                    <td key={`first_${col.key}`} className="py-1 px-0.5">
                      <Input type="number" inputMode="numeric" min={0}
                        value={other[`${v.key}_first_${col.key}`] || ''}
                        onChange={e => updateOther(`${v.key}_first_${col.key}`, e.target.value)}
                        className="h-7 w-14 text-center text-xs mx-auto" />
                    </td>
                  ))}
                  {/* empty separator matching Total column */}
                  <td className="py-1 px-0.5">
                    <div className="h-7 w-14 mx-auto rounded bg-muted/40" />
                  </td>
                  {AGE_COLS.map(col => (
                    <td key={`followup_${col.key}`} className="py-1 px-0.5">
                      <Input type="number" inputMode="numeric" min={0}
                        value={other[`${v.key}_followup_${col.key}`] || ''}
                        onChange={e => updateOther(`${v.key}_followup_${col.key}`, e.target.value)}
                        className="h-7 w-14 text-center text-xs mx-auto" />
                    </td>
                  ))}
                  {/* empty separator matching Total column */}
                  <td className="py-1 px-0.5">
                    <div className="h-7 w-14 mx-auto rounded bg-muted/40" />
                  </td>
                  <td className="py-1 px-0.5">
                    <div className="h-7 w-10 mx-auto rounded bg-muted/60 border border-dashed border-muted-foreground/20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
