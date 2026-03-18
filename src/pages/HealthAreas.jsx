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
import { Search, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import DistrictForm from '@/components/healthareas/DistrictForm';
import HealthAreaForm from '@/components/healthareas/HealthAreaForm';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function HealthAreas() {
  const { lang, selectedWeek } = useOutletContext();
  const qc = useQueryClient();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  // --- weekly overview state ---
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [year, weekStr] = selectedWeek.split('-W');
  const weekNum = parseInt(weekStr);

  // --- form state ---
  const [districtDialog, setDistrictDialog] = useState({ open: false, initial: null });
  const [haDialog, setHaDialog] = useState({ open: false, initial: null });

  // --- queries ---
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['entries', year, weekNum],
    queryFn: () => base44.entities.WeeklyEntry.filter({ year: parseInt(year), week_number: weekNum }),
  });

  const { data: healthAreas = [], isLoading: loadingHA } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
  });

  const { data: districts = [], isLoading: loadingDistricts } = useQuery({
    queryKey: ['districts'],
    queryFn: () => base44.entities.District.list(),
  });

  // --- district mutations ---
  const createDistrict = useMutation({
    mutationFn: (data) => base44.entities.District.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['districts'] }); toast.success(t('District created', 'District créé')); setDistrictDialog({ open: false, initial: null }); },
  });

  const updateDistrict = useMutation({
    mutationFn: ({ id, data }) => base44.entities.District.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['districts'] }); toast.success(t('District updated', 'District mis à jour')); setDistrictDialog({ open: false, initial: null }); },
  });

  const deleteDistrict = useMutation({
    mutationFn: (id) => base44.entities.District.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['districts'] }); toast.success(t('District deleted', 'District supprimé')); },
  });

  // --- health area mutations ---
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

  // --- weekly overview rows ---
  const districtNames = useMemo(() => {
    const map = {};
    districts.forEach(d => { map[d.id] = d.name; });
    return map;
  }, [districts]);

  const overviewRows = useMemo(() => {
    return healthAreas.map(ha => {
      const entry = entries.find(e => e.health_area_id === ha.id);
      const target = (ha.population0_11m || 0) + (ha.population12_23m || 0) + (ha.population24_59m || 0) || 1;
      return {
        ...ha,
        districtName: districtNames[ha.districtId] || ha.districtId,
        entry,
        totalChildren: entry?.total_children_vaccinated || 0,
        dtp3Pct: entry ? Math.round((entry.dtp3_count || 0) / target * 100) : 0,
        mcv2Pct: entry ? Math.round((entry.mcv2_count || 0) / target * 100) : 0,
        status: entry?.status || 'none',
      };
    }).filter(r => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.districtName.toLowerCase().includes(search.toLowerCase());
      const matchDistrict = districtFilter === 'all' || r.districtId === districtFilter;
      return matchSearch && matchDistrict;
    });
  }, [healthAreas, entries, search, districtFilter, districtNames]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {t('Health Areas', 'Aires de santé')}
      </h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('Weekly Overview', 'Vue hebdomadaire')}</TabsTrigger>
          <TabsTrigger value="areas">{t('Manage Areas', 'Gérer les aires')}</TabsTrigger>
          <TabsTrigger value="districts">{t('Manage Districts', 'Gérer les districts')}</TabsTrigger>
        </TabsList>

        {/* ── WEEKLY OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-3 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search areas...', 'Rechercher...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('All Districts', 'Tous les districts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Districts', 'Tous les districts')}</SelectItem>
                {districts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-xs">{t('District', 'District')}</th>
                    <th className="text-left py-3 px-4 font-medium text-xs">{t('Health Area', 'Aire de santé')}</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">{t('Children', 'Enfants')}</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">DTP3 %</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">MCV2 %</th>
                    <th className="text-center py-3 px-4 font-medium text-xs">Status</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {loadingEntries ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="border-b animate-pulse">
                        {Array(7).fill(0).map((_, j) => (
                          <td key={j} className="py-3 px-4"><div className="h-4 w-full bg-muted rounded" /></td>
                        ))}
                      </tr>
                    ))
                  ) : overviewRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        {t('No health areas found', 'Aucune aire de santé trouvée')}
                      </td>
                    </tr>
                  ) : overviewRows.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">{r.districtName}</td>
                      <td className="py-3 px-4 font-medium">{r.name}</td>
                      <td className="py-3 px-4 text-right font-medium">{r.totalChildren.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={r.dtp3Pct >= 80 ? 'text-emerald-600' : r.dtp3Pct >= 50 ? 'text-amber-600' : 'text-red-500'}>
                          {r.dtp3Pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={r.mcv2Pct >= 80 ? 'text-emerald-600' : r.mcv2Pct >= 50 ? 'text-amber-600' : 'text-red-500'}>
                          {r.mcv2Pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {r.status !== 'none' ? (
                          <Badge className={`text-[10px] ${statusColors[r.status]}`}>{r.status}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">–</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.entry ? (
                          <Link to={`/DataEntry?id=${r.entry.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        ) : (
                          <Link to="/DataEntry">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              {t('Add', 'Ajouter')}
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MANAGE HEALTH AREAS ── */}
        <TabsContent value="areas" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1" onClick={() => setHaDialog({ open: true, initial: null })}>
              <Plus className="h-4 w-4" />
              {t('New Health Area', 'Nouvelle aire')}
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-xs">{t('Name', 'Nom')}</th>
                    <th className="text-left py-3 px-4 font-medium text-xs">{t('District', 'District')}</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">0–11m</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">12–23m</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">24–59m</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {loadingHA ? (
                    Array(4).fill(0).map((_, i) => (
                      <tr key={i} className="border-b animate-pulse">
                        {Array(6).fill(0).map((_, j) => (
                          <td key={j} className="py-3 px-4"><div className="h-4 w-full bg-muted rounded" /></td>
                        ))}
                      </tr>
                    ))
                  ) : healthAreas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        {t('No health areas yet', 'Aucune aire de santé')}
                      </td>
                    </tr>
                  ) : healthAreas.map(ha => (
                    <tr key={ha.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{ha.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{districtNames[ha.districtId] || '–'}</td>
                      <td className="py-3 px-4 text-right">{ha.population0_11m ?? '–'}</td>
                      <td className="py-3 px-4 text-right">{ha.population12_23m ?? '–'}</td>
                      <td className="py-3 px-4 text-right">{ha.population24_59m ?? '–'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setHaDialog({ open: true, initial: ha })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(t('Delete this health area?', 'Supprimer cette aire ?'))) deleteHA.mutate(ha.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MANAGE DISTRICTS ── */}
        <TabsContent value="districts" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1" onClick={() => setDistrictDialog({ open: true, initial: null })}>
              <Plus className="h-4 w-4" />
              {t('New District', 'Nouveau district')}
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-xs">{t('Name', 'Nom')}</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">{t('Health Areas', 'Aires de santé')}</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {loadingDistricts ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="border-b animate-pulse">
                        {Array(3).fill(0).map((_, j) => (
                          <td key={j} className="py-3 px-4"><div className="h-4 w-full bg-muted rounded" /></td>
                        ))}
                      </tr>
                    ))
                  ) : districts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-muted-foreground">
                        {t('No districts yet', 'Aucun district')}
                      </td>
                    </tr>
                  ) : districts.map(d => (
                    <tr key={d.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{d.name}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {healthAreas.filter(ha => ha.districtId === d.id).length}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setDistrictDialog({ open: true, initial: d })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(t('Delete this district?', 'Supprimer ce district ?'))) deleteDistrict.mutate(d.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── DIALOGS ── */}
      <DistrictForm
        open={districtDialog.open}
        initial={districtDialog.initial}
        lang={lang}
        onClose={() => setDistrictDialog({ open: false, initial: null })}
        onSubmit={(data) => districtDialog.initial
          ? updateDistrict.mutate({ id: districtDialog.initial.id, data })
          : createDistrict.mutate(data)
        }
      />

      <HealthAreaForm
        open={haDialog.open}
        initial={haDialog.initial}
        districts={districts}
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
