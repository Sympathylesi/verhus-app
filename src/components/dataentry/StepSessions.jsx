import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

function isoWeekToMonday(year, week) {
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dow + 1 + (week - 1) * 7);
  return monday;
}
function toDateStr(d) { return d.toISOString().slice(0, 10); }

const DATE_FIELDS = [
  { key: 'start_date',      label: { en: 'Start Date',      fr: 'Date de début' } },
  { key: 'end_date',        label: { en: 'End Date',         fr: 'Date de fin' } },
  { key: 'date_of_session', label: { en: 'Date of Session',  fr: 'Date de session' } },
  { key: 'date_received',   label: { en: 'Date Received',    fr: 'Date de réception' } },
];

const STRATEGIES = [
  { key: 'mobile',   label: { en: 'Mobile',   fr: 'Mobile' } },
  { key: 'outreach', label: { en: 'Outreach', fr: 'Avancée' } },
  { key: 'fixed',    label: { en: 'Fixed',    fr: 'Fixe' } },
];

const DELIVERY_APPROACHES = [
  { key: 'door_to_door',      label: { en: 'Door to Door',           fr: 'Porte-à-porte' } },
  { key: 'quick_in_out',      label: { en: 'Quick-In and Quick-Out', fr: 'Entrée-sortie rapide' } },
  { key: 'temporal_fix_post', label: { en: 'Temporal Fix Post',      fr: 'Poste fixe temporaire' } },
];

export default function StepSessions({ lang, data, setData, selectedWeek }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const session_dates = data.session_dates || {};

  useEffect(() => {
    if (!selectedWeek) return;
    const [yearStr, wStr] = selectedWeek.split('-W');
    const year = parseInt(yearStr), week = parseInt(wStr);
    if (!year || !week) return;
    const monday = isoWeekToMonday(year, week);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    setData(prev => {
      const sd = prev.session_dates || {};
      if (sd.start_date && sd.end_date) return prev;
      return { ...prev, session_dates: { ...sd, start_date: sd.start_date || toDateStr(monday), end_date: sd.end_date || toDateStr(sunday) } };
    });
  }, [selectedWeek]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDate = (key, value) =>
    setData(prev => ({ ...prev, session_dates: { ...(prev.session_dates || {}), [key]: value } }));

  const updateStrategy = (key) =>
    setData(prev => ({ ...prev, strategy: key }));

  const updateDelivery = (key) =>
    setData(prev => ({ ...prev, delivery_approach: key }));

  const updateSessions = (type, value) =>
    setData(prev => ({ ...prev, sessions_count: { ...(prev.sessions_count || {}), [type]: parseInt(value) || 0 } }));

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Dates */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t('Session Dates', 'Dates de session')}</span>
            {selectedWeek && (
              <span className="ml-auto text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {t('Reporting period:', 'Période de rapport :')} {selectedWeek}
              </span>
            )}
          </div>
          {DATE_FIELDS.map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{f.label[lang]}</Label>
              <Input type="date" value={session_dates[f.key] || ''} onChange={e => updateDate(f.key, e.target.value)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strategy */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <span className="text-sm font-semibold">{t('Strategy', 'Stratégie')}</span>
          <div className="flex flex-wrap gap-2">
            {STRATEGIES.map(s => (
              <button key={s.key} type="button" onClick={() => updateStrategy(s.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  data.strategy === s.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                )}>
                {s.label[lang]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Approach */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <span className="text-sm font-semibold">{t('Delivery Approach', 'Approche de prestation')}</span>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_APPROACHES.map(d => (
              <button key={d.key} type="button" onClick={() => updateDelivery(d.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  data.delivery_approach === d.key
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                )}>
                {d.label[lang]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session counts per strategy */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <span className="text-sm font-semibold">{t('Number of Sessions', 'Nombre de séances')}</span>
          <div className="grid grid-cols-3 gap-3">
            {STRATEGIES.map(s => (
              <div key={s.key}>
                <Label className="text-xs text-muted-foreground">{s.label[lang]}</Label>
                <Input type="number" inputMode="numeric" min={0}
                  value={data.sessions_count?.[s.key] || ''}
                  onChange={e => updateSessions(s.key, e.target.value)}
                  className="mt-1 h-9" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
