import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EMPTY = { name: '', region: '', district: '', population0_11m: '', population12_23m: '', population24_59m: '' };

export default function HealthAreaForm({ open, onClose, onSubmit, initial, geoRegions = {}, lang, defaultRegion = '', defaultDistrict = '' }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(initial
      ? {
          name: initial.name ?? '',
          region: initial.region ?? '',
          district: initial.district ?? '',
          population0_11m: initial.population0_11m ?? '',
          population12_23m: initial.population12_23m ?? '',
          population24_59m: initial.population24_59m ?? '',
        }
      : { ...EMPTY, region: defaultRegion, district: defaultDistrict }
    );
  }, [initial, open, defaultRegion, defaultDistrict]);

  const t = (en, fr) => lang === 'fr' ? fr : en;
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const regions = Object.keys(geoRegions).sort();
  const geoDistricts = form.region ? (geoRegions[form.region] || []) : [];
  // Keep the current value in the list even if geoRegions hasn't loaded yet
  const districts = form.district && !geoDistricts.includes(form.district)
    ? [...geoDistricts, form.district].sort()
    : geoDistricts;

  const handleRegionChange = (region) => setForm(f => ({ ...f, region, district: '' }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.region || !form.district) return;
    onSubmit({
      name: form.name.trim(),
      region: form.region,
      district: form.district,
      population0_11m: form.population0_11m !== '' ? parseInt(form.population0_11m) : null,
      population12_23m: form.population12_23m !== '' ? parseInt(form.population12_23m) : null,
      population24_59m: form.population24_59m !== '' ? parseInt(form.population24_59m) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? t('Edit Health Area', "Modifier l'aire de santé") : t('New Health Area', "Nouvelle aire de santé")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>{t('Name', 'Nom')}</Label>
            <Input
              value={form.name}
              onChange={set('name')}
              placeholder={t('e.g. Biyem-Assi', 'ex. Biyem-Assi')}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('Region', 'Région')}</Label>
            <Select value={form.region} onValueChange={handleRegionChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select region', 'Choisir une région')} />
              </SelectTrigger>
              <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('District', 'District')}</Label>
            <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v }))} disabled={!form.region}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select district', 'Choisir un district')} />
              </SelectTrigger>
              <SelectContent>
                {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">0–11 {t('months', 'mois')}</Label>
              <Input type="number" min={0} value={form.population0_11m} onChange={set('population0_11m')} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">12–23 {t('months', 'mois')}</Label>
              <Input type="number" min={0} value={form.population12_23m} onChange={set('population12_23m')} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">24–59 {t('months', 'mois')}</Label>
              <Input type="number" min={0} value={form.population24_59m} onChange={set('population24_59m')} placeholder="0" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('Cancel', 'Annuler')}</Button>
            <Button type="submit" disabled={!form.name.trim() || !form.region || !form.district}>{t('Save', 'Enregistrer')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
