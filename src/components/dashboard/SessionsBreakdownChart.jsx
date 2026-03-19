import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { mobile: '#0EA5E9', outreach: '#10B981', fixed: '#8B5CF6', door_to_door: '#F59E0B' };
const LABELS = {
  mobile:      { en: 'Mobile',       fr: 'Mobile' },
  outreach:    { en: 'Outreach',     fr: 'Sensibilisation' },
  fixed:       { en: 'Fixed',        fr: 'Fixe' },
  door_to_door:{ en: 'Door-to-door', fr: 'Porte-à-porte' },
};

const Empty = ({ lang }) => (
  <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
    {lang === 'fr' ? 'Aucune donnée pour cette semaine' : 'No data for this week'}
  </div>
);

export default function SessionsBreakdownChart({ lang, entries }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const totals = { mobile: 0, outreach: 0, fixed: 0, door_to_door: 0 };
  (entries || []).forEach(e => {
    const vs = e.vaccination_sessions || {};
    Object.keys(totals).forEach(type => {
      const grp = vs[type] || {};
      totals[type] += Object.values(grp).reduce((a, b) => a + (b || 0), 0);
    });
  });

  const data = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: LABELS[key][lang], value, color: COLORS[key] }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Session Types', 'Types de sessions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? <Empty lang={lang} /> : (
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
