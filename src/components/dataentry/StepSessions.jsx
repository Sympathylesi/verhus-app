import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const DATE_FIELDS = [
  { key: 'start_date',       label: { en: 'Start Date',        fr: 'Date de début' } },
  { key: 'end_date',         label: { en: 'End Date',          fr: 'Date de fin' } },
  { key: 'date_of_session',  label: { en: 'Date of Session',   fr: 'Date de session' } },
  { key: 'date_received',    label: { en: 'Date Received',     fr: 'Date de réception' } },
];

export default function StepSessions({ lang, data, setData }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const session_dates = data.session_dates || {};

  const update = (key, value) =>
    setData(prev => ({ ...prev, session_dates: { ...(prev.session_dates || {}), [key]: value } }));

  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t('Session Dates', 'Dates de session')}</span>
          </div>
          {DATE_FIELDS.map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{f.label[lang]}</Label>
              <Input
                type="date"
                value={session_dates[f.key] || ''}
                onChange={e => update(f.key, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
