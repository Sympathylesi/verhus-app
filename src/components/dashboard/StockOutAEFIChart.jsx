import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const Empty = ({ lang }) => (
  <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
    {lang === 'fr' ? 'Aucun incident signalé cette semaine' : 'No incidents reported this week'}
  </div>
);

export default function StockOutAEFIChart({ lang, entries }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  // Aggregate per health area
  const map = {};
  (entries || []).forEach(e => {
    const name = (e.health_area_name || 'Unknown').substring(0, 14);
    if (!map[name]) map[name] = { name, stockOut: 0, aefi: 0 };
    const scr = e.screening || {};
    if (scr.stock_out) map[name].stockOut += 1;
    map[name].aefi += (scr.adverse_events || 0);
  });

  const data = Object.values(map)
    .filter(d => d.stockOut > 0 || d.aefi > 0)
    .sort((a, b) => (b.stockOut + b.aefi) - (a.stockOut + a.aefi))
    .slice(0, 10);

  // Summary stats for subtitle
  const totalStockOut = Object.values(map).filter(d => d.stockOut > 0).length;
  const totalAEFI     = Object.values(map).reduce((s, d) => s + d.aefi, 0);

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold">
          {t('Stock-Outs & AEFI', 'Ruptures de stock & MAPI')}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          {totalStockOut > 0
            ? t(`${totalStockOut} area(s) with stock-out · ${totalAEFI} AEFI reported`, `${totalStockOut} aire(s) en rupture · ${totalAEFI} MAPI signalés`)
            : t(`No stock-outs · ${totalAEFI} AEFI reported`, `Aucune rupture · ${totalAEFI} MAPI signalés`)}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? <Empty lang={lang} /> : (
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="stockOut" fill="#EF4444" radius={[0, 3, 3, 0]} name={t('Stock-Out', 'Rupture')} />
                <Bar dataKey="aefi"     fill="#F59E0B" radius={[0, 3, 3, 0]} name="AEFI / MAPI" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
