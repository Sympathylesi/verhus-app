import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

const groups = [
  { key: 'religious', label: { en: 'Religious Leaders', fr: 'Leaders religieux' } },
  { key: 'community', label: { en: 'Community Leaders', fr: 'Leaders communautaires' } },
  { key: 'traditional', label: { en: 'Traditional Leaders', fr: 'Leaders traditionnels' } },
];

const levels = [
  { value: 'informative', label: { en: 'Informative', fr: 'Informatif' } },
  { value: 'consultative', label: { en: 'Consultative', fr: 'Consultatif' } },
  { value: 'collaborative', label: { en: 'Collaborative', fr: 'Collaboratif' } },
];

export default function StepEngagement({ lang, data, setData }) {
  const engagement = data.community_engagement || {};

  const update = (group, field, value) => {
    setData(prev => ({
      ...prev,
      community_engagement: {
        ...prev.community_engagement,
        [group]: { ...(prev.community_engagement?.[group] || {}), [field]: value }
      }
    }));
  };

  return (
    <Accordion type="multiple" defaultValue={groups.map(g => g.key)} className="space-y-3">
      {groups.map(group => (
        <AccordionItem key={group.key} value={group.key} className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold py-3">{group.label[lang]}</AccordionTrigger>
          <AccordionContent className="pb-4 space-y-4">
            <div>
              <Label className="text-xs">{lang === 'en' ? 'Number engaged' : 'Nombre engagé'}</Label>
              <Input
                type="number"
                min={0}
                value={engagement[group.key]?.count || ''}
                onChange={e => update(group.key, 'count', parseInt(e.target.value) || 0)}
                className="mt-1 w-32"
              />
            </div>
            <div>
              <Label className="text-xs mb-2 block">{lang === 'en' ? 'Engagement level' : 'Niveau d\'engagement'}</Label>
              <div className="flex gap-1">
                {levels.map(lvl => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => update(group.key, 'level', lvl.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      engagement[group.key]?.level === lvl.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {lvl.label[lang]}
                  </button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}