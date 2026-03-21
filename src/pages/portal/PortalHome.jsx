import React, { useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, Users, CalendarDays, AlertCircle, ArrowRight } from 'lucide-react';

const AGE_SEX_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];
function vaccineSum(entries, vac) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[vac] || {};
    return s + AGE_SEX_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

const QUICK_LINKS = [
  { path: '/Portal/coverage',        labelFr: 'Couverture vaccinale',     labelEn: 'Vaccination Coverage' },
  { path: '/Portal/completeness',    labelFr: 'Complétude',               labelEn: 'Completeness' },
  { path: '/Portal/missing-reports', labelFr: 'Rapports manquants',       labelEn: 'Missing Reports' },
  { path: '/Portal/antigen-followup',labelFr: 'Suivi des antigènes',      labelEn: 'Antigen Follow-up' },
  { path: '/Portal/session-planning',labelFr: 'Planification des séances',labelEn: 'Session Planning' },
  { path: '/Portal/targets',         labelFr: 'Cibles',                   labelEn: 'Targets' },
];

export default function PortalHome() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
  });

  const totalTarget = useMemo(
    () => healthAreas.reduce((s, ha) => s + (ha.target_population || ha.population0_11m || 0), 0) || 1,
    [healthAreas]
  );

  const stats = useMemo(() => {
    const penta3 = vaccineSum(entries, 'Penta3');
    const mcv1   = vaccineSum(entries, 'MCV1');
    const missing = healthAreas.length > 0
      ? healthAreas.filter(ha => !entries.some(e => e.health_area_id === ha.id)).length
      : 0;
    return {
      children:  entries.reduce((s, e) => s + (e.total_children_vaccinated || 0), 0),
      sessions:  entries.length,
      penta3Pct: Math.round(penta3 / totalTarget * 100),
      mcv1Pct:   Math.round(mcv1   / totalTarget * 100),
      missing,
      areas: healthAreas.length,
    };
  }, [entries, healthAreas, totalTarget]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-xl bg-[#1a2744] text-white p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-1">VERHUS</p>
        <h1 className="text-xl font-bold">{t('Portail de Vaccination', 'Vaccination Portal')}</h1>
        <p className="text-sm text-white/70 mt-1">
          {t('Suivi de la couverture vaccinale au Cameroun', 'Vaccination coverage monitoring in Cameroon')}
        </p>
      </div>

      {/* KPI strip */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Users,       value: stats.children.toLocaleString(), label: t('Enfants vaccinés','Children Vaccinated'), color: 'text-sky-600',     bg: 'bg-sky-50 dark:bg-sky-950/20' },
            { icon: ShieldCheck, value: `${stats.penta3Pct}%`,           label: t('Couverture Penta3','Penta3 Coverage'),    color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
            { icon: ShieldCheck, value: `${stats.mcv1Pct}%`,             label: t('Couverture MCV1','MCV1 Coverage'),        color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/20' },
            { icon: CalendarDays,value: stats.sessions.toLocaleString(), label: t('Séances enregistrées','Sessions Recorded'), color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/20' },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 flex items-center gap-3 ${bg}`}>
              <Icon className={`h-7 w-7 shrink-0 ${color}`} />
              <div>
                <p className="text-xl font-bold leading-tight">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          {t('Accès rapide', 'Quick Access')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {QUICK_LINKS.map(({ path, labelFr, labelEn }) => (
            <Link key={path} to={path}
              className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg border bg-card hover:bg-muted transition-colors text-sm font-medium">
              {lang === 'en' ? labelEn : labelFr}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {stats.missing > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <span>
            <strong>{stats.missing}</strong> {t('aire(s) de santé sans rapport enregistré.', 'health area(s) with no recorded report.')}
            {' '}<Link to="/Portal/missing-reports" className="underline underline-offset-2">{t('Voir les rapports manquants','View missing reports')}</Link>
          </span>
        </div>
      )}
    </div>
  );
}
