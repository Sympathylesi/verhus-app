import { useState } from 'react';

export function useCollapsible() {
  const [expandedRegions,   setExpandedRegions]   = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());

  function toggleRegion(r) {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(r)) {
        next.delete(r);
        setExpandedDistricts(pd => {
          const nd = new Set(pd);
          [...nd].filter(k => k.startsWith(r + '::')).forEach(k => nd.delete(k));
          return nd;
        });
      } else next.add(r);
      return next;
    });
  }

  function toggleDistrict(r, d) {
    const key = `${r}::${d}`;
    setExpandedDistricts(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return { expandedRegions, expandedDistricts, toggleRegion, toggleDistrict };
}
