import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];
const ANTIGENS = ['Penta1','Penta3','MCV1','MCV2','BCG','OPV3'];

function sumDoses(entries, antigen) {
  return entries.reduce((s, e) => {
    const d = e.vaccine_doses?.[antigen] || {};
    return s + AGE_KEYS.reduce((a, k) => a + (d[k] || 0), 0);
  }, 0);
}

function totalSessions(entries) {
  return entries.reduce((s, e) => s + (e.total_sessions || 0), 0);
}

export default function PortalPDVSearch() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;

  const [query,     setQuery]     = useState('');
  const [fRegion,   setFRegion]   = useState('');
  const [fDistrict, setFDistrict] = useState('');
  const [fYear,     setFYear]     = useState('');

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: healthAreas = [], isLoading: loadingHA } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
  });

  const regions   = useMemo(() => [...new Set(entries.map(e => e.region).filter(Boolean))].sort(), [entries]);
  const districts = useMemo(() => [...new Set(entries.filter(e => !fRegion || e.region === fRegion).map(e => e.district).filter(Boolean))].sort(), [entries, fRegion]);
  const years     = useMemo(() => [...new Set(entries.map(e => String(e.year)).filter(Boolean))].sort().reverse(), [entries]);

  // Group entries by HA
  const haMap = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const ha = e.health_area_name;
      if (!ha) return;
      if (!map[ha]) map[ha] = { region: e.region, district: e.district, entries: [] };
      map[ha].entries.push(e);
    });
    return map;
  }, [entries]);

  const filteredHAs = useMemo(() => {
    return Object.entries(haMap).filter(([name, info]) => {
      if (fRegion   && info.region !== fRegion) return false;
      if (fDistrict && info.district !== fDistrict) return false;
      if (fYear) {
        info.entries = info.entries.filter(e => String(e.year) === fYear);
        if (!info.entries.length) return false;
      }
      if (query && !name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [haMap, fRegion, fDistrict, fYear, query]);

  const isLoading = loadingEntries || loadingHA;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Recherche PDV','PDV Search / Vaccination Point Search')}</h1>
        <p className="text-xs text-muted-foreground">{t('Rechercher un point de vaccination par nom ou localisation','Search a vaccination point by name or location')}</p>
      </div>

      <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('Recherche','Search')}</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Nom du PDV…','PDV name…')}
              className="h-8 pl-7 pr-3 min-w-[180px] rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
        {[
          [t('Région','Region'), fRegion, v => { setFRegion(v); setFDistrict(''); }, regions, t('Toutes','All')],
          [t('District','District'), fDistrict, setFDistrict, districts, t('Tous','All')],
          [t('Année','Year'), fYear, setFYear, years, t('Toutes','All')],
        ].map(([label, val, setter, opts, ph]) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
            <select value={val} onChange={e => setter(e.target.value)}
              className="h-8 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">{ph}</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <button onClick={() => { setQuery(''); setFRegion(''); setFDistrict(''); setFYear(''); }}
          className="self-end h-8 px-3 rounded-md border text-xs text-muted-foreground hover:bg-muted">
          {t('Réinitialiser','Reset')}
        </button>
      </div>

      <div className="text-xs text-muted-foreground">{filteredHAs.length} {t('point(s) de vaccination','vaccination point(s)')}</div>

      {isLoading ? (
        <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-9 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <div className="rounded-lg border overflow-auto shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a2744] text-white">
                {[t('Point de vaccination','Vaccination Point'), t('Région','Region'), t('District','District'),
                  t('Séances','Sessions'), ...ANTIGENS].map(h => (
                  <th key={h} className="text-left px-3 py-3 font-semibold whitespace-nowrap border-r border-white/20">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredHAs.slice(0, 200).map(([name, info], i) => {
                const ha = healthAreas.find(h => h.name === name);
                const target = ha?.target_population || ha?.population0_11m || 0;
                return (
                  <tr key={name} className={i % 2 === 0 ? 'bg-background border-b' : 'bg-muted/10 border-b'}>
                    <td className="px-3 py-1.5 border-r font-medium">{name}</td>
                    <td className="px-3 py-1.5 border-r text-muted-foreground">{info.region || '—'}</td>
                    <td className="px-3 py-1.5 border-r text-muted-foreground">{info.district || '—'}</td>
                    <td className="px-3 py-1.5 border-r text-center">{totalSessions(info.entries).toLocaleString()}</td>
                    {ANTIGENS.map(a => {
                      const doses = sumDoses(info.entries, a);
                      const pct = target > 0 ? Math.round(doses / target * 100) : null;
                      return (
                        <td key={a} className="px-3 py-1.5 border-r text-right">
                          <div className="flex flex-col items-end leading-tight">
                            <span>{doses.toLocaleString()}</span>
                            {pct !== null && <span className="text-[10px] text-muted-foreground">{pct}%</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {filteredHAs.length === 0 && (
                <tr><td colSpan={4 + ANTIGENS.length} className="py-12 text-center text-muted-foreground">{t('Aucun résultat','No results')}</td></tr>
              )}
            </tbody>
          </table>
          {filteredHAs.length > 200 && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t">{t(`Affichage de 200 sur ${filteredHAs.length}`, `Showing 200 of ${filteredHAs.length}`)}</div>
          )}
        </div>
      )}
    </div>
  );
}
