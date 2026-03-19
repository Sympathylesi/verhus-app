import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { usePeriod } from '@/lib/PeriodContext';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function HistoryDB() {
  const { lang } = useOutletContext();
  const { periodMode, selectedWeek, dateRange } = usePeriod();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortKey, setSortKey] = useState('year');
  const [sortDir, setSortDir] = useState('desc');

  // Fetch all entries — in a real app this would be paginated server-side
  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['entries-all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    let rows = allEntries;

    // Period filter
    if (periodMode === 'week') {
      const [yr, wk] = selectedWeek.split('-W');
      rows = rows.filter(e => e.year === parseInt(yr) && e.week_number === parseInt(wk));
    } else if (periodMode === 'range') {
      rows = rows.filter(e => {
        // Approximate: use year + week_number to compare against date range
        const entryDate = new Date(e.year, 0, 1 + (e.week_number - 1) * 7);
        return entryDate >= new Date(dateRange.from) && entryDate <= new Date(dateRange.to);
      });
    }
    // 'all' → no filter

    // Search
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(e =>
        e.district?.toLowerCase().includes(q) ||
        e.health_area_name?.toLowerCase().includes(q) ||
        String(e.week_number).includes(q) ||
        String(e.year).includes(q)
      );
    }

    // Sort
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [allEntries, periodMode, selectedWeek, dateRange, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const SortTh = ({ col, label }) => (
    <th
      className="text-left py-3 px-3 font-medium text-xs cursor-pointer select-none hover:text-foreground whitespace-nowrap"
      onClick={() => toggleSort(col)}
    >
      {label} {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
          <Database className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('History & Main Database', 'Historique & Base principale')}</h1>
          <p className="text-xs text-muted-foreground">
            {isLoading ? '…' : `${filtered.length.toLocaleString()} ${t('records', 'enregistrements')}`}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search district, health area, week…', 'Rechercher district, aire, semaine…')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(n => (
              <SelectItem key={n} value={String(n)}>{n} / {t('page', 'page')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <SortTh col="year" label={t('Year', 'Année')} />
                <SortTh col="week_number" label={t('Week', 'Sem.')} />
                <SortTh col="district" label={t('District', 'District')} />
                <SortTh col="health_area_name" label={t('Health Area', 'Aire de santé')} />
                <SortTh col="total_children_vaccinated" label={t('Children', 'Enfants')} />
                <SortTh col="dtp3_count" label="DTP3" />
                <SortTh col="mcv2_count" label="MCV2" />
                <SortTh col="total_doses_administered" label={t('Doses', 'Doses')} />
                <SortTh col="status" label="Status" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="border-b animate-pulse">
                    {Array(9).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-3"><div className="h-4 bg-muted rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-muted-foreground">
                    {t('No records found', 'Aucun enregistrement trouvé')}
                  </td>
                </tr>
              ) : pageRows.map((e, i) => (
                <tr key={e.id ?? i} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 text-muted-foreground">{e.year}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">W{e.week_number}</td>
                  <td className="py-2.5 px-3">{e.district || '–'}</td>
                  <td className="py-2.5 px-3 font-medium">{e.health_area_name || '–'}</td>
                  <td className="py-2.5 px-3 text-right">{(e.total_children_vaccinated || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right">{(e.dtp3_count || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right">{(e.mcv2_count || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right">{(e.total_doses_administered || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    {e.status ? (
                      <Badge className={`text-[10px] ${statusColors[e.status] || ''}`}>{e.status}</Badge>
                    ) : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground text-xs">
          {t('Page', 'Page')} {page} / {totalPages} — {filtered.length.toLocaleString()} {t('total', 'total')}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 text-xs border rounded-md bg-muted">{page}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</Button>
        </div>
      </div>
    </div>
  );
}
