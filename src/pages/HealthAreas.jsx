import React, { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Pencil, Trash2, ClipboardEdit,
  ChevronDown, ChevronRight, TableProperties, MapPin, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import HealthAreaForm from '@/components/healthareas/HealthAreaForm';

const statusColors = {
  draft:     'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  approved:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

function CoverageBar({ pct, className }) {
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={cn('text-xs font-medium w-9 text-right tabular-nums',
        pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'
      )}>{pct}%</span>
    </div>
  );
}

export default function HealthAreas() {
  const { lang, selectedWeek } = useOutletContext();
  const qc = useQueryClient();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [year, weekStr] = selectedWeek.split('-W');
  const weekNum = parseInt(weekStr);

  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [expandedRegions, setExpandedRegions] = useState({});
  const [expandedDistricts, setExpandedDistricts] = useState({});

  const [haDialog, setHaDialog] = useState({ open: false, initial: null });

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['entries', year, weekNum],
    queryFn: () => base44.entities.WeeklyEntry.filter({ year: parseInt(year), week_number: weekNum }),
  });

  const { data: healthAreas = [], isLoading: loadingHA } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
  });

  const { data: districtsGeo } = useQuery({
    queryKey: ['cameroon-districts-geojson'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}cameroon-districts.geojson`).then(r => r.json()),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: regionsGeo } = useQuery({
    queryKey: ['cameroon-regions-geojson'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}cameroon-regions.geojson`).then(r => r.json()),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const geoRegions = useMemo(() => {
    if (!districtsGeo) return {};
    const map = {};
    districtsGeo.features.forEach(f => {
      const { region, district } = f.properties;
      if (!map[region]) map[region] = [];
      map[region].push(district);
    });
    Object.values(map).forEach(arr => arr.sort());
    return map;
  }, [districtsGeo]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createHA = useMutation({
    mutationFn: (data) => base44.entities.HealthArea.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['healthAreas'] }); toast.success(t('Health area created', 'Aire de santé créée')); setHaDialog({ open: false, initial: null }); },
  });
  const updateHA = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HealthArea.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['healthAreas'] }); toast.success(t('Health area updated', 'Aire de santé mise à jour')); setHaDialog({ open: false, initial: null }); },
  });
  const deleteHA = useMutation({
    mutationFn: (id) => base44.entities.HealthArea.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['healthAreas'] }); toast.success(t('Health area deleted', 'Aire de santé supprimée')); },
  });

  // ── Derived data ───────────────────────────────────────────────────────────

  // Unique regions from GeoJSON, districts from HealthArea entity (same pattern as MainDB)
  const regions = useMemo(() =>
    regionsGeo
      ? [...new Set(regionsGeo.features.map(f => f.properties.region).filter(Boolean))].sort()
      : [...new Set(healthAreas.map(ha => ha.region).filter(Boolean))].sort()
  , [regionsGeo, healthAreas]);

  const districtOptions = useMemo(() => {
    if (districtsGeo) {
      return districtsGeo.features
        .filter(f => regionFilter === 'all' || f.properties.region === regionFilter)
        .map(f => ({ value: f.properties.district, label: f.properties.district_alt || f.properties.district }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return [...new Set(
      healthAreas
        .filter(ha => regionFilter === 'all' || ha.region === regionFilter)
        .map(ha => ha.district)
        .filter(Boolean)
    )].sort().map(d => ({ value: d, label: d }));
  }, [districtsGeo, healthAreas, regionFilter]);

  // Enrich each health area with its weekly entry data
  const enrichedAreas = useMemo(() => healthAreas.map(ha => {
    const entry = entries.find(e => e.health_area_id === ha.id);
    const target = (ha.population0_11m || 0) + (ha.population12_23m || 0) + (ha.population24_59m || 0) || 1;
    return {
      ...ha,
      entry,
      totalChildren: entry?.total_children_vaccinated || 0,
      dtp3Pct: entry ? Math.round((entry.dtp3_count || 0) / target * 100) : 0,
      mcv2Pct: entry ? Math.round((entry.mcv2_count || 0) / target * 100) : 0,
      status: entry?.status || 'none',
      target,
    };
  }), [healthAreas, entries]);

  // District-level aggregates keyed by district name
  const districtStats = useMemo(() => {
    const stats = {};
    enrichedAreas.forEach(ha => {
      const key = ha.district || '';
      if (!stats[key]) stats[key] = { total: 0, withEntry: 0, dtp3Sum: 0, mcv2Sum: 0, targetSum: 0 };
      const s = stats[key];
      s.total++;
      if (ha.entry) s.withEntry++;
      s.dtp3Sum += ha.entry?.dtp3_count || 0;
      s.mcv2Sum += ha.entry?.mcv2_count || 0;
      s.targetSum += ha.target;
    });
    Object.values(stats).forEach(s => {
      s.dtp3Pct = Math.round(s.dtp3Sum / (s.targetSum || 1) * 100);
      s.mcv2Pct = Math.round(s.mcv2Sum / (s.targetSum || 1) * 100);
    });
    return stats;
  }, [enrichedAreas]);

  // Summary KPIs
  const summary = useMemo(() => {
    const withEntry = enrichedAreas.filter(ha => ha.entry).length;
    const avgDtp3 = enrichedAreas.length
      ? Math.round(enrichedAreas.reduce((s, ha) => s + ha.dtp3Pct, 0) / enrichedAreas.length)
      : 0;
    const districtCount = new Set(healthAreas.map(ha => ha.district).filter(Boolean)).size;
    return { total: enrichedAreas.length, withEntry, avgDtp3, districts: districtCount };
  }, [enrichedAreas, healthAreas]);

  // Filtered areas
  const filteredAreas = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedAreas.filter(ha => {
      const matchSearch   = !q || ha.name.toLowerCase().includes(q) || (ha.district || '').toLowerCase().includes(q) || (ha.region || '').toLowerCase().includes(q);
      const matchRegion   = regionFilter   === 'all' || ha.region   === regionFilter;
      const matchDistrict = districtFilter === 'all' || ha.district === districtFilter;
      return matchSearch && matchRegion && matchDistrict;
    });
  }, [enrichedAreas, search, regionFilter, districtFilter]);

  // Group by region → district name for accordion
  const groupedByRegion = useMemo(() => {
    const regionMap = {};
    filteredAreas.forEach(ha => {
      const region   = ha.region   || t('Unknown Region',   'Région inconnue');
      const district = ha.district || t('Unknown District', 'District inconnu');
      if (!regionMap[region]) regionMap[region] = {};
      if (!regionMap[region][district]) regionMap[region][district] = [];
      regionMap[region][district].push(ha);
    });
    return Object.entries(regionMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([region, districtGroups]) => ({
        region,
        districts: Object.entries(districtGroups)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([district, areas]) => ({ district, areas })),
      }));
  }, [filteredAreas]);

  const toggleRegion = (region) => setExpandedRegions(s => ({ ...s, [region]: s[region] === false ? true : false }));

  const loading = loadingEntries || loadingHA;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
            <TableProperties className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('Health Areas', 'Aires de santé')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(`Week ${weekNum}, ${year}`, `Semaine ${weekNum}, ${year}`)}
            </p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {summary.districts} {t('districts', 'districts')}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium">
            <TableProperties className="h-3.5 w-3.5 text-muted-foreground" />
            {summary.total} {t('areas', 'aires')}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {summary.withEntry}/{summary.total} {t('reported', 'rapportées')}
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            summary.avgDtp3 >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : summary.avgDtp3 >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
          )}>
            DTP3 ø {summary.avgDtp3}%
          </div>
        </div>
      </div>

      {/* ── Search + filter bar (global) ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search areas, districts or regions…', 'Rechercher aires, districts ou régions…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={regionFilter} onValueChange={v => { setRegionFilter(v); setDistrictFilter('all'); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('All Regions', 'Toutes les régions')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Regions', 'Toutes les régions')}</SelectItem>
            {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('All Districts', 'Tous les districts')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Districts', 'Tous les districts')}</SelectItem>
            {districtOptions.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('Weekly Overview', 'Vue hebdomadaire')}</TabsTrigger>
          <TabsTrigger value="manage">{t('Manage', 'Gérer')}</TabsTrigger>
        </TabsList>

        {/* ── WEEKLY OVERVIEW — district accordion ── */}
        <TabsContent value="overview" className="space-y-2 mt-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
            ))
          ) : groupedByRegion.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground text-sm">
                {t('No health areas found', 'Aucune aire de santé trouvée')}
              </CardContent>
            </Card>
          ) : groupedByRegion.map(({ region, districts: dGroups }) => {
            const regionOpen = expandedRegions[region] !== false;
            // aggregate region-level stats
            const allAreas = dGroups.flatMap(g => g.areas);
            const regionReported = allAreas.filter(ha => ha.entry).length;
            const regionDtp3 = Math.round(allAreas.reduce((s, ha) => s + ha.dtp3Pct, 0) / (allAreas.length || 1));

            return (
              <Card key={region} className="overflow-hidden">
                {/* Region header */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted/70 transition-colors text-left"
                  onClick={() => toggleRegion(region)}
                >
                  {regionOpen
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-sm">{region}</span>
                    <span className="text-xs text-muted-foreground">{dGroups.length} {t('districts', 'districts')} · {allAreas.length} {t('areas', 'aires')}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {regionReported}/{allAreas.length} {t('reported', 'rapportées')}
                    </Badge>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] text-muted-foreground">DTP3 ø</span>
                      <CoverageBar pct={regionDtp3} className="w-28" />
                    </div>
                  </div>
                </button>

                {/* Districts inside region */}
                {regionOpen && dGroups.map(({ district, areas }) => {
                  const stats = districtStats[district] || {};
                  const isOpen = expandedDistricts[district] !== false;

                  return (
                    <div key={district} className="border-t">
                      {/* District sub-header */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 pl-8 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setExpandedDistricts(s => ({ ...s, [district]: !isOpen }))}
                      >
                        {isOpen
                          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{district}</span>
                            <span className="text-xs text-muted-foreground">{areas.length} {t('areas', 'aires')}</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              {stats.withEntry || 0}/{areas.length} {t('reported', 'rapportées')}
                            </Badge>
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-x-6 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground w-8">DTP3</span>
                              <CoverageBar pct={stats.dtp3Pct || 0} className="flex-1" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground w-8">MCV2</span>
                              <CoverageBar pct={stats.mcv2Pct || 0} className="flex-1" />
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Health area rows */}
                      {isOpen && (
                        <table className="w-full text-sm border-t">
                          <thead>
                            <tr className="bg-muted/20 text-muted-foreground">
                              <th className="text-left py-2 pl-14 pr-3 font-medium text-xs">{t('Health Area', 'Aire de santé')}</th>
                              <th className="text-right py-2 px-3 font-medium text-xs">{t('Children', 'Enfants')}</th>
                              <th className="py-2 px-3 font-medium text-xs w-36">DTP3</th>
                              <th className="py-2 px-3 font-medium text-xs w-36">MCV2</th>
                              <th className="text-center py-2 px-3 font-medium text-xs">Status</th>
                              <th className="py-2 px-3 w-16" />
                            </tr>
                          </thead>
                          <tbody>
                            {areas.map(ha => (
                              <tr key={ha.id} className={cn(
                                'border-t transition-colors',
                                ha.entry ? 'hover:bg-muted/20' : 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50/60'
                              )}>
                                <td className="py-2.5 pl-14 pr-3">
                                  <span className="font-medium">{ha.name}</span>
                                  {!ha.entry && (
                                    <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                      {t('no entry', 'sans saisie')}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right tabular-nums">
                                  {ha.entry ? ha.totalChildren.toLocaleString() : <span className="text-muted-foreground">–</span>}
                                </td>
                                <td className="py-2.5 px-3">
                                  {ha.entry ? <CoverageBar pct={ha.dtp3Pct} /> : <span className="text-xs text-muted-foreground">–</span>}
                                </td>
                                <td className="py-2.5 px-3">
                                  {ha.entry ? <CoverageBar pct={ha.mcv2Pct} /> : <span className="text-xs text-muted-foreground">–</span>}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {ha.status !== 'none'
                                    ? <Badge className={`text-[10px] ${statusColors[ha.status]}`}>{ha.status}</Badge>
                                    : <span className="text-xs text-muted-foreground">–</span>
                                  }
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <Link to={ha.entry
                                    ? `/DataEntry?id=${ha.entry.id}`
                                    : `/DataEntry?ha_id=${ha.id}&ha_name=${encodeURIComponent(ha.name)}&region=${encodeURIComponent(ha.region || '')}&district=${encodeURIComponent(ha.district || '')}`
                                  }>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" title={ha.entry ? t('View entry', 'Voir la saisie') : t('Add entry', 'Ajouter une saisie')}>
                                      <ClipboardEdit className="h-3.5 w-3.5" />
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </TabsContent>

        {/* ── MANAGE — districts + areas in one tree ── */}
        <TabsContent value="manage" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {regions.length} {t('regions', 'régions')} · {summary.districts} {t('districts', 'districts')} · {healthAreas.length} {t('health areas', 'aires de santé')}
            </p>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setHaDialog({ open: true, initial: {
              region:   regionFilter   !== 'all' ? regionFilter   : '',
              district: districtFilter !== 'all' ? districtFilter : '',
            } })}>
              <Plus className="h-3.5 w-3.5" />
              {t('New Health Area', 'Nouvelle aire de santé')}
            </Button>
          </div>

          {loadingHA ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)
          ) : healthAreas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground text-sm">
                {t('No health areas yet.', 'Aucune aire de santé.')}
              </CardContent>
            </Card>
          ) : regions
            .filter(region => {
              if (regionFilter !== 'all' && region !== regionFilter) return false;
              return healthAreas.some(ha => ha.region === region &&
                (!search || ha.name.toLowerCase().includes(search.toLowerCase()) || (ha.district || '').toLowerCase().includes(search.toLowerCase()))
              );
            })
            .map(region => {
              const regionDistrictNames = [...new Set(
                healthAreas
                  .filter(ha => ha.region === region)
                  .map(ha => ha.district)
                  .filter(Boolean)
              )]
                .filter(d => districtFilter === 'all' || d === districtFilter)
                .filter(d => !search || d.toLowerCase().includes(search.toLowerCase()) ||
                  healthAreas.some(ha => ha.district === d && ha.name.toLowerCase().includes(search.toLowerCase()))
                )
                .sort();
              const regionManageOpen = expandedRegions[`manage-${region}`] !== false;

              return (
                <Card key={region} className="overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted/70 transition-colors text-left"
                    onClick={() => setExpandedRegions(s => ({ ...s, [`manage-${region}`]: !regionManageOpen }))}
                  >
                    {regionManageOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <span className="font-bold text-sm flex-1">{region}</span>
                    <span className="text-xs text-muted-foreground">{regionDistrictNames.length} {t('districts', 'districts')}</span>
                  </button>

                  {regionManageOpen && regionDistrictNames.map(districtName => {
                    const areas = healthAreas.filter(ha => ha.district === districtName &&
                      (!search || ha.name.toLowerCase().includes(search.toLowerCase()) || districtName.toLowerCase().includes(search.toLowerCase()))
                    );
                    const isOpen = expandedDistricts[`manage-${districtName}`] !== false;

                    return (
                      <div key={districtName} className="border-t">
                        <div className="flex items-center gap-2 px-4 py-2.5 pl-8 bg-muted/20">
                          <button
                            className="flex items-center gap-2 flex-1 text-left hover:text-foreground transition-colors"
                            onClick={() => setExpandedDistricts(s => ({ ...s, [`manage-${districtName}`]: !isOpen }))}
                          >
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                            <span className="font-semibold text-sm">{districtName}</span>
                            <span className="text-xs text-muted-foreground">{areas.length} {t('areas', 'aires')}</span>
                          </button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                            onClick={() => setHaDialog({ open: true, initial: { region, district: districtName } })}
                            title={t('Add health area', 'Ajouter une aire')}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {isOpen && (
                          <div className="border-t divide-y">
                            {areas.length === 0 ? (
                              <div className="py-3 pl-14 text-xs text-muted-foreground italic">
                                {t('No health areas in this district.', 'Aucune aire dans ce district.')}
                              </div>
                            ) : areas.map(ha => (
                              <div key={ha.id} className="flex items-center gap-3 px-4 py-2.5 pl-14 hover:bg-muted/20 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium">{ha.name}</span>
                                  <span className="ml-3 text-xs text-muted-foreground tabular-nums">
                                    {[
                                      ha.population0_11m != null && `0–11m: ${ha.population0_11m}`,
                                      ha.population12_23m != null && `12–23m: ${ha.population12_23m}`,
                                      ha.population24_59m != null && `24–59m: ${ha.population24_59m}`,
                                    ].filter(Boolean).join(' · ')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => setHaDialog({ open: true, initial: ha })}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => { if (confirm(t('Delete this health area?', 'Supprimer cette aire ?'))) deleteHA.mutate(ha.id); }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <div className="px-4 py-2 pl-14">
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                                onClick={() => setHaDialog({ open: true, initial: { region, district: districtName } })}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                {t('Add health area', 'Ajouter une aire')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Card>
              );
            })
          }
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      <HealthAreaForm
        open={haDialog.open}
        initial={haDialog.initial}
        geoRegions={geoRegions}
        lang={lang}
        onClose={() => setHaDialog({ open: false, initial: null })}
        onSubmit={(data) => haDialog.initial
          ? updateHA.mutate({ id: haDialog.initial.id, data })
          : createHA.mutate(data)
        }
      />
    </div>
  );
}
