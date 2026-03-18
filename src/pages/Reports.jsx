import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Table2 } from 'lucide-react';

export default function Reports() {
  const { lang, selectedWeek } = useOutletContext();
  const [year, weekStr] = selectedWeek.split('-W');
  const weekNum = parseInt(weekStr);

  const { data: entries = [] } = useQuery({
    queryKey: ['entries', year, weekNum],
    queryFn: () => base44.entities.WeeklyEntry.filter({ year: parseInt(year), week_number: weekNum }),
  });

  const submitted = entries.filter(e => e.status === 'submitted' || e.status === 'approved');
  const drafts = entries.filter(e => e.status === 'draft');

  const exportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['District', 'Health Area', 'Week', 'Year', 'Children Vaccinated', 'DTP3', 'MCV2', 'Total Doses', 'Status'];
    const rows = entries.map(e => [
      e.district, e.health_area_name, e.week_number, e.year,
      e.total_children_vaccinated, e.dtp3_count, e.mcv2_count,
      e.total_doses_administered, e.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VERHUS_W${weekNum}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {lang === 'en' ? 'Reports & Exports' : 'Rapports & Exports'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center">
              <FileText className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Total Entries' : 'Entrées totales'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Table2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{submitted.length}</p>
              <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Submitted' : 'Soumis'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{drafts.length}</p>
              <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Drafts' : 'Brouillons'}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang === 'en' ? 'Export Data' : 'Exporter les données'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {lang === 'en'
              ? `Export all data for Week ${weekNum}, ${year} as CSV.`
              : `Exporter toutes les données pour la Semaine ${weekNum}, ${year} en CSV.`}
          </p>
          <Button onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            {lang === 'en' ? 'Download CSV' : 'Télécharger CSV'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}