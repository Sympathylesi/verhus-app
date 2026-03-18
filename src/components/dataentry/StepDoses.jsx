import React from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const vaccines = [
  'BCG', 'OPV0', 'OPV1', 'OPV2', 'OPV3',
  'IPV1', 'IPV2', 'Penta1', 'Penta2', 'Penta3',
  'PCV1', 'PCV2', 'PCV3', 'Rota1', 'Rota2',
  'MCV1', 'MCV2', 'Yellow Fever', 'Vitamin A', 'HPV'
];

const columns = [
  { key: '0_11m_male', label: '0-11m M' },
  { key: '0_11m_female', label: '0-11m F' },
  { key: '12_23m_male', label: '12-23m M' },
  { key: '12_23m_female', label: '12-23m F' },
  { key: '24_59m_male', label: '24-59m M' },
  { key: '24_59m_female', label: '24-59m F' },
  { key: 'hpv_9_13y', label: '9-13y HPV' },
];

export default function StepDoses({ lang, data, setData }) {
  const doses = data.vaccine_doses || {};

  const update = (vaccine, col, value) => {
    setData(prev => ({
      ...prev,
      vaccine_doses: {
        ...prev.vaccine_doses,
        [vaccine]: {
          ...(prev.vaccine_doses?.[vaccine] || {}),
          [col]: parseInt(value) || 0
        }
      }
    }));
  };

  const rowTotal = (vaccine) => {
    const v = doses[vaccine] || {};
    return Object.values(v).reduce((s, n) => s + (typeof n === 'number' ? n : 0), 0);
  };

  const grandTotal = vaccines.reduce((s, v) => s + rowTotal(v), 0);

  return (
    <Card>
      <CardContent className="pt-4 pb-2 overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-2 font-semibold sticky left-0 bg-card z-10 min-w-[90px]">
                {lang === 'en' ? 'Vaccine' : 'Vaccin'}
              </th>
              {columns.map(col => (
                <th key={col.key} className="text-center py-2 px-1 font-medium text-muted-foreground whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="text-center py-2 px-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {vaccines.map(vac => (
              <tr key={vac} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-1.5 pr-2 font-medium sticky left-0 bg-card z-10">{vac}</td>
                {columns.map(col => {
                  const isHPV = col.key === 'hpv_9_13y';
                  const disabled = (vac !== 'HPV' && isHPV) || (vac === 'HPV' && !isHPV);
                  return (
                    <td key={col.key} className="py-1.5 px-0.5">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        disabled={disabled}
                        value={disabled ? '' : (doses[vac]?.[col.key] || '')}
                        onChange={e => update(vac, col.key, e.target.value)}
                        className="h-7 w-16 text-center text-xs mx-auto disabled:opacity-20"
                      />
                    </td>
                  );
                })}
                <td className="py-1.5 px-2 text-center font-bold text-primary">{rowTotal(vac) || '–'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 border-t-2">
              <td className="py-2 font-bold sticky left-0 bg-muted/50 z-10">
                {lang === 'en' ? 'Grand Total' : 'Total général'}
              </td>
              <td colSpan={columns.length} />
              <td className="py-2 text-center">
                <Badge variant="secondary" className="text-sm font-bold">{grandTotal}</Badge>
              </td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}