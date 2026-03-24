import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

const AGE_BANDS = [
  { key: '0_11m',  label: '0–11m' },
  { key: '12_23m', label: '12–23m' },
  { key: '24_59m', label: '24–59m' },
];

const MAL_TYPES = [
  { key: 'sam', label: 'SAM' },
  { key: 'mam', label: 'MAM' },
];

const GENDERS = [
  { key: 'male',   label: { en: 'M', fr: 'G' } },
  { key: 'female', label: { en: 'F', fr: 'F' } },
];

export default function StepScreening({ lang, data, setData }) {
  const screening = data.screening || {};
  const t = (en, fr) => lang === 'fr' ? fr : en;

  // Derive total children vaccinated from vaccine_doses (carried from StepDoses)
  const totalVaccinated = Object.values(data.vaccine_doses || {}).reduce((s, v) =>
    s + Object.values(v || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
  );

  // Screened total comes from Doses tab (synced), not re-entered here
  const totalScreened = data.screening?.screened_total ||
    MAL_TYPES.reduce((s, mt) =>
      s + AGE_BANDS.reduce((ss, ab) =>
        ss + GENDERS.reduce((sss, g) => sss + (screening[`${mt.key}_${g.key}_${ab.key}`] || 0), 0), 0), 0
    );

  const over = totalScreened > totalVaccinated && totalVaccinated > 0;

  const update = (key, value) =>
    setData(prev => ({ ...prev, screening: { ...prev.screening, [key]: value } }));

  return (
    <div className="space-y-5">
      {/* Children vaccinated banner — carried from doses step */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          'flex items-center justify-between px-4 py-3 rounded-lg border',
          over ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : 'bg-muted/50'
        )}>
          <div>
            <p className="text-sm font-medium">{t('Children vaccinated', 'Enfants vaccinés')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('from Doses step', 'depuis Doses')}</p>
          </div>
          <span className="text-2xl font-bold text-primary">{totalVaccinated || '–'}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
          <div>
            <p className="text-sm font-medium">{t('Screened for malnutrition', 'Dépistés malnutrition')}</p>
            <p className="text-xs text-blue-500 mt-0.5">{t('entered in Doses tab → locked here', 'saisi dans Doses → verrouillé ici')}</p>
          </div>
          <span className="text-2xl font-bold text-blue-600">{totalScreened || '–'}</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t('Malnutrition Screening', 'Dépistage malnutrition')}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('Screened', 'Dépistés')}:</span>
              <span className={cn('text-sm font-bold', over ? 'text-red-600' : totalScreened > 0 ? 'text-primary' : 'text-muted-foreground/40')}>
                {totalScreened || '–'}
              </span>
              {over && <span className="text-xs text-red-600">{t('exceeds vaccinated!', 'dépasse les vaccinés !')}</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t('Type', 'Type')}</th>
                {AGE_BANDS.map(ab =>
                  GENDERS.map(g => (
                    <th key={`${ab.key}_${g.key}`} className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">
                      {ab.label} {g.label[lang]}
                    </th>
                  ))
                )}
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {MAL_TYPES.map(mt => {
                const rowTotal = AGE_BANDS.reduce((s, ab) =>
                  s + GENDERS.reduce((ss, g) => ss + (screening[`${mt.key}_${g.key}_${ab.key}`] || 0), 0), 0
                );
                return (
                  <tr key={mt.key} className={cn('border-b last:border-0', rowTotal > 0 && 'bg-emerald-50/30 dark:bg-emerald-950/10')}>
                    <td className="py-2 px-3 font-semibold">{mt.label}</td>
                    {AGE_BANDS.map(ab =>
                      GENDERS.map(g => (
                        <td key={`${ab.key}_${g.key}`} className="py-1.5 px-1">
                          <Input
                            type="number" inputMode="numeric" min={0}
                            value={screening[`${mt.key}_${g.key}_${ab.key}`] || ''}
                            onChange={e => update(`${mt.key}_${g.key}_${ab.key}`, parseInt(e.target.value) || 0)}
                            className="h-8 w-16 text-center mx-auto"
                          />
                        </td>
                      ))
                    )}
                    <td className={cn('py-2 px-2 text-center font-bold', rowTotal > 0 ? 'text-primary' : 'text-muted-foreground/30')}>
                      {rowTotal || '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('Other Indicators', 'Autres indicateurs')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{t('Disability cases', 'Cas de handicap')}</Label>
              <Input type="number" min={0} value={screening.disability_count || ''}
                onChange={e => update('disability_count', parseInt(e.target.value) || 0)}
                className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">{t('Serious adverse events', 'Événements indésirables graves')}</Label>
              <Input type="number" min={0} value={screening.adverse_events || ''}
                onChange={e => update('adverse_events', parseInt(e.target.value) || 0)}
                className="mt-1 h-9" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm">{t('Stock-out reported?', 'Rupture de stock ?')}</Label>
            <Switch checked={screening.stock_out || false} onCheckedChange={v => update('stock_out', v)} />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm">{t('Refrigerator functional?', 'Réfrigérateur fonctionnel ?')}</Label>
            <Switch checked={screening.fridge_functional !== false} onCheckedChange={v => update('fridge_functional', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}