import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bookmark } from 'lucide-react';

export default function OneTimeIndicators() {
  const { lang } = useOutletContext();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {lang === 'en' ? 'One-Time Indicators' : 'Indicateurs ponctuels'}
      </h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bookmark className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">
            {lang === 'en' ? 'Coming Soon' : 'Bientôt disponible'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {lang === 'en'
              ? 'One-time indicators like baseline surveys and facility assessments will be tracked here.'
              : 'Les indicateurs ponctuels comme les enquêtes de base et les évaluations seront suivis ici.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}