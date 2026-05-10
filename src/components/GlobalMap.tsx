import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, {
  Popup,
  NavigationControl,
  ScaleControl,
  Source,
  Layer,
  MapRef,
} from 'react-map-gl/maplibre';
import type { LayerProps, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CountryData } from '../types';

const DARK_STYLE  = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const STATUS_COLOR: Record<string, string> = {
  confirmed:  '#e53e3e',
  suspected:  '#ed64a6',
  monitoring: '#f6c347',
};

type Anchor = 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface PopupState {
  longitude: number;
  latitude:  number;
  country:   CountryData;
  anchor:    Anchor;
}

interface Props {
  countries: CountryData[];
}

const GlobalMap: React.FC<Props> = ({ countries }) => {
  const mapRef                  = useRef<MapRef>(null);
  const [popup, setPopup]       = useState<PopupState | null>(null);
  const [selected, setSelected] = useState<CountryData | null>(null);
  const [isDark, setIsDark]     = useState(true);
  const [cursor, setCursor]     = useState('grab');
  const [mapError, setMapError] = useState<string | null>(null);

  const countryById = useRef<Record<string, CountryData>>({});
  useEffect(() => {
    countryById.current = Object.fromEntries(countries.map(c => [c.id, c]));
  }, [countries]);

  useEffect(() => {
    const sync = () =>
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // ── GeoJSON — one feature per country, no clustering ─────────────────────
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: countries
      .filter(c => c.status !== 'safe')
      .map(c => ({
        type: 'Feature' as const,
        id: c.id,
        properties: {
          id:           c.id,
          name:         c.name,
          status:       c.status,
          cases:        c.cases,
          deaths:       c.deaths,
          notes:        c.notes ?? '',
          color:        STATUS_COLOR[c.status] ?? '#888',
          isConfirmed:  c.status === 'confirmed',
          isMonitoring: c.status === 'monitoring',
          radius: c.status === 'confirmed'
            ? Math.max(20, 18 + c.cases * 3)
            : c.status === 'suspected' ? 15 : 13,
        },
        geometry: { type: 'Point' as const, coordinates: c.coordinates },
      })),
  };

  // ── Layers ────────────────────────────────────────────────────────────────

  const pulseLayer: LayerProps = {
    id: 'pulse',
    type: 'circle',
    filter: ['==', ['get', 'isConfirmed'], true],
    paint: {
      'circle-radius':         ['*', ['get', 'radius'], 2.0],
      'circle-color':          '#e53e3e',
      'circle-opacity':        0.12,
      'circle-stroke-width':   1.5,
      'circle-stroke-color':   '#e53e3e',
      'circle-stroke-opacity': 0.25,
    },
  };

  const monitoringRing: LayerProps = {
    id: 'monitoring-ring',
    type: 'circle',
    filter: ['==', ['get', 'isMonitoring'], true],
    paint: {
      'circle-radius':         ['*', ['get', 'radius'], 1.8],
      'circle-color':          '#f6c347',
      'circle-opacity':        0.10,
      'circle-stroke-width':   1.5,
      'circle-stroke-color':   '#f6c347',
      'circle-stroke-opacity': 0.28,
    },
  };

  const circleLayer: LayerProps = {
    id: 'circles',
    type: 'circle',
    paint: {
      'circle-radius':         ['get', 'radius'],
      'circle-color':          ['get', 'color'],
      'circle-opacity':        0.88,
      'circle-stroke-width':   2.5,
      'circle-stroke-color':   '#ffffff',
      'circle-stroke-opacity': 0.55,
    },
  };

  const isoLabel: LayerProps = {
    id: 'iso-label',
    type: 'symbol',
    layout: {
      'text-field':            ['get', 'id'],
      'text-font':             ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size':             11,
      'text-anchor':           'center',
      'text-allow-overlap':    true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color':      '#ffffff',
      'text-halo-color': 'rgba(0,0,0,0.65)',
      'text-halo-width': 1.2,
    },
  };

  const caseLabel: LayerProps = {
    id: 'case-label',
    type: 'symbol',
    filter: ['==', ['get', 'isConfirmed'], true],
    layout: {
      'text-field':            ['concat', ['to-string', ['get', 'cases']], ' cases'],
      'text-font':             ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size':             9,
      'text-anchor':           'top',
      'text-offset':           [0, 2.2],
      'text-allow-overlap':    false,
    },
    paint: {
      'text-color':      isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
      'text-halo-color': isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
      'text-halo-width': 1.5,
    },
  };

  // ── Interaction ───────────────────────────────────────────────────────────

  // Pick popup anchor so it never gets clipped by the panel edge.
  // Project the marker lat/lng to pixel coords and decide above or below.
  const getAnchor = useCallback((lng: number, lat: number): Anchor => {
    const map = mapRef.current;
    if (!map) return 'bottom';
    const point = map.project([lng, lat]);
    const canvas = map.getCanvas();
    // If marker is in the top 40% of the map → popup goes below (anchor='top')
    // Otherwise → popup goes above (anchor='bottom')
    return point.y < canvas.height * 0.4 ? 'top' : 'bottom';
  }, []);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) return;
    const country = countryById.current[f.properties?.id];
    if (country) { setPopup(null); setSelected(country); }
  }, []);

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) { setPopup(null); setCursor('grab'); return; }
    const country = countryById.current[f.properties?.id];
    if (!country) { setPopup(null); return; }

    setCursor('pointer');
    const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
    setPopup({
      longitude: coords[0],
      latitude:  coords[1],
      country,
      anchor: getAnchor(coords[0], coords[1]),
    });
  }, [getAnchor]);

  const handleMouseLeave = useCallback(() => {
    setPopup(null);
    setCursor('grab');
  }, []);

  // Popup offset so it clears the circle — direction depends on anchor
  const popupOffset = (anchor: Anchor): number =>
    anchor === 'top' ? 18 : 30;

  return (
    <div style={{ position: 'relative' }}>
      {mapError && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,17,23,0.92)', borderRadius: 8, padding: '1rem', textAlign: 'center' }}>
          <div>
            <div style={{ color: '#fc8181', fontWeight: 700, marginBottom: 8 }}>Map failed to load</div>
            <div style={{ color: '#8b949e', fontSize: '0.75rem', wordBreak: 'break-all' }}>{mapError}</div>
          </div>
        </div>
      )}
      <div style={{ height: 420, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <Map
          ref={mapRef}
          initialViewState={{ longitude: 10, latitude: 5, zoom: 1.3 }}
          minZoom={1.0}
          maxZoom={12}
          renderWorldCopies={false}
          mapStyle={isDark ? DARK_STYLE : LIGHT_STYLE}
          cursor={cursor}
          interactiveLayerIds={['circles']}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onError={(e: any) => { const msg = e?.error?.message || JSON.stringify(e); console.error('[GlobalMap]', msg); setMapError(msg); }}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <ScaleControl position="bottom-left" />

          {/* No cluster — all countries always visible individually */}
          <Source id="outbreaks" type="geojson" data={geojson}>
            <Layer {...pulseLayer} />
            <Layer {...monitoringRing} />
            <Layer {...circleLayer} />
            <Layer {...isoLabel} />
            <Layer {...caseLabel} />
          </Source>

          {popup && (
            <Popup
              longitude={popup.longitude}
              latitude={popup.latitude}
              closeButton={false}
              closeOnClick={false}
              anchor={popup.anchor}
              offset={popupOffset(popup.anchor)}
              maxWidth="220px"
            >
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {popup.country.name}
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 100, fontWeight: 700,
                    textTransform: 'capitalize',
                    background: (STATUS_COLOR[popup.country.status] ?? '#888') + '28',
                    color: STATUS_COLOR[popup.country.status] ?? '#888',
                    border: `1px solid ${STATUS_COLOR[popup.country.status] ?? '#888'}50`,
                  }}>
                    {popup.country.status}
                  </span>
                </div>
                {[
                  { label: 'Cases',  value: popup.country.cases,  color: popup.country.cases  > 0 ? STATUS_COLOR.confirmed : 'var(--text-muted)' },
                  { label: 'Deaths', value: popup.country.deaths, color: popup.country.deaths > 0 ? '#fc8181'              : 'var(--text-muted)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color }}>{value}</span>
                  </div>
                ))}
                {popup.country.notes && (
                  <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45, borderTop: '1px solid var(--border-color)', paddingTop: 6 }}>
                    {popup.country.notes}
                  </div>
                )}
                <div style={{ marginTop: 5, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Click for full details
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      <div className="map-legend" style={{ marginTop: 8 }}>
        {[
          { color: STATUS_COLOR.confirmed,  label: 'Confirmed cases' },
          { color: STATUS_COLOR.suspected,  label: 'Suspected / probable' },
          { color: STATUS_COLOR.monitoring, label: 'Under monitoring' },
        ].map(({ color, label }) => (
          <div key={label} className="legend-item">
            <div className="legend-dot" style={{ background: color }} />
            {label}
          </div>
        ))}
        <div className="legend-item" style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
          Hover = details · Click = full info
        </div>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)} role="dialog" aria-modal="true" aria-labelledby="gmap-modal">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="gmap-modal">🌍 {selected.name}</h2>
              <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Status',          value: selected.status, color: STATUS_COLOR[selected.status] ?? '#888' },
                { label: 'Confirmed Cases', value: selected.cases,  color: 'var(--color-outbreak)' },
                { label: 'Deaths',          value: selected.deaths, color: '#fc8181' },
                { label: 'Country Code',    value: selected.id,     color: 'var(--text-secondary)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, color, textTransform: 'capitalize' }}>{value}</div>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Notes: </strong>{selected.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalMap;
