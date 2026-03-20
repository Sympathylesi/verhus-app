import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

const groups = [
  { key: 'religious',   label: { en: 'Religious Leaders',   fr: 'Leaders religieux' } },
  { key: 'community',   label: { en: 'Community Leaders',   fr: 'Leaders communautaires' } },
  { key: 'traditional', label: { en: 'Traditional Leaders', fr: 'Leaders traditionnels' } },
];

const levels = [
  { key: 'informative',   label: { en: 'Informative',   fr: 'Informatif' } },
  { key: 'consultative',  label: { en: 'Consultative',  fr: 'Consultatif' } },
  { key: 'collaborative', label: { en: 'Collaborative', fr: 'Collaboratif' } },
];

export default function StepEngagement({ lang, data, setData }) {
  const engagement = data.community_engagement || {};
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const update = (group, level, gender, value) => {
    setData(prev => ({
      ...prev,
      community_engagement: {
        ...prev.community_engagement,
        [group]: {
          ...(prev.community_engagement?.[group] || {}),
          [level]: {
            ...(prev.community_engagement?.[group]?.[level] || {}),
            [gender]: parseInt(value) || 0,
          }
        }
      }
    }));
  };

  const getGroupTotal = (group) =>
    levels.reduce((s, lvl) => {
      const l = engagement[group]?.[lvl.key] || {};
      return s + (l.male || 0) + (l.female || 0);
    }, 0);

  const getLevelTotal = (group, level) => {
    const l = engagement[group]?.[level] || {};
    return (l.male || 0) + (l.female || 0);
  };

  return (
    <Accordion type="multiple" defaultValue={groups.map(g => g.key)} className="space-y-3">
      {groups.map(group => {
        const groupTotal = getGroupTotal(group.key);
        return (
          <AccordionItem key={group.key} value={group.key} className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              <span className="flex items-center gap-3">
                {group.label[lang]}
                {groupTotal > 0 && (
                  <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {groupTotal} {t('engaged', 'engagés')}
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium px-1">
                <div>{t('Level', 'Niveau')}</div>
                <div className="text-center">{t('Male', 'Homme')}</div>
                <div className="text-center">{t('Female', 'Femme')}</div>
                <div className="text-center">{t('Total', 'Total')}</div>
              </div>
              {levels.map(lvl => {
                const lvlTotal = getLevelTotal(group.key, lvl.key);
                return (
                  <div key={lvl.key} className={cn(
                    'grid grid-cols-4 gap-2 items-center px-1 py-1.5 rounded-md',
                    lvlTotal > 0 && 'bg-primary/5'
                  )}>
                    <span className="text-xs font-medium">{lvl.label[lang]}</span>
                    <Input
                      type="number" inputMode="numeric" min={0}
                      value={engagement[group.key]?.[lvl.key]?.male || ''}
                      onChange={e => update(group.key, lvl.key, 'male', e.target.value)}
                      className="h-8 text-center text-xs"
                    />
                    <Input
                      type="number" inputMode="numeric" min={0}
                      value={engagement[group.key]?.[lvl.key]?.female || ''}
                      onChange={e => update(group.key, lvl.key, 'female', e.target.value)}
                      className="h-8 text-center text-xs"
                    />
                    <div className={cn(
                      'h-8 flex items-center justify-center rounded-md border text-xs font-bold',
                      lvlTotal > 0 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted text-muted-foreground/40'
                    )}>
                      {lvlTotal || '–'}
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end pt-1 border-t">
                <span className="text-xs text-muted-foreground mr-2">{t('Total Engaged', 'Total engagés')}</span>
                <span className={cn('text-sm font-bold', groupTotal > 0 ? 'text-primary' : 'text-muted-foreground/40')}>
                  {groupTotal || '–'}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}