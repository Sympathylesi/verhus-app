import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

const Empty = ({ lang }) => (
  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
    {lang === 'fr' ? 'Aucune donnée pour cette période' : 'No data for this period'}
  </div>
);

const sumDoseGroup = (doses, vaccine) =>
  Object.values(doses[vaccine] || {}).reduce((a, b) => a + (b || 0), 0);

export default function DropoutRateChart({ lang, data, loading }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const empty = !loading && (!data || data.length === 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Vaccine Dropout Rates (%)', 'Taux d\'abandon vaccinal (%)')}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          {t('Penta1→Penta3 and MCV1→MCV2 — lower is better', 'Penta1→Penta3 et MCV1→MCV2 — plus bas = mieux')}
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-muted animate-pulse rounded" />
        ) : empty ? (
          <Empty lang={lang} />
        ) : (
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[-20, 'auto']} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: '0%', fontSize: 10, fill: '#94A3B8' }} />
                <ReferenceLine y={10} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: '10%', fontSize: 10, fill: '#F59E0B' }} />
                <Line type="monotone" dataKey="pentaDropout" stroke="#EF4444" strokeWidth={2} dot={false} name={t('Penta1→3 dropout', 'Abandon Penta1→3')} />
                <Line type="monotone" dataKey="mcvDropout"   stroke="#8B5CF6" strokeWidth={2} dot={false} name={t('MCV1→2 dropout',  'Abandon MCV1→2')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
