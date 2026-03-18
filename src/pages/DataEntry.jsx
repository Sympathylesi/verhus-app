import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import WizardStepper from '../components/dataentry/WizardStepper';
import StepMetadata from '../components/dataentry/StepMetadata';
import StepEngagement from '../components/dataentry/StepEngagement';
import StepScreening from '../components/dataentry/StepScreening';
import StepSessions from '../components/dataentry/StepSessions';
import StepDoses from '../components/dataentry/StepDoses';
import StepReview from '../components/dataentry/StepReview';

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export default function DataEntry() {
  const { lang, selectedWeek } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [year, weekStr] = selectedWeek.split('-W');
  const now = new Date();

  const [data, setData] = useState({
    week_number: parseInt(weekStr),
    year: parseInt(year),
    district: '',
    health_area_id: '',
    health_area_name: '',
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

  // Check URL for edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  const { data: healthAreas = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
  });

  // Load existing entry if editing
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
    const sessions = d.vaccination_sessions || {};
    const totalChildren = Object.values(sessions).reduce((s, type) =>
      s + Object.values(type || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
    );
    const dtp3Row = vaccines['Penta3'] || {};
    const dtp3 = Object.values(dtp3Row).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);
    const mcv2Row = vaccines['MCV2'] || {};
    const mcv2 = Object.values(mcv2Row).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);

    return { ...d, total_doses_administered: totalDoses, total_children_vaccinated: totalChildren, dtp3_count: dtp3, mcv2_count: mcv2 };
  };

  const saveMutation = useMutation({
    mutationFn: async (status) => {
      const payload = computeTotals({ ...data, status });
      if (editId) {
        return base44.entities.WeeklyEntry.update(editId, payload);
      }
      return base44.entities.WeeklyEntry.create(payload);
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.success(status === 'submitted'
        ? (lang === 'en' ? 'Submitted for approval!' : 'Soumis pour approbation !')
        : (lang === 'en' ? 'Draft saved!' : 'Brouillon enregistré !'));
      navigate('/HealthAreas');
    },
  });

  const stepComponents = [
    <StepMetadata lang={lang} data={data} setData={setData} healthAreas={healthAreas} />,
    <StepEngagement lang={lang} data={data} setData={setData} />,
    <StepScreening lang={lang} data={data} setData={setData} />,
    <StepSessions lang={lang} data={data} setData={setData} />,
    <StepDoses lang={lang} data={data} setData={setData} />,
    <StepReview lang={lang} data={data} setData={setData} />,
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {lang === 'en' ? 'Data Entry' : 'Saisie de données'}
      </h1>

      <WizardStepper current={step} setCurrent={setStep} lang={lang} />

      <div className="min-h-[400px]">
        {stepComponents[step]}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {lang === 'en' ? 'Back' : 'Retour'}
        </Button>

        <div className="flex gap-2">
          {step === 5 && (
            <>
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate('draft')}
                disabled={saveMutation.isPending}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                {lang === 'en' ? 'Save Draft' : 'Brouillon'}
              </Button>
              <Button
                onClick={() => saveMutation.mutate('submitted')}
                disabled={saveMutation.isPending}
                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
                {lang === 'en' ? 'Submit' : 'Soumettre'}
              </Button>
            </>
          )}
          {step < 5 && (
            <Button onClick={() => setStep(step + 1)} className="gap-1">
              {lang === 'en' ? 'Next' : 'Suivant'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}