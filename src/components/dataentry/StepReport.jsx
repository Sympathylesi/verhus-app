import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MessageSquare, TrendingDown, ShieldAlert, Plus, Trash2, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SERVICES = [
  { key: 'deworming',         label: 'Deworming' },
  { key: 'super_cereal',      label: 'Super Cereal' },
  { key: 'csb_plus',          label: 'CSB++' },
  { key: 'plumpy_nuts',       label: 'Plumpy Nuts' },
  { key: 'anc',               label: 'ANC',                noItems: true, noMale: true },
  { key: 'tetanus_toxoid',    label: 'Tetanus Toxoid',     noItems: true, noMale: true },
  { key: 'family_planning',   label: 'Family Planning' },
  { key: 'malaria_screening', label: 'Malaria Screening' },
  { key: 'basic_consultation',label: 'Basic Consultation', noItems: true },
  { key: 'llins',             label: 'LLINs' },
  { key: 'ors_zinc',          label: 'ORS/Zinc' },
  { key: 'wash',              label: 'WASH' },
  { key: 'gbv',               label: 'GBV' },
  { key: 'psea',              label: 'PSEA' },
  { key: 'dignity_kits',      label: 'Dignity Kits',       noMale: true },
  { key: 'asaq_fansida',      label: 'ASAQ/Fansida' },
];

export default function StepReport({ lang, data, setData }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const report = data.report_template || {};
  const humanitarian = data.humanitarian || {};
  const hasIntegration = data.has_humanitarian || false;

  const getList = (section) => report[section]?.length ? report[section] : [''];

  const update = (field, value) =>
    setData(prev => ({ ...prev, report_template: { ...(prev.report_template || {}), [field]: value } }));

  const updateItem = (section, index, value) => {
    const updated = [...getList(section)];
    updated[index] = value;
    update(section, updated);
  };

  const addItem = (section) => update(section, [...getList(section), '']);

  const removeItem = (section, index) => {
    const updated = getList(section).filter((_, i) => i !== index);
    update(section, updated.length ? updated : ['']);
  };

  const updateHumanitarian = (service, field, value) =>
    setData(prev => ({
      ...prev,
      humanitarian: {
        ...prev.humanitarian,
        [service]: {
          ...(prev.humanitarian?.[service] || {}),
          [field]: ['items', 'male', 'female'].includes(field) ? (parseInt(value) || 0) : value
        }
      }
    }));

  const BulletList = ({ section, placeholder }) => (
    <div className="space-y-2">
      {getList(section).map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
          <Textarea
            rows={2}
            value={item}
            onChange={e => updateItem(section, i, e.target.value)}
            placeholder={placeholder}
            className="text-xs resize-none flex-1"
          />
          {getList(section).length > 1 && (
            <button type="button" onClick={() => removeItem(section, i)}
              className="mt-1.5 text-muted-foreground hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => addItem(section)}
        className="gap-1.5 h-7 text-xs mt-1">
        <Plus className="h-3 w-3" />
        {t('Add', 'Ajouter')}
      </Button>
    </div>
  );

  const shade = () => <div className="h-7 w-16 mx-auto rounded bg-muted/60 border border-dashed border-muted-foreground/20" />;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Beneficiaries' Feedback */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t("Beneficiaries' Feedback", 'Retour des bénéficiaires')}</span>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            {t('List concerns/complaints/AEFI reported through the help desk or any other source.',
               'Lister les préoccupations/plaintes/EIAS signalés via le help desk ou toute autre source.')}
          </p>
          <BulletList section="beneficiary_feedback" placeholder={t('Enter feedback…', 'Saisir le retour…')} />
        </CardContent>
      </Card>

      {/* Demand and Supply-Side Barriers */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t('Demand & Supply-Side Barriers', 'Barrières côté demande et offre')}</span>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            {t('Barriers encountered and how they were addressed.',
               'Barrières rencontrées et comment elles ont été traitées.')}
          </p>
          <BulletList section="barriers" placeholder={t('Enter barrier and resolution…', 'Saisir la barrière et la résolution…')} />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t('Security', 'Sécurité')}</span>
          </div>
          <div>
            <p className="text-xs font-medium mb-2">{t('Did an incident occur during the session?', "Un incident s'est-il produit pendant la session ?")}</p>
            <div className="flex gap-2">
              {['Yes', 'No'].map(opt => (
                <button key={opt} type="button" onClick={() => update('security_incident', opt)}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    report.security_incident === opt
                      ? opt === 'Yes'
                        ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  )}>
                  {lang === 'fr' ? (opt === 'Yes' ? 'Oui' : 'Non') : opt}
                </button>
              ))}
            </div>
          </div>
          {report.security_incident === 'Yes' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t('Details of incident:', "Détails de l'incident :")}</p>
              <BulletList section="security_details" placeholder={t('Enter incident details…', "Saisir les détails de l'incident…")} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Humanitarian Integration */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t('Humanitarian Integration', 'Intégration humanitaire')}</span>
            </div>
            <Switch
              checked={hasIntegration}
              onCheckedChange={v => setData(prev => ({ ...prev, has_humanitarian: v }))}
            />
          </div>

          {hasIntegration && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground w-8" rowSpan={2}>N°</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[130px]" rowSpan={2}>
                      {t('Integrated Services', 'Services intégrés')}
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap" rowSpan={2}>
                      {t('Nb. Items', 'Nb. articles')}
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground" colSpan={2}>
                      {t('Number of Beneficiary', 'Nombre de bénéficiaires')}
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[130px]" rowSpan={2}>
                      {t('Humanitarian Actor', 'Acteur humanitaire')}
                    </th>
                  </tr>
                  <tr className="border-b bg-muted/20">
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">{t('Male', 'Homme')}</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">{t('Female', 'Femme')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map((svc, i) => {
                    const row = humanitarian[svc.key] || {};
                    const hasValue = (row.items || 0) + (row.male || 0) + (row.female || 0) > 0;
                    return (
                      <tr key={svc.key} className={cn('border-b last:border-0', hasValue && 'bg-teal-50/40 dark:bg-teal-950/10')}>
                        <td className="py-1.5 px-2 text-center text-muted-foreground">{i + 1}</td>
                        <td className="py-1.5 px-3 font-medium">{svc.label}</td>
                        <td className="py-1.5 px-1">
                          {svc.noItems ? shade() : (
                            <Input type="number" inputMode="numeric" min={0}
                              value={row.items || ''}
                              onChange={e => updateHumanitarian(svc.key, 'items', e.target.value)}
                              className="h-7 w-16 text-center mx-auto" />
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          {svc.noMale ? shade() : (
                            <Input type="number" inputMode="numeric" min={0}
                              value={row.male || ''}
                              onChange={e => updateHumanitarian(svc.key, 'male', e.target.value)}
                              className="h-7 w-16 text-center mx-auto" />
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          {svc.noFemale ? shade() : (
                            <Input type="number" inputMode="numeric" min={0}
                              value={row.female || ''}
                              onChange={e => updateHumanitarian(svc.key, 'female', e.target.value)}
                              className="h-7 w-16 text-center mx-auto" />
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          <Input value={row.actor || ''}
                            onChange={e => updateHumanitarian(svc.key, 'actor', e.target.value)}
                            placeholder={t('Actor name…', 'Nom acteur…')}
                            className="h-7 text-xs" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
