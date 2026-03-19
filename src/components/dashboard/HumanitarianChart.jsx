import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HumanitarianChart({ lang, data, loading }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const empty = !loading && (!data || data.length === 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Humanitarian Items Distributed vs Vaccination Sessions', 'Articles humanitaires distribués vs sessions de vaccination')}
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
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="humanitarian" fill="#14B8A6" radius={[2, 2, 0, 0]} name={t('Humanitarian Items', 'Articles humanitaires')} />
                <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#F59E0B" strokeWidth={2} dot={false} name={t('Sessions', 'Sessions')} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
