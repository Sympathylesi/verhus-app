import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const Empty = ({ lang }) => (
  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
    {lang === 'fr' ? 'Aucune donnée pour cette période' : 'No data for this period'}
  </div>
);

export default function HumanitarianChart({ lang, entries }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  // Build per-week data from raw entries array
  const weekMap = {};
  (entries || []).forEach(e => {
    const key = `W${e.week_number}`;
    if (!weekMap[key]) weekMap[key] = { week: key, humanitarian: 0, children: 0 };
    const hi = e.humanitarian_items || {};
    weekMap[key].humanitarian += Object.values(hi).reduce((a, b) => a + (b || 0), 0);
    weekMap[key].children += (e.total_children_vaccinated || 0);
  });

  const data = Object.values(weekMap)
    .sort((a, b) => parseInt(a.week.slice(1)) - parseInt(b.week.slice(1)))
    .slice(-16);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Humanitarian Integration vs Children Vaccinated', 'Intégration humanitaire vs Enfants vaccinés')}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          {t('Weekly humanitarian items distributed alongside vaccinations', 'Articles humanitaires distribués avec les vaccinations par semaine')}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? <Empty lang={lang} /> : (
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  yAxisId="left"
                  dataKey="humanitarian"
                  fill="#f59e0b"
                  opacity={0.8}
                  radius={[3, 3, 0, 0]}
                  name={t('Humanitarian Items', 'Articles humanitaires')}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="children"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={t('Children Vaccinated', 'Enfants vaccinés')}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
