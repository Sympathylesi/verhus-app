import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const sessionTypes = [
  { key: 'mobile', label: { en: 'Mobile', fr: 'Mobile' } },
  { key: 'outreach', label: { en: 'Outreach', fr: 'Avancée' } },
  { key: 'fixed', label: { en: 'Fixed', fr: 'Fixe' } },
  { key: 'door_to_door', label: { en: 'Door-to-Door', fr: 'Porte-à-porte' } },
];

const ageBands = [
  { key: '0_11m', label: '0-11m' },
  { key: '12_23m', label: '12-23m' },
  { key: '24_59m', label: '24-59m' },
];

const genders = [
  { key: 'male', label: { en: 'M', fr: 'M' } },
  { key: 'female', label: { en: 'F', fr: 'F' } },
];

export default function StepSessions({ lang, data, setData }) {
  const [activeTab, setActiveTab] = useState('mobile');
  const sessions = data.vaccination_sessions || {};

  const update = (type, ageGender, value) => {
    setData(prev => ({
      ...prev,
      vaccination_sessions: {
        ...prev.vaccination_sessions,
        [type]: {
          ...(prev.vaccination_sessions?.[type] || {}),
          [ageGender]: parseInt(value) || 0
        }
      }
    }));
  };

  const getTotal = (type) => {
    const s = sessions[type] || {};
    return Object.values(s).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        {sessionTypes.map(st => (
          <TabsTrigger key={st.key} value={st.key} className="text-xs">
            {st.label[lang]}
          </TabsTrigger>
        ))}
      </TabsList>

      {sessionTypes.map(st => (
        <TabsContent key={st.key} value={st.key}>
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">
                        {lang === 'en' ? 'Age Band' : 'Tranche d\'âge'}
                      </th>
                      {genders.map(g => (
                        <th key={g.key} className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">{g.label[lang]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ageBands.map(ab => (
                      <tr key={ab.key} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium text-xs">{ab.label}</td>
                        {genders.map(g => (
                          <td key={g.key} className="py-2 px-1">
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={sessions[st.key]?.[`${ab.key}_${g.key}`] || ''}
                              onChange={e => update(st.key, `${ab.key}_${g.key}`, e.target.value)}
                              className="h-8 w-20 text-center mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50">
                      <td className="py-2 pr-4 font-semibold text-xs">{lang === 'en' ? 'Total' : 'Total'}</td>
                      <td colSpan={2} className="py-2 text-center font-bold text-primary">
                        {getTotal(st.key)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}