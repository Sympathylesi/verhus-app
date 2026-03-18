import React from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = {
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

const styles = {
  warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  danger: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  info: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200',
};

export default function AlertsBanner({ alerts, lang }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 3).map((alert, i) => {
        const Icon = icons[alert.type] || Info;
        return (
          <div key={alert.id || i} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm", styles[alert.type] || styles.info)}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{(lang === 'fr' && alert.message_fr) ? alert.message_fr : alert.message}</span>
          </div>
        );
      })}
    </div>
  );
}