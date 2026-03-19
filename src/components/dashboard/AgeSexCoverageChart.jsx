import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Empty = ({ lang }) => (
  <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
    {lang === 'fr' ? 'Aucune donnée pour cette semaine' : 'No data for this week'}
  </div>
);

// Key vaccines to show age-sex breakdown for
const VACCINES = ['Penta1', 'Penta3', 'MCV1', 'MCV2'];

export default function AgeSexCoverageChart({ lang, entries }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const totals = {};
  VACCINES.forEach(v => {
    totals[v] = { male_0_11: 0, female_0_11: 0, male_12_23: 0, female_12_23: 0, male_24_59: 0, female_24_59: 0 };
  });

  (entries || []).forEach(e => {
    const doses = e.vaccine_doses || {};
    VACCINES.forEach(v => {
      const vd = doses[v] || {};
      totals[v].male_0_11   += (vd['0_11m_male']    || 0);
      totals[v].female_0_11 += (vd['0_11m_female']  || 0);
      totals[v].male_12_23  += (vd['12_23m_male']   || 0);
      totals[v].female_12_23+= (vd['12_23m_female'] || 0);
      totals[v].male_24_59  += (vd['24_59m_male']   || 0);
      totals[v].female_24_59+= (vd['24_59m_female'] || 0);
    });
  });

  const data = VACCINES.map(v => ({
    vaccine: v,
    [t('0-11m M', '0-11m G')]:   totals[v].male_0_11,
    [t('0-11m F', '0-11m F')]:   totals[v].female_0_11,
    [t('12-23m M', '12-23m G')]: totals[v].male_12_23,
    [t('12-23m F', '12-23m F')]: totals[v].female_12_23,
    [t('24-59m M', '24-59m G')]: totals[v].male_24_59,
    [t('24-59m F', '24-59m F')]: totals[v].female_24_59,
  }));

  const hasData = data.some(d => Object.values(d).slice(1).some(v => v > 0));

  const bars = [
    { key: t('0-11m M', '0-11m G'),   color: '#0EA5E9' },
    { key: t('0-11m F', '0-11m F'),   color: '#7DD3FC' },
    { key: t('12-23m M', '12-23m G'), color: '#10B981' },
    { key: t('12-23m F', '12-23m F'), color: '#6EE7B7' },
    { key: t('24-59m M', '24-59m G'), color: '#8B5CF6' },
    { key: t('24-59m F', '24-59m F'), color: '#C4B5FD' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('Age & Sex Breakdown', 'Répartition par âge et sexe')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? <Empty lang={lang} /> : (
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="vaccine" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {bars.map(b => (
                  <Bar key={b.key} dataKey={b.key} fill={b.color} stackId="a" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
