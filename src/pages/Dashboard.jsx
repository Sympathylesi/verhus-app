import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { ClipboardEdit } from 'lucide-react';
import KPICards from '../components/dashboard/KPICards';
import WeeklyTrendChart from '../components/dashboard/WeeklyTrendChart';
import AlertsBanner from '../components/dashboard/AlertsBanner';
import CameroonMap from '../components/dashboard/CameroonMap';

export default function Dashboard() {
  const { lang, selectedWeek } = useOutletContext();
  const [year, weekStr] = selectedWeek.split('-W');
  const weekNum = parseInt(weekStr);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', year],
    queryFn: () => base44.entities.WeeklyEntry.filter({ year: parseInt(year) }),
  });

  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_read: false }),
  });

  const thisWeek = entries.filter(e => e.week_number === weekNum);
  const prevWeek = entries.filter(e => e.week_number === weekNum - 1);

  const sum = (arr, key) => arr.reduce((s, e) => s + (e[key] || 0), 0);
  const totalTarget = healthAreas.reduce((s, ha) => s + (ha.target_population || 0), 0) || 1;

  const kpiData = {
    children: sum(thisWeek, 'total_children_vaccinated'),
    children_prev: sum(prevWeek, 'total_children_vaccinated'),
    dtp3: totalTarget > 0 ? Math.round(sum(thisWeek, 'dtp3_count') / totalTarget * 100) : 0,
    dtp3_prev: totalTarget > 0 ? Math.round(sum(prevWeek, 'dtp3_count') / totalTarget * 100) : 0,
    mcv2: totalTarget > 0 ? Math.round(sum(thisWeek, 'mcv2_count') / totalTarget * 100) : 0,
    mcv2_prev: totalTarget > 0 ? Math.round(sum(prevWeek, 'mcv2_count') / totalTarget * 100) : 0,
    doses: sum(thisWeek, 'total_doses_administered'),
    doses_prev: sum(prevWeek, 'total_doses_administered'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lang === 'en' ? 'Dashboard' : 'Tableau de bord'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === 'en' ? `Week ${weekNum}, ${year}` : `Semaine ${weekNum}, ${year}`}
          </p>
        </div>
        <Link to="/DataEntry">
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <ClipboardEdit className="h-4 w-4" />
            <span className="hidden sm:inline">{lang === 'en' ? 'New Weekly Entry' : 'Nouvelle saisie'}</span>
            <span className="sm:hidden">{lang === 'en' ? 'New Entry' : 'Saisie'}</span>
          </Button>
        </Link>
      </div>

      <AlertsBanner alerts={alerts} lang={lang} />
      <KPICards lang={lang} data={kpiData} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2">
          <CameroonMap lang={lang} healthAreas={healthAreas} entries={thisWeek} />
        </div>
        <div className="xl:col-span-3">
          <WeeklyTrendChart lang={lang} entries={entries} />
        </div>
      </div>
    </div>
  );
}