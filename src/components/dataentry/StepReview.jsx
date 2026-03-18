import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function StepReview({ lang, data, setData }) {
  const vaccines = data.vaccine_doses || {};
  const totalDoses = Object.values(vaccines).reduce((s, v) => 
    s + Object.values(v || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
  );

  const sessions = data.vaccination_sessions || {};
  const totalSessions = Object.values(sessions).reduce((s, type) => 
    s + Object.values(type || {}).reduce((ss, n) => ss + (typeof n === 'number' ? n : 0), 0), 0
  );

  const screening = data.screening || {};
  const issues = [];
  if (!data.district) issues.push(lang === 'en' ? 'No district selected' : 'Aucun district sélectionné');
  if (!data.health_area_id) issues.push(lang === 'en' ? 'No health area selected' : 'Aucune aire de santé sélectionnée');
  if (totalDoses === 0) issues.push(lang === 'en' ? 'No vaccine doses entered' : 'Aucune dose de vaccin saisie');
  if (screening.stock_out) issues.push(lang === 'en' ? 'Stock-out reported' : 'Rupture de stock signalée');
  if (screening.adverse_events > 0) issues.push(lang === 'en' ? `${screening.adverse_events} adverse event(s)` : `${screening.adverse_events} événement(s) indésirable(s)`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{lang === 'en' ? 'District' : 'District'}</p>
          <p className="font-semibold text-sm mt-1">{data.district || '–'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Health Area' : 'Aire de santé'}</p>
          <p className="font-semibold text-sm mt-1">{data.health_area_name || '–'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Total Doses' : 'Doses totales'}</p>
          <p className="font-semibold text-sm mt-1 text-primary">{totalDoses}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Session Children' : 'Enfants sessions'}</p>
          <p className="font-semibold text-sm mt-1 text-primary">{totalSessions}</p>
        </Card>
      </div>

      {issues.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {lang === 'en' ? 'Validation Issues' : 'Problèmes de validation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {issues.map((issue, i) => (
                <li key={i} className="text-xs text-amber-700 dark:text-amber-300">• {issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {issues.length === 0 && (
        <div className="flex items-center gap-2 text-emerald-600 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          {lang === 'en' ? 'All validations passed' : 'Toutes les validations réussies'}
        </div>
      )}

      <div>
        <Label className="text-sm">{lang === 'en' ? 'Comment (optional)' : 'Commentaire (optionnel)'}</Label>
        <Textarea
          value={data.comment || ''}
          onChange={e => setData(prev => ({ ...prev, comment: e.target.value }))}
          className="mt-1.5"
          placeholder={lang === 'en' ? 'Add any notes...' : 'Ajouter des notes...'}
          rows={3}
        />
      </div>
    </div>
  );
}