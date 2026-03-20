import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, XCircle, CheckCircle2, MapPin, Calendar, Syringe, Users, ShieldAlert } from 'lucide-react';

export default function StepReview({ lang, data, setData }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const vaccines = data.vaccine_doses || {};
  const totalVaccinated = Object.values(vaccines).reduce((s, v) =>
    s + Object.values(v || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
  );

  const screening = data.screening || {};
  const engagement = data.community_engagement || {};
  const session_dates = data.session_dates || {};

  const totalEngaged = Object.values(engagement).reduce((s, g) =>
    s + Object.values(g || {}).reduce((ss, lvl) =>
      ss + (typeof lvl === 'object' ? (lvl.male || 0) + (lvl.female || 0) : 0), 0), 0);

  const totalScreened = ['sam', 'mam'].reduce((s, mt) =>
    s + ['0_11m', '12_23m', '24_59m'].reduce((ss, ab) =>
      ss + ['male', 'female'].reduce((sss, g) => sss + (screening[`${mt}_${g}_${ab}`] || 0), 0), 0), 0
  );

  const dtp3 = Object.values(vaccines['Penta3'] || {}).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);
  const mcv2 = Object.values(vaccines['MCV2 (MR2)'] || {}).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);

  const screeningOverflow = totalScreened > totalVaccinated && totalVaccinated > 0;

  // Blocking errors
  const errors = [];
  if (!data.district) errors.push(t('No district selected', 'Aucun district sélectionné'));
  if (!data.health_area_id) errors.push(t('No health area selected', 'Aucune aire de santé sélectionnée'));
  if (!data.week_number) errors.push(t('Week number missing', 'Numéro de semaine manquant'));
  if (totalVaccinated === 0) errors.push(t('No vaccine doses entered', 'Aucune dose de vaccin saisie'));
  if (screeningOverflow) errors.push(t('Screened count exceeds vaccinated count', 'Nombre dépistés supérieur aux vaccinés'));

  // Warnings
  const warnings = [];
  if (screening.stock_out) warnings.push(t('Stock-out reported', 'Rupture de stock signalée'));
  if (screening.adverse_events > 0) warnings.push(t(`${screening.adverse_events} adverse event(s)`, `${screening.adverse_events} événement(s) indésirable(s)`));
  if (!screening.fridge_functional) warnings.push(t('Refrigerator non-functional', 'Réfrigérateur non fonctionnel'));
  if (totalEngaged === 0) warnings.push(t('No community engagement recorded', 'Aucun engagement communautaire enregistré'));

  const DATE_LABELS = {
    start_date:      { en: 'Start Date',      fr: 'Date de début' },
    end_date:        { en: 'End Date',        fr: 'Date de fin' },
    date_of_session: { en: 'Date of Session', fr: 'Date de session' },
    date_received:   { en: 'Date Received',   fr: 'Date de réception' },
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Blocking errors */}
      {errors.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              {t('Cannot submit — fix these first', "Impossible de soumettre — corrigez d'abord")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-1">
              {errors.map((e, i) => <li key={i} className="text-xs text-red-700 dark:text-red-400">• {e}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {t('Warnings', 'Avertissements')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-1">
              {warnings.map((w, i) => <li key={i} className="text-xs text-amber-700 dark:text-amber-300">• {w}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* All clear */}
      {errors.length === 0 && warnings.length === 0 && (
        <div className="flex items-center gap-2 text-emerald-600 text-sm px-1">
          <CheckCircle2 className="h-4 w-4" />
          {t('All validations passed — ready to submit', 'Toutes les validations réussies — prêt à soumettre')}
        </div>
      )}

      {/* Location & period */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t('Location & Period', 'Lieu & Période')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('Region', 'Région')}</p>
              <p className="font-medium mt-0.5">{data.region || '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('District', 'District')}</p>
              <p className="font-medium mt-0.5">{data.district || '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('Health Area', 'Aire de santé')}</p>
              <p className="font-medium mt-0.5">{data.health_area_name || '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('Week / Year', 'Semaine / Année')}</p>
              <p className="font-medium mt-0.5">W{data.week_number} / {data.year}</p>
            </div>
          </div>
          {data.strategies && Object.keys(data.strategies).some(k => data.strategies[k]) && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">{t('Strategies', 'Stratégies')}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.strategies).filter(([, v]) => v).map(([s, approach]) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {s} — {approach.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session dates */}
      {Object.values(session_dates).some(Boolean) && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t('Session Dates', 'Dates de session')}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(DATE_LABELS).map(([key, label]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground">{label[lang]}</p>
                  <p className="font-medium mt-0.5 text-sm">{session_dates[key] || '–'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Syringe, label: t('Vaccinated', 'Vaccinés'),      value: totalVaccinated, color: 'text-emerald-600' },
          { icon: Users,   label: t('Screened',   'Dépistés'),      value: totalScreened,   color: screeningOverflow ? 'text-red-600' : 'text-sky-600' },
          { icon: Syringe, label: 'DTP3 (Penta3)',                  value: dtp3,            color: 'text-violet-600' },
          { icon: Syringe, label: 'MCV2',                           value: mcv2,            color: 'text-amber-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${color}`} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
          </Card>
        ))}
      </div>

      {/* Screening flags */}
      {(screening.stock_out || !screening.fridge_functional || screening.adverse_events > 0 || screening.disability_count > 0) && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('Screening Flags', 'Indicateurs de dépistage')}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {screening.stock_out && <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">{t('Stock-out', 'Rupture stock')}</Badge>}
              {!screening.fridge_functional && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{t('Fridge issue', 'Problème frigo')}</Badge>}
              {screening.adverse_events > 0 && <Badge className="bg-orange-100 text-orange-700">{screening.adverse_events} {t('adverse events', 'événements indésirables')}</Badge>}
              {screening.disability_count > 0 && <Badge variant="outline">{screening.disability_count} {t('disability cases', 'cas handicap')}</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community engagement */}
      {totalEngaged > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t('Community Engagement', 'Engagement communautaire')}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(engagement).map(([group, levels]) => {
                const total = Object.values(levels || {}).reduce((s, lvl) =>
                  s + (typeof lvl === 'object' ? (lvl.male || 0) + (lvl.female || 0) : 0), 0);
                return total > 0 && (
                  <div key={group} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg">
                    <span className="capitalize">{group}</span>
                    <span className="font-bold">{total}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Humanitarian integration */}
      {data.has_humanitarian && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t('Humanitarian Integration', 'Intégration humanitaire')}</p>
            {data.humanitarian_actor && (
              <p className="text-xs mb-2">{t('Actor', 'Acteur')}: <span className="font-medium">{data.humanitarian_actor}</span></p>
            )}
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.humanitarian || {}).filter(([, v]) => (v.items || 0) + (v.male || 0) + (v.female || 0) > 0).map(([key, val]) => (
                <div key={key} className="px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/20 rounded-lg text-xs">
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                  {val.items > 0 && <span className="ml-1 text-muted-foreground">×{val.items}</span>}
                  {(val.male > 0 || val.female > 0) && <span className="ml-1 text-muted-foreground">({val.male || 0}M/{val.female || 0}F)</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comment */}
      <div className="space-y-1.5">
        <Label className="text-sm">{t('Comment (optional)', 'Commentaire (optionnel)')}</Label>
        <Textarea
          value={data.comment || ''}
          onChange={e => setData(prev => ({ ...prev, comment: e.target.value }))}
          placeholder={t('Add any notes or observations…', 'Ajouter des notes ou observations…')}
          rows={3}
        />
      </div>
    </div>
  );
}
