import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const malGrid = [
  { label: { en: 'SAM 0-11m Male', fr: 'MAS 0-11m Garçon' }, key: 'sam_male_0_11' },
  { label: { en: 'SAM 0-11m Female', fr: 'MAS 0-11m Fille' }, key: 'sam_female_0_11' },
  { label: { en: 'SAM 12-23m Male', fr: 'MAS 12-23m Garçon' }, key: 'sam_male_12_23' },
  { label: { en: 'SAM 12-23m Female', fr: 'MAS 12-23m Fille' }, key: 'sam_female_12_23' },
  { label: { en: 'MAM 0-11m Male', fr: 'MAM 0-11m Garçon' }, key: 'mam_male_0_11' },
  { label: { en: 'MAM 0-11m Female', fr: 'MAM 0-11m Fille' }, key: 'mam_female_0_11' },
  { label: { en: 'MAM 12-23m Male', fr: 'MAM 12-23m Garçon' }, key: 'mam_male_12_23' },
  { label: { en: 'MAM 12-23m Female', fr: 'MAM 12-23m Fille' }, key: 'mam_female_12_23' },
];

export default function StepScreening({ lang, data, setData }) {
  const screening = data.screening || {};

  const update = (key, value) => {
    setData(prev => ({ ...prev, screening: { ...prev.screening, [key]: value } }));
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === 'en' ? 'Malnutrition Screening' : 'Dépistage malnutrition'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {malGrid.map(field => (
              <div key={field.key}>
                <Label className="text-[11px] text-muted-foreground">{field.label[lang]}</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={screening[field.key] || ''}
                  onChange={e => update(field.key, parseInt(e.target.value) || 0)}
                  className="mt-1 h-9"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === 'en' ? 'Other Indicators' : 'Autres indicateurs'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{lang === 'en' ? 'Disability cases' : 'Cas de handicap'}</Label>
              <Input
                type="number"
                min={0}
                value={screening.disability_count || ''}
                onChange={e => update('disability_count', parseInt(e.target.value) || 0)}
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-xs">{lang === 'en' ? 'Serious adverse events' : 'Événements indésirables graves'}</Label>
              <Input
                type="number"
                min={0}
                value={screening.adverse_events || ''}
                onChange={e => update('adverse_events', parseInt(e.target.value) || 0)}
                className="mt-1 h-9"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-sm">{lang === 'en' ? 'Stock-out reported?' : 'Rupture de stock ?'}</Label>
            <Switch checked={screening.stock_out || false} onCheckedChange={v => update('stock_out', v)} />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-sm">{lang === 'en' ? 'Refrigerator functional?' : 'Réfrigérateur fonctionnel ?'}</Label>
            <Switch checked={screening.fridge_functional !== false} onCheckedChange={v => update('fridge_functional', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}