import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DistrictForm({ open, onClose, onSubmit, initial, lang }) {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(initial?.name ?? '');
  }, [initial, open]);

  const t = (en, fr) => lang === 'fr' ? fr : en;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
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
            <Button type="submit" disabled={!name.trim()}>{t('Save', 'Enregistrer')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
