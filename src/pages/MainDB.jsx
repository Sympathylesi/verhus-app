import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileSpreadsheet, Database, ChevronDown, ChevronUp, X } from 'lucide-react';
import { COLUMN_DEFS, COLUMN_GROUPS, flattenRow } from '@/lib/mainDbColumns';
import { exportToExcel } from '@/lib/excelExport';
import { useFilterPresets } from '@/hooks/useFilterPresets';
import FilterPanel from '@/components/maindb/FilterPanel';
import ColumnVisibilityPanel from '@/components/maindb/ColumnVisibilityPanel';
import PresetManager from '@/components/maindb/PresetManager';
import FooterTotals from '@/components/maindb/FooterTotals';
import VirtualTable from '@/components/maindb/VirtualTable';

// ─── Default column visibility (only defaultVisible=true cols shown initially) ─
const DEFAULT_VISIBILITY = Object.fromEntries(
  COLUMN_DEFS.map(c => [c.id, c.defaultVisible])
);

const EMPTY_FILTERS = {
  region: '', district: '', health_area_name: '', community: '',
  strategy: '', status: '', scr_stock_out: '',
  week_number_from: '', week_number_to: '',
  year_from: '', year_to: '',
  groupBy: '',
};

function applyFilters(rows, f, globalSearch) {
  return rows.filter(r => {
    if (f.region           && r.region           !== f.region)           return false;
    if (f.district         && r.district         !== f.district)         return false;
    if (f.health_area_name && r.health_area_name !== f.health_area_name) return false;
    if (f.community        && r.community        !== f.community)        return false;
    if (f.strategy         && r.strategy         !== f.strategy)         return false;
    if (f.status           && r.status           !== f.status)           return false;
    if (f.scr_stock_out    && r.scr_stock_out    !== f.scr_stock_out)    return false;
    if (f.week_number_from && Number(r.week_number) < Number(f.week_number_from)) return false;
    if (f.week_number_to   && Number(r.week_number) > Number(f.week_number_to))   return false;
    if (f.year_from        && Number(r.year) < Number(f.year_from))      return false;
    if (f.year_to          && Number(r.year) > Number(f.year_to))        return false;
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      const searchable = [r.region, r.district, r.health_area_name, r.community, r.strategy, String(r.week_number), String(r.year)];
      if (!searchable.some(v => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  });
}

function unique(rows, key) {
  return [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();
}

export default function MainDB() {
  const { lang } = useOutletContext();
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [filters, setFilters]         = useState(EMPTY_FILTERS);

  // Cascade-reset downstream filters when a parent filter changes
  const setFiltersWithCascade = useCallback((updater) => {
    setFilters(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next.region !== prev.region) { next.district = ''; next.health_area_name = ''; }
      if (next.district !== prev.district) next.health_area_name = '';
      return next;
    });
  }, []);
  const [visibility, setVisibility]   = useState(DEFAULT_VISIBILITY);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef(null);
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting]     = useState(false);

  const { presets, save: savePreset, remove: deletePreset } = useFilterPresets();

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setGlobalSearch(searchInput), 200);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const { data: rawEntries = [], isLoading } = useQuery({
    queryKey: ['entries-all'],
    queryFn: () => base44.entities.WeeklyEntry.list(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Flatten once ───────────────────────────────────────────────────────────
  const flatRows = useMemo(
    () => rawEntries.map((e, i) => flattenRow(e, i)),
    [rawEntries]
  );

  // ── HealthArea entity (authoritative health area list) ──────────────────────
  const { data: healthAreaEntities = [] } = useQuery({
    queryKey: ['healthAreas'],
    queryFn: () => base44.entities.HealthArea.list(),
    staleTime: 10 * 60 * 1000,
  });

  // ── GeoJSON (authoritative region/district lists) ─────────────────────────
  const { data: regionsGeo } = useQuery({
    queryKey: ['cameroon-regions-geojson'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}cameroon-regions.geojson`).then(r => r.json()),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const { data: districtsGeo } = useQuery({
    queryKey: ['cameroon-districts-geojson'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}cameroon-districts.geojson`).then(r => r.json()),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // ── Filter options ─────────────────────────────────────────────────────────
  const options = useMemo(() => {
    const regions = regionsGeo
      ? [...new Set(regionsGeo.features.map(f => f.properties.region).filter(Boolean))].sort()
      : unique(flatRows, 'region');

    const allDistricts = districtsGeo
      ? districtsGeo.features.map(f => ({ district: f.properties.district, region: f.properties.region }))
      : flatRows.map(r => ({ district: r.district, region: r.region }));

    const districts = [...new Set(
      allDistricts
        .filter(d => !filters.region || d.region === filters.region)
        .map(d => d.district)
        .filter(Boolean)
    )].sort();

    return {
      regions,
      districts,
      healthAreas: [...new Set(
        healthAreaEntities
          .filter(ha => !filters.region   || ha.region   === filters.region)
          .filter(ha => !filters.district || ha.district === filters.district)
          .map(ha => ha.name)
          .filter(Boolean)
      )].sort(),
      communities: unique(flatRows, 'community'),
      strategies:  unique(flatRows, 'strategy'),
      statuses:    unique(flatRows, 'status'),
    };
  }, [regionsGeo, districtsGeo, flatRows, healthAreaEntities, filters.region, filters.district]);

  // ── Apply filters ──────────────────────────────────────────────────────────
  const filteredRows = useMemo(
    () => applyFilters(flatRows, filters, globalSearch),
    [flatRows, filters, globalSearch]
  );

  // ── Visible columns ────────────────────────────────────────────────────────
  const visibleCols = useMemo(
    () => COLUMN_DEFS.filter(c => visibility[c.id] !== false),
    [visibility]
  );

  // ── Column visibility handlers ─────────────────────────────────────────────
  const toggleCol = useCallback(id => {
    setVisibility(v => ({ ...v, [id]: v[id] === false ? true : false }));
  }, []);

  const toggleGroup = useCallback((group, show) => {
    setVisibility(v => {
      const next = { ...v };
      COLUMN_DEFS.filter(c => c.group === group).forEach(c => { next[c.id] = show; });
      return next;
    });
  }, []);

  // ── Preset handlers ────────────────────────────────────────────────────────
  const handleSavePreset = useCallback(name => savePreset(name, filters), [filters, savePreset]);
  const handleLoadPreset = useCallback(p => setFiltersWithCascade({ ...EMPTY_FILTERS, ...p.filters }), [setFiltersWithCascade]);

  // ── Active filter count + chips ───────────────────────────────────────────
  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'groupBy' && v !== ''
  ).length + (globalSearch ? 1 : 0);

  const FILTER_LABELS = {
    region: 'Region', district: 'District', health_area_name: 'Health Area',
    community: 'Community', strategy: 'Strategy', status: 'Status',
    scr_stock_out: 'Stock-Out',
    week_number_from: 'Week ≥', week_number_to: 'Week ≤',
    year_from: 'Year ≥', year_to: 'Year ≤',
  };

  const activeChips = [
    ...Object.entries(filters)
      .filter(([k, v]) => k !== 'groupBy' && v !== '')
      .map(([k, v]) => ({ key: k, label: `${FILTER_LABELS[k] ?? k}: ${v}` })),
    ...(globalSearch ? [{ key: '__search__', label: `Search: ${globalSearch}` }] : []),
  ];

  const clearChip = useCallback((key) => {
    if (key === '__search__') { setSearchInput(''); setGlobalSearch(''); return; }
    setFiltersWithCascade(f => ({ ...f, [key]: '' }));
  }, [setFiltersWithCascade]);

  // ── Excel export ───────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExporting(true);
    try { exportToExcel(filteredRows, visibleCols, 'VERHUS_MainDB'); }
    finally { setExporting(false); }
  }, [filteredRows, visibleCols]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
            <Database className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              {t('Main Database', 'Base de données principale')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? t('Loading…', 'Chargement…')
                : `${filteredRows.length.toLocaleString()} / ${flatRows.length.toLocaleString()} ${t('records', 'enreg.')} · ${visibleCols.length} ${t('columns', 'colonnes')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PresetManager
            presets={presets}
            onSave={handleSavePreset}
            onLoad={handleLoadPreset}
            onDelete={deletePreset}
          />
          <ColumnVisibilityPanel
            visibility={visibility}
            onToggle={toggleCol}
            onToggleGroup={toggleGroup}
          />
          <Button
            variant="outline" size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleExport}
            disabled={exporting || filteredRows.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            {exporting
              ? t('Exporting…', 'Export…')
              : t(`Export ${filteredRows.length.toLocaleString()} rows`, `Exporter ${filteredRows.length.toLocaleString()} lignes`)}
          </Button>
        </div>
      </div>

      {/* ── Search + filter toggle ── */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t('Quick search…', 'Recherche rapide…')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button
          variant="outline" size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setShowFilters(s => !s)}
        >
          {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {t('Filters', 'Filtres')}
          {activeFilterCount > 0 && (
            <Badge className="h-4 px-1 text-[9px] bg-violet-600">{activeFilterCount}</Badge>
          )}
        </Button>
      </div>

      {/* ── Active filter chips ── */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeChips.map(chip => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[11px] font-medium"
            >
              {chip.label}
              <button onClick={() => clearChip(chip.key)} className="hover:text-violet-900 dark:hover:text-violet-100">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Filter panel ── */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          setFilters={setFiltersWithCascade}
          options={options}
          onReset={() => setFiltersWithCascade(EMPTY_FILTERS)}
        />
      )}

      {/* ── Loading skeleton ── */}
      {isLoading ? (
        <div className="border rounded-lg overflow-hidden">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="flex gap-2 px-3 py-2 border-b animate-pulse">
              {Array(9).fill(0).map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Virtualized table ── */}
          <div className={activeFilterCount > 0 ? 'transition-opacity duration-150' : ''}>
            <VirtualTable
              rows={filteredRows}
              visibleCols={visibleCols}
              groupBy={filters.groupBy || undefined}
              globalFilter={globalSearch}
              onClearFilters={() => { setFiltersWithCascade(EMPTY_FILTERS); setSearchInput(''); setGlobalSearch(''); }}
              hasActiveFilters={activeFilterCount > 0}
            />
          </div>

          {/* ── Footer totals ── */}
          <FooterTotals rows={filteredRows} visibleCols={visibleCols} />
        </>
      )}
    </div>
  );
}
