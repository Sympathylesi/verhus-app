import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const steps = [
  { key: 'metadata',   label: { en: 'Location & Period', fr: 'Lieu & Période' } },
  { key: 'sessions',   label: { en: 'Sessions',          fr: 'Sessions' } },
  { key: 'report',     label: { en: 'Report',            fr: 'Rapport' } },
  { key: 'engagement', label: { en: 'Engagement',        fr: 'Engagement' } },
  { key: 'doses',      label: { en: 'Vaccine Doses',     fr: 'Doses vaccin' } },
  { key: 'screening',    label: { en: 'Screening',        fr: 'Dépistage' } },
  { key: 'review',       label: { en: 'Review',           fr: 'Révision' } },
];

export default function WizardStepper({ current, setCurrent, lang, completedSteps = [] }) {
  return (
    <div className="w-full">
      {/* Mobile: compact pill row */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {steps.map((step, i) => {
          const done = completedSteps.includes(i) || i < current;
          const active = i === current;
          return (
            <button
              key={step.key}
              onClick={() => setCurrent(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                active && 'bg-primary text-primary-foreground',
                done && !active && 'bg-primary/15 text-primary',
                !active && !done && 'bg-muted text-muted-foreground'
              )}
            >
              {done && !active
                ? <Check className="h-3 w-3" />
                : <span className="h-4 w-4 rounded-full bg-current/20 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
              }
              {active && <span>{step.label[lang]}</span>}
            </button>
          );
        })}
      </div>

      {/* Desktop: full stepper */}
      <div className="hidden md:flex items-center">
        {steps.map((step, i) => {
          const done = completedSteps.includes(i) || i < current;
          const active = i === current;
          return (
            <React.Fragment key={step.key}>
              <button
                onClick={() => setCurrent(i)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors flex-1',
                  i === 0 && 'rounded-l-lg',
                  i === steps.length - 1 && 'rounded-r-lg',
                  active && 'bg-primary text-primary-foreground',
                  done && !active && 'bg-primary/10 text-primary hover:bg-primary/15',
                  !active && !done && 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <span className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  active && 'bg-white/20',
                  done && !active && 'bg-primary text-primary-foreground',
                  !active && !done && 'bg-background'
                )}>
                  {done && !active ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="truncate">{step.label[lang]}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn('h-px w-px border-l-2 border-t-0 self-stretch', done ? 'border-primary/30' : 'border-border')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((current) / (steps.length - 1)) * 100}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {lang === 'fr' ? `Étape ${current + 1} sur ${steps.length}` : `Step ${current + 1} of ${steps.length}`}
      </p>
    </div>
  );
}
