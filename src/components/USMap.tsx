import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StateData } from '../types';

// No-labels base styles so our custom labels are the only ones shown
const DARK_STYLE  = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const US_STATES_GEOJSON =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';

const RISK_COLOR: Record<string, string> = {
  high:   '#e53e3e',
  medium: '#e8a020',
  low:    '#3182ce',
  none:   '#2d3748',
};

// Hand-picked visual centres — MapLibre's auto-centroid is unreliable for oddly-shaped states
const STATE_LABEL_COORDS: Record<string, [number, number]> = {
  'New Mexico':   [-106.1, 34.4],
  'Colorado':     [-105.5, 39.0],
  'Arizona':      [-111.7, 34.3],
  'California':   [-119.5, 37.2],
  'Utah':         [-111.5, 39.3],
  'Montana':      [-109.6, 46.9],
  'Washington':   [-120.5, 47.4],
  'Texas':        [-99.3,  31.5],
  'Idaho':        [-114.5, 44.4],
  'Oregon':       [-120.5, 43.9],
  'Wyoming':      [-107.5, 43.0],
  'Nevada':       [-116.5, 39.3],
  'South Dakota': [-100.2, 44.4],
  'North Dakota': [-100.5, 47.4],
  'Nebraska':     [-99.5,  41.5],
  'Kansas':       [-98.4,  38.5],
  'New Jersey':   [-74.5,  40.1],
  'Georgia':      [-83.4,  32.6],
  'Virginia':     [-79.0,  37.5],
};

const RISK_TEXT_COLOR: Record<string, string> = {
  high:   '#fff',
  medium: '#fff',
  low:    '#fff',
  none:   '#718096',
};

interface PopupInfo {
  longitude: number;
  latitude:  number;
  state:     StateData;
}

interface Props {
  states: StateData[];
}

