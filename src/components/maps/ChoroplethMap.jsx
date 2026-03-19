import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Play, Pause, SkipBack, SkipForward,
  ShieldCheck, Users, AlertTriangle, Activity, X, ChevronLeft,
} from 'lucide-react';

const CMR_BOUNDS = [[1.4, 8.3], [13.2, 16.4]];
const CMR_CENTER = [5.5, 12.3];

const LAYERS = [
  { id: 'dtp3',     icon: ShieldCheck,   label: { en: 'DTP3 %',     fr: 'DTP3 %' },     field: 'dtp3Pct',     unit: '%',    thresholds: [20,40,60,80],     colors: ['#fef2f2','#fca5a5','#f97316','#eab308','#22c55e'] },
  { id: 'mcv2',     icon: ShieldCheck,   label: { en: 'MCV2 %',     fr: 'MCV2 %' },     field: 'mcv2Pct',     unit: '%',    thresholds: [20,40,60,80],     colors: ['#f5f3ff','#c4b5fd','#8b5cf6','#6d28d9','#4c1d95'] },
  { id: 'screened', icon: Users,         label: { en: '% Screened', fr: '% Dépistés' }, field: 'screenedPct', unit: '%',    thresholds: [20,40,60,80],     colors: ['#eff6ff','#93c5fd','#3b82f6','#1d4ed8','#1e3a8a'] },
  { id: 'sam',      icon: AlertTriangle, label: { en: 'SAM /100',   fr: 'MAS /100' },   field: 'samRate',     unit: '/100', thresholds: [2,5,10,15],       colors: ['#f0fdf4','#fef9c3','#fde68a','#f97316','#dc2626'] },
  { id: 'sessions', icon: Activity,      label: { en: 'Sessions',   fr: 'Sessions' },   field: 'sessions',    unit: '',     thresholds: [100,300,600,1000], colors: ['#f0fdfa','#99f6e4','#2dd4bf','#0d9488','#134e4a'] },
];

function getColor(layer, value) {
  if (value == null) return '#e2e8f0';
  for (let i = layer.thresholds.length - 1; i >= 0; i--) {
    if (value >= layer.thresholds[i]) return layer.colors[i + 1];
  }
  return layer.colors[0];
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend({ layer, lang }) {
  const labels = [
    `< ${layer.thresholds[0]}${layer.unit}`,
    ...layer.thresholds.map((t, i) =>
      i < layer.thresholds.length - 1
        ? `${t}–${layer.thresholds[i + 1]}${layer.unit}`
        : `≥ ${t}${layer.unit}`
    ),
  ];
  return (
    <div className="absolute bottom-14 left-3 z-[1000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg p-2.5 text-xs pointer-events-none">
      <p className="font-semibold mb-1.5 text-gray-700 dark:text-gray-200">{layer.label[lang]}</p>
      {layer.colors.map((color, i) => (
        <div key={i} className="flex items-center gap-1.5 mb-0.5">
          <span className="w-4 h-3 rounded-sm inline-block border border-gray-200 dark:border-gray-600 shrink-0" style={{ background: color }} />
          <span className="text-gray-600 dark:text-gray-300">{labels[i]}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
        <span className="w-4 h-3 rounded-sm inline-block border border-gray-200 dark:border-gray-600 shrink-0" style={{ background: '#e2e8f0' }} />
        <span className="text-gray-400 dark:text-gray-500">No data</span>
      </div>
    </div>
  );
}

// ─── Choropleth layer — uses imperative Leaflet API to avoid stale-closure bugs
// Re-mounts entirely (via `key`) when drill state changes so callbacks are always fresh.
function ChoroplethLayer({ features, dataIndex, activeLayer, onFeatureClick, isDrillMode }) {
  const map = useMap();
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!map || !features.length) return;

    // Remove previous layers
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
      layerGroupRef.current.remove();
    }

    const group = L.featureGroup().addTo(map);
    layerGroupRef.current = group;

    features.forEach(feature => {
      const p = feature.properties;
      // In drill mode colour by district name; in overview colour by region
      const lookupKey = isDrillMode ? p.district : p.region;
      const d = dataIndex[lookupKey];
      const value = d ? d[activeLayer.field] : null;
      const displayVal = value != null ? `${value}${activeLayer.unit}` : 'No data';
      const label = isDrillMode ? p.district : p.region;

      const poly = L.geoJSON(feature, {
        style: {
          fillColor: getColor(activeLayer, value),
          fillOpacity: 0.78,
          color: '#ffffff',
          weight: isDrillMode ? 1.5 : 2,
        },
      });

      poly.bindTooltip(
        `<div style="font-weight:600;font-size:12px;margin-bottom:2px">${label}</div>` +
        (isDrillMode ? `<div style="font-size:10px;color:#9ca3af;margin-bottom:2px">${p.region}</div>` : '') +
        `<div style="font-size:11px;color:#6b7280">${activeLayer.label['en']}: <b>${displayVal}</b></div>`,
        { sticky: true, className: 'leaflet-tooltip-custom' }
      );

      poly.on('mouseover', e => {
        e.target.setStyle({ weight: 3, color: '#1e293b', fillOpacity: 0.92 });
        e.target.bringToFront();
      });
      poly.on('mouseout', e => {
        e.target.setStyle({
          fillColor: getColor(activeLayer, value),
          fillOpacity: 0.78,
          color: '#ffffff',
          weight: isDrillMode ? 1.5 : 2,
        });
      });
      poly.on('click', () => {
        onFeatureClick(p, d, poly);
      });

      group.addLayer(poly);
    });

    return () => {
      group.clearLayers();
      group.remove();
      layerGroupRef.current = null;
    };
  }, [features, dataIndex, activeLayer, isDrillMode, onFeatureClick, map]);

  return null;
}

