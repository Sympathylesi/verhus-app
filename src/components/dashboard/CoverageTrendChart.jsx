import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

export default function CoverageTrendChart({ lang, data, loading }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const empty = !loading && (!data || data.length === 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Vaccine Coverage Trends (%)', 'Tendances de couverture vaccinale (%)')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-muted animate-pulse rounded" />
        ) : empty ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            {t('No data for this period', 'Aucune donnée pour cette période')}
          </div>
        ) : (
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={80} stroke="#10B981" strokeDasharray="5 3" label={{ value: '80% target', position: 'insideTopRight', fontSize: 10, fill: '#10B981' }} />
                <Line type="monotone" dataKey="dtp3" stroke="#10B981" strokeWidth={2} dot={false} name="DTP3" />
                <Line type="monotone" dataKey="mcv1" stroke="#0EA5E9" strokeWidth={2} dot={false} name="MCV1" />
                <Line type="monotone" dataKey="mcv2" stroke="#8B5CF6" strokeWidth={2} dot={false} name="MCV2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