const USMap: React.FC<Props> = ({ states }) => {
  const [popup,    setPopup]    = useState<PopupInfo | null>(null);
  const [selected, setSelected] = useState<StateData | null>(null);
  const [isDark,   setIsDark]   = useState(true);
  const [geojson,  setGeojson]  = useState<GeoJSON.FeatureCollection | null>(null);

  // Track dashboard theme
  useEffect(() => {
    const sync = () =>
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Fetch GeoJSON and merge our surveillance data into each feature
  useEffect(() => {
    fetch(US_STATES_GEOJSON)
      .then(r => r.json())
      .then((raw: GeoJSON.FeatureCollection) => {
        const byName: Record<string, StateData> = {};
        states.forEach(s => { byName[s.state.toLowerCase()] = s; });

        const enriched: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: raw.features.map((f, idx) => {
            const geoName: string = (f.properties as any)?.name ?? '';
            const sd = byName[geoName.toLowerCase()];
            const risk = sd?.riskLevel ?? 'none';
            return {
              ...f,
              id: idx,
              properties: {
                ...f.properties,
                riskLevel:          risk,
                fillColor:          RISK_COLOR[risk],
                textColor:          RISK_TEXT_COLOR[risk],
                historicalCases:    sd?.historicalCases    ?? 0,
                deaths:             sd?.deaths             ?? 0,
                currentMonitoring:  sd?.currentMonitoring  ?? 0,
                abbreviation:       sd?.abbreviation       ?? geoName.slice(0, 2).toUpperCase(),
                stateName:          sd?.state              ?? geoName,
                hasMonitoring:      (sd?.currentMonitoring ?? 0) > 0,
              },
            };
          }),
        };
        setGeojson(enriched);
      })
      .catch(console.error);
  }, [states]);

  // ── Layers ────────────────────────────────────────────────────────────

  const fillLayer: LayerProps = {
    id: 'us-fill',
    type: 'fill',
    paint: {
      'fill-color':   ['get', 'fillColor'],
      'fill-opacity': [
        'case',
        ['==', ['get', 'riskLevel'], 'none'], 0.18,
        0.70,
      ],
    },
  };

  const outlineLayer: LayerProps = {
    id: 'us-outline',
    type: 'line',
    paint: {
      'line-color': isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
      'line-width': 1,
    },
  };

  // Yellow pulse glow on states with active 2024 monitoring
  const monitoringGlowLayer: LayerProps = {
    id: 'us-monitoring-glow',
    type: 'fill',
    filter: ['==', ['get', 'hasMonitoring'], true],
    paint: {
      'fill-color':   '#f6e05e',
      'fill-opacity': 0.18,
    },
  };

  const monitoringOutlineLayer: LayerProps = {
    id: 'us-monitoring-outline',
    type: 'line',
    filter: ['==', ['get', 'hasMonitoring'], true],
    paint: {
      'line-color': '#f6e05e',
      'line-width': 2,
      'line-opacity': 0.8,
    },
  };

  // Point GeoJSON at hand-picked coords — bypasses MapLibre's unreliable polygon centroid
  const labelGeojson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: states
      .filter(sd => STATE_LABEL_COORDS[sd.state])
      .map(sd => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: STATE_LABEL_COORDS[sd.state] },
        properties: {
          abbreviation:    sd.abbreviation,
          historicalCases: sd.historicalCases,
          textColor:       RISK_TEXT_COLOR[sd.riskLevel],
          hasMonitoring:   sd.currentMonitoring > 0,
        },
      })),
  }), [states]);

  const labelLayer: LayerProps = {
    id: 'us-labels',
    type: 'symbol',
    layout: {
      // Always show abbrev + case count (where cases > 0) — no zoom gate
      'text-field': [
        'case',
        ['>', ['get', 'historicalCases'], 0],
        ['concat', ['get', 'abbreviation'], '\n', ['to-string', ['get', 'historicalCases']], ' cases'],
        ['get', 'abbreviation'],
      ],
      'text-font':             ['Open Sans Bold', 'Arial Unicode MS Bold'],
      // Scale text with zoom so it's readable but not huge at overview
      'text-size':             ['interpolate', ['linear'], ['zoom'], 3, 10, 4, 12, 6, 15, 8, 18],
      'text-anchor':           'center',
      'text-allow-overlap':    true,   // never drop a label
      'text-ignore-placement': true,   // don't let other layers hide these
      'text-max-width':        6,
      'text-line-height':      1.3,
    },
    paint: {
      'text-color':      ['get', 'textColor'],
      'text-halo-color': isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
      'text-halo-width': 2,
    },
  };

  // ── Interaction handlers ──────────────────────────────────────────────

  const handleClick = useCallback((e: any) => {
    const f = e.features?.[0];
    if (!f) return;
    const geoName: string = f.properties?.name ?? '';
    const sd = states.find(s => s.state.toLowerCase() === geoName.toLowerCase());
    if (sd && sd.riskLevel !== 'none') setSelected(sd);
  }, [states]);

  const handleMouseMove = useCallback((e: any) => {
    const f = e.features?.[0];
    if (!f) { setPopup(null); return; }
    const geoName: string = f.properties?.name ?? '';
    const sd = states.find(s => s.state.toLowerCase() === geoName.toLowerCase());
    if (!sd || sd.riskLevel === 'none') { setPopup(null); return; }
    setPopup({ longitude: e.lngLat.lng, latitude: e.lngLat.lat, state: sd });
  }, [states]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ height: 420, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <Map
          initialViewState={{ longitude: -96, latitude: 36, zoom: 3.0 }}
          minZoom={2}
          maxZoom={10}
          renderWorldCopies={false}
          mapStyle={isDark ? DARK_STYLE : LIGHT_STYLE}
          interactiveLayerIds={geojson ? ['us-fill'] : []}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setPopup(null)}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <ScaleControl position="bottom-left" unit="imperial" />

          {geojson && (
            <Source id="us-states" type="geojson" data={geojson}>
              <Layer {...fillLayer} />
              <Layer {...monitoringGlowLayer} />
              <Layer {...outlineLayer} />
              <Layer {...monitoringOutlineLayer} />
            </Source>
          )}

          {/* Labels on a separate point source with hand-picked coords */}
          <Source id="us-state-labels" type="geojson" data={labelGeojson}>
            <Layer {...labelLayer} />
          </Source>

          {popup && (
            <Popup
              longitude={popup.longitude}
              latitude={popup.latitude}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              offset={12}
            >
              <div style={{ fontFamily: 'var(--font-sans)', minWidth: 180, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {popup.state.state}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px',
                    borderRadius: 100, textTransform: 'uppercase',
                    background: RISK_COLOR[popup.state.riskLevel] + '30',
                    color: RISK_COLOR[popup.state.riskLevel],
                  }}>
                    {popup.state.riskLevel}
                  </span>
                </div>
                {[
                  { label: 'Historical Cases',    value: popup.state.historicalCases },
                  { label: 'Deaths',              value: popup.state.deaths },
                  { label: 'Active Monitoring',   value: popup.state.currentMonitoring,
                    color: popup.state.currentMonitoring > 0 ? '#f6e05e' : undefined },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#888' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: color || 'inherit' }}>{value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6, fontSize: 11, color: '#aaa' }}>Click for full details</div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* Legend */}
      <div className="map-legend" style={{ marginTop: 8 }}>
        {[
          { color: RISK_COLOR.high,   label: 'High Risk  (≥50 cases)' },
          { color: RISK_COLOR.medium, label: 'Medium Risk  (20–49)' },
          { color: RISK_COLOR.low,    label: 'Low / Monitoring' },
          { color: '#f6e05e',         label: '⚠ Active 2024 monitoring' },
        ].map(({ color, label }) => (
          <div key={label} className="legend-item">
            <div className="legend-dot" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="usmap-modal-title"
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="usmap-modal-title">
                🗺️ {selected.state} ({selected.abbreviation})
              </h2>
              <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Risk Level',              value: selected.riskLevel.toUpperCase(), color: RISK_COLOR[selected.riskLevel] },
                { label: 'Historical Cases (1993–)', value: selected.historicalCases,         color: 'var(--text-primary)' },
                { label: 'Historical Deaths',        value: selected.deaths,                  color: '#fc8181' },
                { label: 'Active Monitoring 2024',   value: selected.currentMonitoring,       color: selected.currentMonitoring > 0 ? '#f6e05e' : 'var(--text-muted)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>HISTORICAL CASE FATALITY RATE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="risk-bar" style={{ flex: 1 }}>
                  <div
                    className={`risk-bar-fill ${selected.riskLevel}`}
                    style={{ width: `${Math.min(100, Math.round((selected.deaths / Math.max(selected.historicalCases, 1)) * 100))}%` }}
                  />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: 44, textAlign: 'right' }}>
                  {Math.round((selected.deaths / Math.max(selected.historicalCases, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default USMap;
