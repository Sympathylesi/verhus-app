import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const sessionTypes = [
  { key: 'mobile',       label: { en: 'Mobile',       fr: 'Mobile' } },
  { key: 'outreach',     label: { en: 'Outreach',     fr: 'Avancée' } },
  { key: 'fixed',        label: { en: 'Fixed',        fr: 'Fixe' } },
  { key: 'door_to_door', label: { en: 'Door-to-Door', fr: 'Porte-à-porte' } },
];

const ageBands = [
  { key: '0_11m',  label: '0–11m' },
  { key: '12_23m', label: '12–23m' },
  { key: '24_59m', label: '24–59m' },
];

const genders = [
  { key: 'male',   label: 'M' },
  { key: 'female', label: 'F' },
];

export default function StepSessions({ lang, data, setData }) {
  const [activeTab, setActiveTab] = useState('mobile');
  const sessions = data.vaccination_sessions || {};
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const update = (type, ageGender, value) => {
    setData(prev => ({
      ...prev,
      vaccination_sessions: {
        ...prev.vaccination_sessions,
        [type]: { ...(prev.vaccination_sessions?.[type] || {}), [ageGender]: parseInt(value) || 0 }
      }
    }));
  };

  const getTypeTotal = (type) => {
    const s = sessions[type] || {};
    return Object.values(s).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
  };

  const grandTotal = sessionTypes.reduce((s, st) => s + getTypeTotal(st.key), 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {sessionTypes.map(st => {
          const total = getTypeTotal(st.key);
          return (
            <button
              key={st.key}
              onClick={() => setActiveTab(st.key)}
              className={cn(
                'rounded-lg p-3 text-left transition-colors border',
                activeTab === st.key
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/40 border-transparent hover:bg-muted'
              )}
            >
              <p className="text-xs text-muted-foreground font-medium">{st.label[lang]}</p>
              <p className={cn('text-xl font-bold mt-0.5', total > 0 ? 'text-foreground' : 'text-muted-foreground/40')}>{total}</p>
            </button>
          );
        })}
      </div>

      {/* Active session grid */}
      {sessionTypes.filter(st => st.key === activeTab).map(st => (
        <Card key={st.key}>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground w-20">
                    {t('Age', 'Âge')}
                  </th>
                  {genders.map(g => (
                    <th key={g.key} className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">
                      {g.label}
                    </th>
                  ))}
                  <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">
                    {t('Sub-total', 'Sous-total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ageBands.map(ab => {
                  const mVal = sessions[st.key]?.[`${ab.key}_male`] || 0;
                  const fVal = sessions[st.key]?.[`${ab.key}_female`] || 0;
                  const rowTotal = mVal + fVal;
                  return (
                    <tr key={ab.key} className={cn('border-b last:border-0', rowTotal > 0 && 'bg-emerald-50/30 dark:bg-emerald-950/10')}>
                      <td className="py-2 pr-4 font-medium text-xs">{ab.label}</td>
                      {genders.map(g => (
                        <td key={g.key} className="py-2 px-2">
                          <Input
                            type="number" inputMode="numeric" min={0}
                            value={sessions[st.key]?.[`${ab.key}_${g.key}`] || ''}
                            onChange={e => update(st.key, `${ab.key}_${g.key}`, e.target.value)}
                            className="h-9 w-24 text-center mx-auto"
                          />
                        </td>
                      ))}
                      <td className={cn('py-2 px-2 text-center font-bold text-sm', rowTotal > 0 ? 'text-primary' : 'text-muted-foreground/40')}>
                        {rowTotal || '–'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 border-t-2">
                  <td className="py-2.5 pr-4 font-bold text-xs">{t('Total', 'Total')}</td>
                  {genders.map(g => {
                    const colTotal = ageBands.reduce((s, ab) => s + (sessions[st.key]?.[`${ab.key}_${g.key}`] || 0), 0);
                    return (
                      <td key={g.key} className="py-2.5 px-2 text-center font-bold text-primary">{colTotal || '–'}</td>
                    );
                  })}
                  <td className="py-2.5 px-2 text-center font-bold text-primary text-base">{getTypeTotal(st.key) || '–'}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      ))}

      {/* Grand total */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg border">
        <span className="text-sm font-medium">{t('Total children across all strategies', 'Total enfants toutes stratégies')}</span>
        <span className="text-2xl font-bold text-primary">{grandTotal}</span>
      </div>
    </div>
  );
}
