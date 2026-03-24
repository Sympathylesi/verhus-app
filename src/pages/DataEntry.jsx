import React, { useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, Send, ChevronLeft, ChevronRight, ClipboardEdit, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import WizardStepper from '../components/dataentry/WizardStepper';
import StepMetadata from '../components/dataentry/StepMetadata';
import StepEngagement from '../components/dataentry/StepEngagement';
import StepScreening from '../components/dataentry/StepScreening';
import StepSessions from '../components/dataentry/StepSessions';
import StepReport from '../components/dataentry/StepReport';
import StepDoses from '../components/dataentry/StepDoses';
import StepReview from '../components/dataentry/StepReview';

export default function DataEntry() {
  const { lang, selectedWeek } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [step, setStep] = useState(0);
  const [year, weekStr] = selectedWeek.split('-W');

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');
  const prefillHaId = urlParams.get('ha_id');
  const prefillHaName = urlParams.get('ha_name');
  const prefillRegion = urlParams.get('region');
  const prefillDistrict = urlParams.get('district');

  const [data, setData] = useState({
    week_number: parseInt(weekStr),
    year: parseInt(year),
    region: prefillRegion || '',
    district: prefillDistrict || '',
    health_area_id: prefillHaId || '',
    health_area_name: prefillHaName || '',
    has_humanitarian: false,
    humanitarian: {},
    report_template: {},
    strategies: {},
    other_variables: {},
    stockouts: {},
    session_dates: {},
    community_engagement: {},
    screening: { fridge_functional: true },
    vaccination_sessions: {},
    vaccine_doses: {},
    comment: '',
    status: 'draft',
    total_children_vaccinated: 0,
    total_doses_administered: 0,
    dtp3_count: 0,
    mcv2_count: 0,
  });

  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
  });

  const { data: geojson } = useQuery({
    queryKey: ['cameroon-districts-geojson'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}cameroon-districts.geojson`).then(r => r.json()),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Derive regions and districts from GeoJSON (all 58 districts, same as map)
  const geoRegions = React.useMemo(() => {
    if (!geojson) return {};
    const map = {};
    geojson.features.forEach(f => {
      const { region, district, district_alt } = f.properties;
      const name = district_alt || district;
      if (!map[region]) map[region] = [];
      map[region].push(name);
    });
    Object.values(map).forEach(arr => arr.sort());
    return map;
  }, [geojson]);

  useQuery({
    queryKey: ['entry', editId],
    queryFn: async () => {
      if (!editId) return null;
      const entries = await base44.entities.WeeklyEntry.filter({ id: editId });
      if (entries.length > 0) setData(entries[0]);
      return entries[0];
    },
    enabled: !!editId,
  });

  const computeTotals = (d) => {
    const vaccines = d.vaccine_doses || {};
    const totalDoses = Object.values(vaccines).reduce((s, v) =>
      s + Object.values(v || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
    );
    const dtp3 = Object.values(vaccines['Penta3'] || {}).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);
    const mcv2 = Object.values(vaccines['MCV2 (MR2)'] || {}).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);
    return { ...d, total_doses_administered: totalDoses, total_children_vaccinated: totalDoses, dtp3_count: dtp3, mcv2_count: mcv2 };
  };

  const saveMutation = useMutation({
    mutationFn: async (status) => {
      const payload = computeTotals({ ...data, status });
      return editId
        ? base44.entities.WeeklyEntry.update(editId, payload)
        : base44.entities.WeeklyEntry.create(payload);
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.success(status === 'submitted'
        ? t('Submitted for approval!', 'Soumis pour approbation !')
        : t('Draft saved!', 'Brouillon enregistré !'));
      navigate('/HealthAreas');
    },
    onError: () => toast.error(t('Save failed', 'Échec de l\'enregistrement')),
  });

  // Auto-save draft when leaving a step (except step 0 which may be incomplete)
  const goToStep = useCallback((next) => {
    if (step > 0 && data.health_area_id && !saveMutation.isPending) {
      saveMutation.mutate('draft');
    }
    setStep(next);
  }, [step, data.health_area_id, saveMutation]);

  // Blocking errors (same logic as StepReview)
  const hasErrors = !data.district || !data.health_area_id || !data.week_number;

  const totalDoses = Object.values(data.vaccine_doses || {}).reduce((s, v) =>
    s + Object.values(v || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardEdit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('Data Entry', 'Saisie de données')}</h1>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground flex-wrap">
              <MapPin className="h-3 w-3" />
              {data.region && <span>{data.region}</span>}
              {data.region && data.district && <span>›</span>}
              {data.district && <span>{data.district}</span>}
              {data.district && data.health_area_name && <span>›</span>}
              {data.health_area_name && <span className="font-medium text-foreground">{data.health_area_name}</span>}
              {!data.region && <span className="italic">{t('No location selected', 'Aucune localisation sélectionnée')}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editId && <Badge variant="outline" className="text-xs">{t('Editing', 'Modification')}</Badge>}
          {totalDoses > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs">
              {totalDoses} {t('doses', 'doses')}
            </Badge>
          )}
          <Button
            variant="outline" size="sm"
            onClick={() => saveMutation.mutate('draft')}
            disabled={saveMutation.isPending || !data.health_area_id}
            className="gap-1.5 h-8 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {t('Save Draft', 'Brouillon')}
          </Button>
        </div>
      </div>

      <WizardStepper current={step} setCurrent={goToStep} lang={lang} />

      <div className="min-h-[400px]">
        {step === 0 && <StepMetadata lang={lang} data={data} setData={setData} healthAreas={healthAreas} geoRegions={geoRegions} />}
        {step === 1 && <StepSessions lang={lang} data={data} setData={setData} selectedWeek={selectedWeek} />}
        {step === 2 && <StepReport lang={lang} data={data} setData={setData} />}
        {step === 3 && <StepEngagement lang={lang} data={data} setData={setData} />}
        {step === 4 && <StepDoses lang={lang} data={data} setData={setData} />}
        {step === 5 && <StepScreening lang={lang} data={data} setData={setData} />}
        {step === 6 && <StepReview lang={lang} data={data} setData={setData} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => goToStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('Back', 'Retour')}
        </Button>

        <div className="flex gap-2">
          {step === 6 ? (
            <>
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate('draft')}
                disabled={saveMutation.isPending}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                {t('Save Draft', 'Brouillon')}
              </Button>
              <Button
                onClick={() => saveMutation.mutate('submitted')}
                disabled={saveMutation.isPending || hasErrors}
                className={cn('gap-1.5', hasErrors ? 'opacity-50' : 'bg-emerald-600 hover:bg-emerald-700')}
                title={hasErrors ? t('Fix errors before submitting', 'Corrigez les erreurs avant de soumettre') : undefined}
              >
                <Send className="h-4 w-4" />
                {t('Submit', 'Soumettre')}
              </Button>
            </>
          ) : (
            <Button onClick={() => goToStep(step + 1)} className="gap-1">
              {t('Next', 'Suivant')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
