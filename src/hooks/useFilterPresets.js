import { useState, useCallback } from 'react';

const STORAGE_KEY = 'verhus_filter_presets';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function useFilterPresets() {
  const [presets, setPresets] = useState(load);

  const save = useCallback((name, filters) => {
    setPresets(prev => {
      const next = [...prev.filter(p => p.name !== name), { name, filters, savedAt: Date.now() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((name) => {
    setPresets(prev => {
      const next = prev.filter(p => p.name !== name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { presets, save, remove };
}
