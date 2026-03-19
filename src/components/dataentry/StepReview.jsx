import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, XCircle, CheckCircle2, MapPin, Calendar, Syringe, Users, ShieldAlert } from 'lucide-react';

export default function StepReview({ lang, data, setData }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const vaccines = data.vaccine_doses || {};
  const totalDoses = Object.values(vaccines).reduce((s, v) =>
    s + Object.values(v || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
  );

  const sessions = data.vaccination_sessions || {};
  const totalChildren = Object.values(sessions).reduce((s, type) =>
    s + Object.values(type || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
  );

  const screening = data.screening || {};
  const engagement = data.community_engagement || {};
  const totalEngaged = Object.values(engagement).reduce((s, g) => s + (g?.count || 0), 0);

  const dtp3 = Object.values(vaccines['Penta3'] || {}).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);
  const mcv2 = Object.values(vaccines['MCV2'] || {}).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);

  // Blocking errors (prevent submit)
  const errors = [];
  if (!data.district) errors.push(t('No district selected', 'Aucun district sélectionné'));
  if (!data.health_area_id) errors.push(t('No health area selected', 'Aucune aire de santé sélectionnée'));
  if (!data.week_number) errors.push(t('Week number missing', 'Numéro de semaine manquant'));
  if (totalDoses === 0) errors.push(t('No vaccine doses entered', 'Aucune dose de vaccin saisie'));

  // Warnings (allow submit but flag)
  const warnings = [];
  if (screening.stock_out) warnings.push(t('Stock-out reported', 'Rupture de stock signalée'));
  if (screening.adverse_events > 0) warnings.push(t(`${screening.adverse_events} adverse event(s)`, `${screening.adverse_events} événement(s) indésirable(s)`));
  if (!screening.fridge_functional) warnings.push(t('Refrigerator non-functional', 'Réfrigérateur non fonctionnel'));
  if (totalChildren === 0) warnings.push(t('No session children recorded', 'Aucun enfant en session enregistré'));

  const sessionBreakdown = Object.entries(sessions).map(([type, vals]) => ({
    type,
    total: Object.values(vals || {}).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0),
  })).filter(s => s.total > 0);

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Blocking errors */}
      {errors.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              {t('Cannot submit — fix these first', 'Impossible de soumettre — corrigez d\'abord')}
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
          {data.strategy && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">{t('Strategy', 'Stratégie')}</p>
              <Badge variant="outline">{data.strategy}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,      label: t('Children', 'Enfants'),    value: totalChildren, color: 'text-sky-600' },
          { icon: Syringe,    label: t('Total Doses', 'Doses'),   value: totalDoses,    color: 'text-emerald-600' },
          { icon: Syringe,    label: 'DTP3',                      value: dtp3,          color: 'text-violet-600' },
          { icon: Syringe,    label: 'MCV2',                      value: mcv2,          color: 'text-amber-600' },
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

      {/* Session breakdown */}
      {sessionBreakdown.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t('Sessions by Strategy', 'Sessions par stratégie')}</p>
            <div className="flex flex-wrap gap-2">
              {sessionBreakdown.map(s => (
                <div key={s.type} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs">
                  <span className="font-medium capitalize">{s.type.replace('_', ' ')}</span>
                  <span className="font-bold text-primary">{s.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              {Object.entries(engagement).map(([group, val]) => val?.count > 0 && (
                <div key={group} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg">
                  <span className="capitalize">{group}</span>
                  <span className="font-bold">{val.count}</span>
                  {val.level && <Badge variant="outline" className="text-[10px] h-4 px-1">{val.level}</Badge>}
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
