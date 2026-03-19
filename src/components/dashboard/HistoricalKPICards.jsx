import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Syringe, ShieldCheck, AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const cards = [
  { key: 'children',     icon: Users,          label: { en: 'Children Vaccinated', fr: 'Enfants vaccinés' },       color: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-950/30' },
  { key: 'doses',        icon: Syringe,         label: { en: 'Total Doses',         fr: 'Doses totales' },           color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { key: 'dtp3',         icon: ShieldCheck,     label: { en: 'DTP3 Coverage',       fr: 'Couverture DTP3' },         color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', pct: true },
  { key: 'mcv2',         icon: ShieldCheck,     label: { en: 'MCV2 Coverage',       fr: 'Couverture MCV2' },         color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/30',  pct: true },
  { key: 'sam',          icon: AlertTriangle,   label: { en: 'SAM Cases',           fr: 'Cas MAS' },                 color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-950/30' },
  { key: 'humanitarian', icon: Package,         label: { en: 'Humanitarian Items',  fr: 'Articles humanitaires' },   color: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-950/30' },
];

export default function HistoricalKPICards({ lang, kpis, prevKpis, loading }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map(card => {
        const val  = kpis?.[card.key]     ?? 0;
        const prev = prevKpis?.[card.key] ?? 0;
        const trend = prev > 0 ? ((val - prev) / prev * 100).toFixed(1) : null;
        const up = Number(trend) > 0;
        return (
          <Card key={card.key} className="p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full ${card.bg} opacity-60 group-hover:scale-110 transition-transform`} />
            <div className="relative">
              <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              {loading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-1" />
              ) : (
                <p className="text-2xl font-bold tracking-tight">
                  {card.pct ? `${val}%` : val.toLocaleString()}
                </p>
              )}
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{card.label[lang]}</p>
                {!loading && trend !== null && (
                  <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', up ? 'text-emerald-600' : 'text-red-500')}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
