import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MalnutritionChart({ lang, data, loading }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const empty = !loading && (!data || data.length === 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Malnutrition & SAM Cases Over Time', 'Malnutrition & cas MAS dans le temps')}
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
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="samGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="sam" stroke="#EF4444" fill="url(#samGrad)" strokeWidth={2} name={t('SAM', 'MAS')} />
                <Area type="monotone" dataKey="mam" stroke="#F59E0B" fill="url(#mamGrad)" strokeWidth={2} name={t('MAM', 'MAM')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
