import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

const AGE_KEYS = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];
const ANTIGENS = ['Penta1','Penta3','MCV1','MCV2','BCG','OPV3','Yellow Fever'];

function sumDoses(entry, antigen) {
  const d = entry.vaccine_doses?.[antigen] || {};
  return AGE_KEYS.reduce((s, k) => s + (d[k] || 0), 0);
}

function Sel({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="h-8 min-w-[130px] rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function PortalMonitoringLookup() {
  const { lang } = useOutletContext();
  const t = (fr, en) => lang === 'en' ? en : fr;

  const [fRegion,   setFRegion]   = useState('');
  const [fDistrict, setFDistrict] = useState('');
  const [fHA,       setFHA]       = useState('');
  const [fYear,     setFYear]     = useState('');
  const [fWeek,     setFWeek]     = useState('');
  const [fAntigen,  setFAntigen]  = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries_all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

  const regions   = useMemo(() => [...new Set(entries.map(e => e.region).filter(Boolean))].sort(), [entries]);
  const districts = useMemo(() => [...new Set(entries.filter(e => !fRegion || e.region === fRegion).map(e => e.district).filter(Boolean))].sort(), [entries, fRegion]);
  const has       = useMemo(() => [...new Set(entries.filter(e => (!fRegion || e.region === fRegion) && (!fDistrict || e.district === fDistrict)).map(e => e.health_area_name).filter(Boolean))].sort(), [entries, fRegion, fDistrict]);
  const years     = useMemo(() => [...new Set(entries.map(e => String(e.year)).filter(Boolean))].sort().reverse(), [entries]);
  const weeks     = useMemo(() => Array.from({ length: 52 }, (_, i) => String(i + 1)), []);

  const filtered = useMemo(() => entries.filter(e => {
    if (fRegion   && e.region !== fRegion) return false;
    if (fDistrict && e.district !== fDistrict) return false;
    if (fHA       && e.health_area_name !== fHA) return false;
    if (fYear     && String(e.year) !== fYear) return false;
    if (fWeek     && String(e.week_number) !== fWeek) return false;
    return true;
  }), [entries, fRegion, fDistrict, fHA, fYear, fWeek]);

  const displayAntigens = fAntigen ? [fAntigen] : ANTIGENS;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">{t('Recherche de suivi','Monitoring Search / Lookup')}</h1>
        <p className="text-xs text-muted-foreground">{t('Filtrer et consulter les données de vaccination','Filter and look up vaccination data')}</p>
      </div>

      <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border">
        <Sel label={t('Région','Region')}       value={fRegion}   onChange={v => { setFRegion(v); setFDistrict(''); setFHA(''); }} options={regions}   placeholder={t('Toutes','All')} />
        <Sel label={t('District','District')}   value={fDistrict} onChange={v => { setFDistrict(v); setFHA(''); }}                options={districts} placeholder={t('Tous','All')} />
        <Sel label={t('Aire de santé','Health Area')} value={fHA} onChange={setFHA}                                              options={has}       placeholder={t('Toutes','All')} />
        <Sel label={t('Année','Year')}          value={fYear}     onChange={setFYear}                                            options={years}     placeholder={t('Toutes','All')} />
        <Sel label={t('Semaine','Week')}        value={fWeek}     onChange={setFWeek}                                            options={weeks}     placeholder={t('Toutes','All')} />
        <Sel label={t('Antigène','Antigen')}    value={fAntigen}  onChange={setFAntigen}                                         options={ANTIGENS}  placeholder={t('Tous','All')} />
        <button onClick={() => { setFRegion(''); setFDistrict(''); setFHA(''); setFYear(''); setFWeek(''); setFAntigen(''); }}
          className="self-end h-8 px-3 rounded-md border text-xs text-muted-foreground hover:bg-muted flex items-center gap-1.5">
          <Search className="h-3 w-3" /> {t('Réinitialiser','Reset')}
        </button>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} {t('enregistrement(s)','record(s)')}</div>

      {isLoading ? (
        <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-9 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <div className="rounded-lg border overflow-auto shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a2744] text-white">
                {[t('Région','Region'), t('District','District'), t('Aire de santé','Health Area'), t('Année','Year'), t('Sem.','Wk'), ...displayAntigens].map(h => (
                  <th key={h} className="text-left px-3 py-3 font-semibold whitespace-nowrap border-r border-white/20">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((e, i) => (
                <tr key={e.id || i} className={i % 2 === 0 ? 'bg-background border-b' : 'bg-muted/10 border-b'}>
                  <td className="px-3 py-1.5 border-r">{e.region || '—'}</td>
                  <td className="px-3 py-1.5 border-r">{e.district || '—'}</td>
                  <td className="px-3 py-1.5 border-r">{e.health_area_name || '—'}</td>
                  <td className="px-3 py-1.5 border-r text-center">{e.year || '—'}</td>
                  <td className="px-3 py-1.5 border-r text-center">{e.week_number || '—'}</td>
                  {displayAntigens.map(a => (
                    <td key={a} className="px-3 py-1.5 border-r text-right">{sumDoses(e, a).toLocaleString()}</td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5 + displayAntigens.length} className="py-12 text-center text-muted-foreground">{t('Aucun résultat','No results')}</td></tr>
              )}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t">{t(`Affichage de 200 sur ${filtered.length}`, `Showing 200 of ${filtered.length}`)}</div>
          )}
        </div>
      )}
    </div>
  );
}
