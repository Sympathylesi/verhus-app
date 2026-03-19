import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar } from 'lucide-react';

const STRATEGIES = ['Fixed', 'Mobile', 'Outreach', 'Door-to-Door'];

function weekDateRange(year, week) {
  const jan4 = new Date(year, 0, 4);
  const startOfW1 = new Date(jan4);
  startOfW1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(startOfW1);
  start.setDate(startOfW1.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}

export default function StepMetadata({ lang, data, setData, healthAreas, geoRegions = {} }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  // Regions and districts from GeoJSON (all 58 districts, same source as map)
  const regions = Object.keys(geoRegions).sort();
  const filteredDistricts = data.region ? (geoRegions[data.region] || []) : [];
  const filteredAreas = (healthAreas || []).filter(ha => !data.district || ha.district === data.district);
  const noAreasConfigured = data.district && filteredAreas.length === 0;

  const handleRegionChange = (region) => {
    setData(prev => ({ ...prev, region, district: '', health_area_id: '', health_area_name: '' }));
  };

  const handleDistrictChange = (district) => {
    setData(prev => ({ ...prev, district, health_area_id: '', health_area_name: '' }));
  };

  const handleAreaChange = (areaId) => {
    const area = (healthAreas || []).find(h => h.id === areaId);
    setData(prev => ({ ...prev, health_area_id: areaId, health_area_name: area?.name || '', region: area?.region || prev.region, district: area?.district || prev.district }));
  };

  const dateRange = data.year && data.week_number ? weekDateRange(data.year, data.week_number) : null;

  return (
    <div className="space-y-5 max-w-xl">
      {/* Location cascade */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t('Location', 'Localisation')}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('Region', 'Région')}</Label>
            <Select value={data.region || ''} onValueChange={handleRegionChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select region…', 'Sélectionner la région…')} />
              </SelectTrigger>
              <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('District', 'District')}</Label>
            <Select value={data.district || ''} onValueChange={handleDistrictChange} disabled={!data.region}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select district…', 'Sélectionner le district…')} />
              </SelectTrigger>
              <SelectContent>
                {filteredDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('Health Area', 'Aire de santé')}</Label>
            {noAreasConfigured ? (
              <>
                <Input
                  placeholder={t('Enter health area name…', 'Nom de l\'aire de santé…')}
                  value={data.health_area_name || ''}
                  onChange={e => setData(prev => ({ ...prev, health_area_name: e.target.value, health_area_id: '' }))}
                  disabled={!data.district}
                />
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  {t('No health areas configured for this district. You can type a name.', 'Aucune aire configurée pour ce district. Vous pouvez saisir un nom.')}
                </p>
              </>
            ) : (
              <Select value={data.health_area_id || ''} onValueChange={handleAreaChange} disabled={!data.district}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select health area…', 'Sélectionner l\'aire de santé…')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredAreas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Period */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t('Reporting Period', 'Période de rapport')}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('Week', 'Semaine')}</Label>
              <Input
                type="number" min={1} max={52}
                value={data.week_number || ''}
                onChange={e => setData(prev => ({ ...prev, week_number: parseInt(e.target.value) || '' }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('Year', 'Année')}</Label>
              <Input
                type="number"
                value={data.year || ''}
                onChange={e => setData(prev => ({ ...prev, year: parseInt(e.target.value) || '' }))}
              />
            </div>
          </div>

          {dateRange && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              📅 {dateRange}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Strategy */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Label className="text-sm font-semibold">{t('Vaccination Strategy', 'Stratégie de vaccination')}</Label>
          <div className="flex flex-wrap gap-2">
            {STRATEGIES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setData(prev => ({ ...prev, strategy: s }))}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                  data.strategy === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
