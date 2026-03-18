import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const steps = [
  { key: 'metadata', label: { en: 'Metadata', fr: 'Métadonnées' } },
  { key: 'engagement', label: { en: 'Engagement', fr: 'Engagement' } },
  { key: 'screening', label: { en: 'Screening', fr: 'Dépistage' } },
  { key: 'sessions', label: { en: 'Sessions', fr: 'Sessions' } },
  { key: 'doses', label: { en: 'Vaccine Doses', fr: 'Doses vaccin' } },
  { key: 'review', label: { en: 'Review', fr: 'Révision' } },
];

export default function WizardStepper({ current, setCurrent, lang }) {
  return (
    <div className="flex flex-col md:flex-row gap-1 md:gap-0 mb-6">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <button
            key={step.key}
            onClick={() => setCurrent(i)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 md:py-3 md:px-4 text-sm font-medium rounded-lg md:rounded-none md:first:rounded-l-lg md:last:rounded-r-lg transition-colors flex-1",
              active && "bg-primary text-primary-foreground",
              done && "bg-primary/10 text-primary",
              !active && !done && "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <span className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              active && "bg-white/20",
              done && "bg-primary text-primary-foreground",
              !active && !done && "bg-background"
            )}>
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="truncate">{step.label[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}