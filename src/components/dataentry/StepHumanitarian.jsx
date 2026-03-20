import React from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SERVICES = [
  { key: 'deworming',         label: 'Deworming' },
  { key: 'super_cereal',      label: 'Super Cereal' },
  { key: 'csb_plus',         label: 'CSB++' },
  { key: 'plumpy_nuts',       label: 'Plumpy Nuts' },
  { key: 'anc',               label: 'ANC',                noItems: true, noMale: true },
  { key: 'tetanus_toxoid',    label: 'Tetanus Toxoid',     noItems: true, noMale: true },
  { key: 'family_planning',   label: 'Family Planning' },
  { key: 'malaria_screening', label: 'Malaria Screening' },
  { key: 'basic_consultation',label: 'Basic Consultation', noItems: true },
  { key: 'llins',             label: 'LLINs' },
  { key: 'ors_zinc',          label: 'ORS/Zinc' },
  { key: 'wash',              label: 'WASH' },
  { key: 'gbv',               label: 'GBV' },
  { key: 'psea',              label: 'PSEA' },
  { key: 'dignity_kits',      label: 'Dignity Kits',       noMale: true },
  { key: 'asaq_fansida',      label: 'ASAQ/Fansida' },
];

export default function StepHumanitarian({ lang, data, setData }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const humanitarian = data.humanitarian || {};
  const hasIntegration = data.has_humanitarian || false;

  const update = (service, field, value) =>
    setData(prev => ({
      ...prev,
      humanitarian: {
        ...prev.humanitarian,
        [service]: {
          ...(prev.humanitarian?.[service] || {}),
          [field]: ['items', 'male', 'female'].includes(field) ? (parseInt(value) || 0) : value
        }
      }
    }));

  const getRowTotal = (service) => {
    const s = humanitarian[service] || {};
    return (s.items || 0) + (s.male || 0) + (s.female || 0);
  };

  const anyData = SERVICES.some(s => getRowTotal(s.key) > 0);

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg border">
        <div>
          <p className="text-sm font-medium">{t('Was there humanitarian integration?', 'Y avait-il une intégration humanitaire ?')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('Only enable if integrated services were provided', 'Activer uniquement si des services intégrés ont été fournis')}</p>
        </div>
        <Switch
          checked={hasIntegration}
          onCheckedChange={v => setData(prev => ({ ...prev, has_humanitarian: v }))}
        />
      </div>

      {hasIntegration && (
        <>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground w-8" rowSpan={2}>N°</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[130px]" rowSpan={2}>
                      {t('Integrated Services', 'Services intégrés')}
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap" rowSpan={2}>
                      {t('Nb. Items', 'Nb. articles')}
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground" colSpan={2}>
                      {t('Number of Beneficiary', 'Nombre de bénéficiaires')}
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[140px]" rowSpan={2}>
                      {t('Humanitarian Actor', 'Acteur humanitaire')}
                    </th>
                  </tr>
                  <tr className="border-b bg-muted/20">
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">{t('Male', 'Homme')}</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">{t('Female', 'Femme')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map((svc, i) => {
                    const row = humanitarian[svc.key] || {};
                    const hasValue = (row.items || 0) + (row.male || 0) + (row.female || 0) > 0;
                    const shade = () => <div className="h-7 w-16 mx-auto rounded bg-muted/60 border border-dashed border-muted-foreground/20" />;
                    return (
                      <tr key={svc.key} className={cn(
                        'border-b last:border-0',
                        hasValue && 'bg-teal-50/40 dark:bg-teal-950/10'
                      )}>
                        <td className="py-1.5 px-2 text-center text-muted-foreground">{i + 1}</td>
                        <td className="py-1.5 px-3 font-medium">{svc.label}</td>
                        <td className="py-1.5 px-1">
                          {svc.noItems ? shade() : (
                            <Input type="number" inputMode="numeric" min={0}
                              value={row.items || ''}
                              onChange={e => update(svc.key, 'items', e.target.value)}
                              className="h-7 w-16 text-center mx-auto" />
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          {svc.noMale ? shade() : (
                            <Input type="number" inputMode="numeric" min={0}
                              value={row.male || ''}
                              onChange={e => update(svc.key, 'male', e.target.value)}
                              className="h-7 w-16 text-center mx-auto" />
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          {svc.noFemale ? shade() : (
                            <Input type="number" inputMode="numeric" min={0}
                              value={row.female || ''}
                              onChange={e => update(svc.key, 'female', e.target.value)}
                              className="h-7 w-16 text-center mx-auto" />
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          <Input
                            value={row.actor || ''}
                            onChange={e => update(svc.key, 'actor', e.target.value)}
                            placeholder={t('Actor name…', 'Nom acteur…')}
                            className="h-7 text-xs" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
