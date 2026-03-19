import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileJson, FileText, FileDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePeriod } from '@/lib/PeriodContext';

const CSV_COLUMNS = [
  'year', 'week_number', 'district', 'health_area_name',
  'total_children_vaccinated', 'dtp3_count', 'mcv2_count',
  'total_doses_administered', 'status',
];

export default function ExportsMigration() {
  const { lang } = useOutletContext();
  const { periodMode, selectedWeek, dateRange } = usePeriod();
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const [exporting, setExporting] = useState(null);

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['entries-all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

  const entries = useMemo(() => {
    if (periodMode === 'week') {
      const [yr, wk] = selectedWeek.split('-W');
      return allEntries.filter(e => e.year === parseInt(yr) && e.week_number === parseInt(wk));
    }
    if (periodMode === 'range') {
      return allEntries.filter(e => {
        const d = new Date(e.year, 0, 1 + (e.week_number - 1) * 7);
        return d >= new Date(dateRange.from) && d <= new Date(dateRange.to);
      });
    }
    return allEntries;
  }, [allEntries, periodMode, selectedWeek, dateRange]);

  const periodLabel = periodMode === 'week'
    ? selectedWeek
    : periodMode === 'range'
      ? `${dateRange.from}_${dateRange.to}`
      : 'all';

  const downloadBlob = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = async () => {
    setExporting('csv');
    try {
      const rows = entries.map(e => CSV_COLUMNS.map(k => JSON.stringify(e[k] ?? '')).join(','));
      const csv = [CSV_COLUMNS.join(','), ...rows].join('\n');
      downloadBlob(csv, `VERHUS_${periodLabel}.csv`, 'text/csv');
      toast.success(t('CSV exported!', 'CSV exporté !'));
    } finally { setExporting(null); }
  };

  const exportJSON = async () => {
    setExporting('json');
    try {
      downloadBlob(JSON.stringify(entries, null, 2), `VERHUS_${periodLabel}.json`, 'application/json');
      toast.success(t('JSON exported!', 'JSON exporté !'));
    } finally { setExporting(null); }
  };

  const exportFullCSV = async () => {
    setExporting('full');
    try {
      if (allEntries.length === 0) { toast.error(t('No data', 'Aucune donnée')); return; }
      const allKeys = [...new Set(allEntries.flatMap(e => Object.keys(e)))];
      const rows = allEntries.map(e => allKeys.map(k => JSON.stringify(e[k] ?? '')).join(','));
      const csv = [allKeys.join(','), ...rows].join('\n');
      downloadBlob(csv, `VERHUS_FULL_DB_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
      toast.success(t(`Full DB exported (${allEntries.length} rows, ${allKeys.length} cols)`, `BD complète exportée (${allEntries.length} lignes, ${allKeys.length} cols)`));
    } finally { setExporting(null); }
  };

  const exportOptions = [
    {
      id: 'csv',
      icon: FileText,
      title: t('Filtered CSV', 'CSV filtré'),
      desc: t(`Export ${entries.length} filtered records as CSV (${CSV_COLUMNS.length} columns)`, `Exporter ${entries.length} enregistrements filtrés en CSV (${CSV_COLUMNS.length} colonnes)`),
      action: exportCSV,
      color: 'bg-sky-50 dark:bg-sky-950/30 text-sky-500',
    },
    {
      id: 'json',
      icon: FileJson,
      title: t('Filtered JSON', 'JSON filtré'),
      desc: t(`Export ${entries.length} filtered records as JSON (all fields)`, `Exporter ${entries.length} enregistrements filtrés en JSON (tous les champs)`),
      action: exportJSON,
      color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500',
    },
    {
      id: 'full',
      icon: FileDown,
      title: t('Full Database CSV', 'CSV base complète'),
      desc: t(`Export entire main DB (${allEntries.length} rows × all columns) — may be large`, `Exporter toute la BD principale (${allEntries.length} lignes × toutes colonnes) — peut être volumineux`),
      action: exportFullCSV,
      color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
          <FileDown className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('Exports & Migration', 'Exports & Migration')}</h1>
          <p className="text-xs text-muted-foreground">
            {isLoading ? '…' : `${allEntries.length.toLocaleString()} ${t('total records in DB', 'enregistrements totaux en BD')}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-xs">
        <Badge variant="outline" className="gap-1.5 py-1 px-3">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          {t('Filtered view:', 'Vue filtrée :')} {entries.length.toLocaleString()} {t('records', 'enreg.')}
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1 px-3">
          {t('Full DB:', 'BD complète :')} {allEntries.length.toLocaleString()} {t('records', 'enreg.')}
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1 px-3">
          {t('Period:', 'Période :')} {periodLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportOptions.map(opt => (
          <Card key={opt.id} className="flex flex-col">
            <CardContent className="pt-5 flex-1 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${opt.color}`}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </div>
              <Button
                onClick={opt.action}
                disabled={isLoading || exporting !== null}
                className="mt-auto gap-2 w-full"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                {exporting === opt.id ? t('Exporting…', 'Export…') : t('Download', 'Télécharger')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Migration note */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {t('Migration Notes', 'Notes de migration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• {t('Full CSV export includes all 200+ columns from the main database.', 'L\'export CSV complet inclut toutes les 200+ colonnes de la base principale.')}</p>
          <p>• {t('Use the period selector in the header to narrow exports to a specific time window.', 'Utilisez le sélecteur de période dans l\'en-tête pour limiter les exports à une fenêtre temporelle.')}</p>
          <p>• {t('JSON exports preserve nested structures (vaccination_sessions, vaccine_doses).', 'Les exports JSON préservent les structures imbriquées (vaccination_sessions, vaccine_doses).')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
