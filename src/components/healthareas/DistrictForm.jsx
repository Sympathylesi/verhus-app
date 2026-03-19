import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DistrictForm({ open, onClose, onSubmit, initial, lang, geoRegions = {} }) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    setName(initial?.name ?? '');
    setRegion(initial?.region ?? '');
  }, [initial, open]);

  const t = (en, fr) => lang === 'fr' ? fr : en;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !region) return;
    onSubmit({ name: name.trim(), region });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {initial ? t('Edit District', 'Modifier le district') : t('New District', 'Nouveau district')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>{t('Region', 'Région')}</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select region', 'Choisir une région')} />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(geoRegions).sort().map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district-name">{t('Name', 'Nom')}</Label>
            <Input
              id="district-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('e.g. Mfoundi', 'ex. Mfoundi')}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('Cancel', 'Annuler')}</Button>
            <Button type="submit" disabled={!name.trim() || !region}>{t('Save', 'Enregistrer')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
