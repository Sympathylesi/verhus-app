import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import 'leaflet/dist/leaflet.css';

function getCoverageColor(pct, hasData) {
  if (!hasData) return '#94A3B8'; // slate-400 — no data
  if (pct >= 80) return '#10B981';
  if (pct >= 60) return '#F59E0B';
  if (pct >= 40) return '#F97316';
  return '#EF4444';
}

export default function CameroonMap({ lang, healthAreas, entries }) {
  // Aggregate data per health area
  const areaData = {};
  (entries || []).forEach(e => {
    if (!areaData[e.health_area_id]) {
      areaData[e.health_area_id] = { children: 0, name: e.health_area_name, district: e.district };
    }
    areaData[e.health_area_id].children += (e.total_children_vaccinated || 0);
  });

  const markers = (healthAreas || [])
    .filter(ha => ha.latitude && ha.longitude)
    .map(ha => {
      const data    = areaData[ha.id] || { children: 0 };
      const hasData = Boolean(areaData[ha.id]);
      const target  = ha.target_population || 1000;
      const pct     = Math.min(100, Math.round(data.children / target * 100));
      return { ...ha, pct, children: data.children, hasData };
    });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {lang === 'en' ? 'Coverage Map' : 'Carte de couverture'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80 md:h-96">
          <MapContainer
            center={[6.0, 11.5]}
            zoom={6}
            scrollWheelZoom={false}
            className="h-full w-full rounded-b-lg"
            style={{ background: 'hsl(var(--muted))' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {markers.map(m => (
              <CircleMarker
                key={m.id}
                center={[m.latitude, m.longitude]}
                radius={8}
                fillColor={getCoverageColor(m.pct, m.hasData)}
                fillOpacity={0.8}
                stroke={false}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-gray-500">{m.district}</p>
                    {m.hasData
                      ? <p>{m.children.toLocaleString()} {lang === 'en' ? 'children' : 'enfants'} – {m.pct}%</p>
                      : <p className="text-slate-400 italic">{lang === 'fr' ? 'Aucune donnée' : 'No data'}</p>
                    }
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div className="flex items-center gap-4 px-4 py-2 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />≥80%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />60–79%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />40–59%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />&lt;40%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" />{lang === 'fr' ? 'Sans données' : 'No data'}</span>
        </div>
      </CardContent>
    </Card>
  );
}