import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TopBottomAreas({ lang, data, loading }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const { top5 = [], bottom5 = [] } = data || {};

  const chartData = [
    ...top5.map(d => ({ ...d, tier: 'top' })),
    ...bottom5.map(d => ({ ...d, tier: 'bottom' })),
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Top 5 / Bottom 5 Health Areas (Children Vaccinated)', 'Top 5 / Bas 5 Aires de santé (Enfants vaccinés)')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-muted animate-pulse rounded" />
        ) : (
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="children" radius={[0, 4, 4, 0]} name={t('Children', 'Enfants')}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.tier === 'top' ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
