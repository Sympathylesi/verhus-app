import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { usePeriod } from '@/lib/PeriodContext';
import { cn } from '@/lib/utils';

function generateWeekOptions(year) {
  return Array.from({ length: 52 }, (_, i) => ({
    value: `${year}-W${i + 1}`,
    label: `W${i + 1} – ${year}`,
  }));
}

export default function PeriodSelector({ lang }) {
  const { periodMode, setPeriodMode, selectedWeek, setSelectedWeek, dateRange, setDateRange } = usePeriod();
  const now = new Date();
  const weekOptions = generateWeekOptions(now.getFullYear());
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const modeBtn = (mode, label) => (
    <button
      onClick={() => setPeriodMode(mode)}
      className={cn(
        'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
        periodMode === mode
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2 py-1">
      {modeBtn('week', t('Week', 'Sem.'))}
      {modeBtn('range', t('Range', 'Plage'))}
      {modeBtn('all', t('All', 'Tout'))}

      {periodMode === 'week' && (
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-28 h-7 text-xs border-0 bg-transparent shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {periodMode === 'range' && (
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dateRange.from}
            onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
            className="h-7 w-32 text-xs border-0 bg-transparent shadow-none p-1"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="date"
            value={dateRange.to}
            onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
            className="h-7 w-32 text-xs border-0 bg-transparent shadow-none p-1"
          />
        </div>
      )}

      {periodMode === 'all' && (
        <span className="text-xs text-muted-foreground px-1">{t('All records', 'Tous les enreg.')}</span>
      )}
    </div>
  );
}