// ─── Fit-bounds on drill change ───────────────────────────────────────────────
function FitBoundsOnChange({ bounds }) {
  const map = useMap();
  const prevBounds = useRef(null);

  useEffect(() => {
    if (bounds === prevBounds.current) return;
    prevBounds.current = bounds;
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9, animate: true });
    } else {
      map.fitBounds(CMR_BOUNDS, { padding: [10, 10], animate: true });
    }
  }, [bounds, map]);

  return null;
}

// ─── Info panel ───────────────────────────────────────────────────────────────
function InfoPanel({ title, subtitle, data, lang, onClose }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;
  const rows = [
    { label: 'DTP3 Coverage',                              value: data ? `${data.dtp3Pct}%`             : '—' },
    { label: 'MCV2 Coverage',                              value: data ? `${data.mcv2Pct}%`             : '—' },
    { label: t('Children Vaccinated', 'Enfants vaccinés'), value: data ? data.children.toLocaleString() : '—' },
    { label: t('% Screened', '% Dépistés'),                value: data ? `${data.screenedPct}%`         : '—' },
    { label: t('SAM Rate', 'Taux MAS'),                    value: data ? `${data.samRate}/100`           : '—' },
    { label: t('Sessions', 'Sessions'),                    value: data ? data.sessions.toLocaleString() : '—' },
    { label: t('Total Doses', 'Doses totales'),            value: data ? data.doses.toLocaleString()    : '—' },
  ];
  return (
    <div className="absolute top-3 right-3 z-[1000] w-52 bg-white/97 dark:bg-gray-900/97 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 pr-1">
          <p className="font-semibold text-sm leading-tight truncate">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1.5">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between items-center text-xs gap-2">
            <span className="text-muted-foreground shrink-0">{r.label}</span>
            <span className="font-semibold tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Time slider ──────────────────────────────────────────────────────────────
function TimeControls({ weeks, currentIdx, setCurrentIdx, playing, setPlaying }) {
  if (!weeks.length) return null;
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] w-[min(92%,500px)] bg-white/97 dark:bg-gray-900/97 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <button onClick={() => setCurrentIdx(0)} className="text-muted-foreground hover:text-foreground">
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setPlaying(p => !p)}
          className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 shrink-0"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>
        <button onClick={() => setCurrentIdx(weeks.length - 1)} className="text-muted-foreground hover:text-foreground">
          <SkipForward className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-mono font-semibold text-primary ml-1">{weeks[currentIdx] || '—'}</span>
        <span className="text-xs text-muted-foreground ml-auto">{currentIdx + 1}/{weeks.length}</span>
      </div>
      <Slider
        min={0} max={Math.max(weeks.length - 1, 1)} step={1} value={[currentIdx]}
        onValueChange={([v]) => { setPlaying(false); setCurrentIdx(v); }}
        className="w-full"
      />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ChoroplethMap({ lang, geojson, regionIndex, districtIndex, allWeeks, isLoading }) {
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const [activeLayerId, setActiveLayerId] = useState('dtp3');
  const [drillRegion, setDrillRegion]     = useState(null);
  const [drillBounds, setDrillBounds]     = useState(null);
  const [infoTitle, setInfoTitle]         = useState(null);
  const [infoSubtitle, setInfoSubtitle]   = useState(null);
  const [infoData, setInfoData]           = useState(null);
  const [animMode, setAnimMode]           = useState(false);
  const [currentIdx, setCurrentIdx]       = useState(0);
  const [playing, setPlaying]             = useState(false);
  const playRef = useRef(null);

  const activeLayer = LAYERS.find(l => l.id === activeLayerId);

  // Compute the feature list and data index for the current drill state
  const { visibleFeatures, dataIndex } = useMemo(() => {
    if (!geojson) return { visibleFeatures: [], dataIndex: {} };
    if (drillRegion) {
      return {
        visibleFeatures: geojson.features.filter(f => f.properties.region === drillRegion),
        dataIndex: districtIndex,
      };
    }
    return {
      visibleFeatures: geojson.features,
      dataIndex: regionIndex,
    };
  }, [geojson, drillRegion, regionIndex, districtIndex]);

  // Animation play loop
  useEffect(() => {
    if (!playing || !animMode) return;
    playRef.current = setInterval(() => {
      setCurrentIdx(i => {
        if (i >= allWeeks.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 900);
    return () => clearInterval(playRef.current);
  }, [playing, animMode, allWeeks.length]);

  // Stable click handler — reads drillRegion from ref to avoid stale closure
  const drillRegionRef = useRef(drillRegion);
  useEffect(() => { drillRegionRef.current = drillRegion; }, [drillRegion]);

  const handleFeatureClick = useCallback((props, data, poly) => {
    if (!drillRegionRef.current) {
      // Overview click → drill into region
      const region = props.region;
      let bounds = null;
      try { bounds = poly.getBounds(); } catch (_) {}
      setDrillRegion(region);
      setDrillBounds(bounds);
      setInfoTitle(region);
      setInfoSubtitle(t('Region — click a district for details', 'Région — cliquez sur un district'));
      setInfoData(regionIndex[region] || null);
    } else {
      // Drill mode click → show district info
      setInfoTitle(props.district);
      setInfoSubtitle(props.region);
      setInfoData(data || null);
    }
  }, [regionIndex, lang]);

  const handleBack = useCallback(() => {
    setDrillRegion(null);
    setDrillBounds(null);
    setInfoTitle(null);
    setInfoSubtitle(null);
    setInfoData(null);
  }, []);

  if (!geojson) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="h-[540px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">{t('Loading map…', 'Chargement…')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b bg-muted/30">
        {drillRegion ? (
          <>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-background border hover:bg-muted text-foreground mr-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('All regions', 'Toutes les régions')}
            </button>
            <span className="text-xs font-semibold text-primary mr-2 border-r pr-2">{drillRegion}</span>
          </>
        ) : null}

        {LAYERS.map(layer => (
          <button
            key={layer.id}
            onClick={() => setActiveLayerId(layer.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              activeLayerId === layer.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-background border hover:bg-muted text-muted-foreground'
            )}
          >
            <layer.icon className="h-3 w-3" />
            {layer.label[lang]}
          </button>
        ))}

        <button
          onClick={() => { setAnimMode(m => !m); setPlaying(false); }}
          className={cn(
            'ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
            animMode ? 'bg-violet-600 text-white border-violet-600' : 'bg-background hover:bg-muted text-muted-foreground'
          )}
        >
          <Play className="h-3 w-3" />
          {t('Animate', 'Animer')}
        </button>
      </div>

      {/* Context hint bar */}
      <div className={cn(
        'px-3 py-1.5 border-b text-xs',
        drillRegion
          ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900 text-violet-700 dark:text-violet-300'
          : 'bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900 text-sky-700 dark:text-sky-300'
      )}>
        {drillRegion
          ? t(`${drillRegion} — showing all districts. Click a district for details.`, `${drillRegion} — affichage des districts. Cliquez pour les détails.`)
          : t('Showing all 10 regions. Click any region to drill into its districts.', 'Affichage des 10 régions. Cliquez pour voir les districts.')
        }
      </div>

      <CardContent className="p-0">
        <div className="relative h-[520px] md:h-[620px] lg:h-[680px]">
          {isLoading && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          <MapContainer
            center={CMR_CENTER}
            zoom={6}
            minZoom={5}
            maxZoom={12}
            maxBounds={CMR_BOUNDS}
            maxBoundsViscosity={1.0}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ background: '#dde8f0' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              maxZoom={12}
              detectRetina={false}
              keepBuffer={2}
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
              attribution=""
              maxZoom={12}
              detectRetina={false}
              pane="shadowPane"
            />

            {/* Key forces full remount when drill state changes, guaranteeing fresh callbacks */}
            <ChoroplethLayer
              key={`${drillRegion ?? 'overview'}-${activeLayerId}`}
              features={visibleFeatures}
              dataIndex={dataIndex}
              activeLayer={activeLayer}
              onFeatureClick={handleFeatureClick}
              isDrillMode={!!drillRegion}
            />

            <FitBoundsOnChange bounds={drillBounds} />
          </MapContainer>

          <Legend layer={activeLayer} lang={lang} />

          {infoTitle && (
            <InfoPanel
              title={infoTitle}
              subtitle={infoSubtitle}
              data={infoData}
              lang={lang}
              onClose={() => { setInfoTitle(null); setInfoData(null); }}
            />
          )}

          {animMode && (
            <TimeControls
              weeks={allWeeks}
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
              playing={playing}
              setPlaying={setPlaying}
            />
          )}
        </div>

        {!isLoading && visibleFeatures.length > 0 && Object.keys(dataIndex).length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-2">
            {t('No data for selected period', 'Aucune donnée pour la période sélectionnée')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
