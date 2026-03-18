import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function StepMetadata({ lang, data, setData, healthAreas }) {
  const districts = [...new Set((healthAreas || []).map(h => h.district))].sort();
  const areas = (healthAreas || []).filter(h => h.district === data.district);

  const handleDistrictChange = (district) => {
    setData(prev => ({ ...prev, district, health_area_id: '', health_area_name: '' }));
  };

  const handleAreaChange = (areaId) => {
    const area = healthAreas.find(h => h.id === areaId);
    setData(prev => ({ ...prev, health_area_id: areaId, health_area_name: area?.name || '' }));
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <Label className="text-sm font-medium">{lang === 'en' ? 'District' : 'District'}</Label>
        <Select value={data.district || ''} onValueChange={handleDistrictChange}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder={lang === 'en' ? 'Select district...' : 'Sélectionner le district...'} />
          </SelectTrigger>
          <SelectContent>
            {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">{lang === 'en' ? 'Health Area' : 'Aire de santé'}</Label>
        <Select value={data.health_area_id || ''} onValueChange={handleAreaChange} disabled={!data.district}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder={lang === 'en' ? 'Select health area...' : 'Sélectionner l\'aire de santé...'} />
          </SelectTrigger>
          <SelectContent>
            {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">{lang === 'en' ? 'Week' : 'Semaine'}</Label>
          <Input
            type="number"
            min={1}
            max={52}
            value={data.week_number || ''}
            onChange={e => setData(prev => ({ ...prev, week_number: parseInt(e.target.value) || '' }))}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">{lang === 'en' ? 'Year' : 'Année'}</Label>
          <Input
            type="number"
            value={data.year || ''}
            onChange={e => setData(prev => ({ ...prev, year: parseInt(e.target.value) || '' }))}
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  );
}