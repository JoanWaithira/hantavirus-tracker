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
import { EuropeCountryData } from '../types';

const DARK_STYLE  = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const EUROPE_GEOJSON =
  'https://raw.githubusercontent.com/leakyMirror/map-of-europe/master/GeoJSON/europe.geojson';

const RISK_COLOR: Record<string, string> = {
  high:   '#e53e3e',
  medium: '#e8a020',
  low:    '#3182ce',
  none:   '#2d3748',
};

const RISK_TEXT_COLOR: Record<string, string> = {
  high:   '#fff',
  medium: '#fff',
  low:    '#fff',
  none:   '#718096',
};

// Hand-picked visual centres for each country in the dataset
const COUNTRY_LABEL_COORDS: Record<string, [number, number]> = {
  'DE': [10.4,  51.2],
  'FI': [26.0,  64.5],
  'SE': [17.5,  62.5],
  'RU': [44.0,  58.0],
  'BE': [ 4.5,  50.5],
  'NO': [13.5,  65.5],
  'FR': [ 2.5,  46.5],
  'EE': [25.2,  58.7],
  'LV': [25.0,  56.9],
  'LT': [24.0,  55.9],
  'RS': [21.0,  44.0],
  'HR': [16.0,  45.2],
  'BA': [17.5,  44.2],
  'NL': [ 5.3,  52.2],
  'CZ': [15.5,  49.8],
  'SK': [19.5,  48.7],
  'AT': [14.5,  47.5],
  'PL': [19.5,  52.0],
  'SI': [14.8,  46.1],
};

interface PopupInfo {
  longitude: number;
  latitude:  number;
  country:   EuropeCountryData;
}

interface Props {
  countries: EuropeCountryData[];
}

const EuropeMap: React.FC<Props> = ({ countries }) => {
  const [popup,    setPopup]    = useState<PopupInfo | null>(null);
  const [selected, setSelected] = useState<EuropeCountryData | null>(null);
  const [isDark,   setIsDark]   = useState(true);
  const [geojson,  setGeojson]  = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    const sync = () =>
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    fetch(EUROPE_GEOJSON)
      .then(r => r.json())
      .then((raw: GeoJSON.FeatureCollection) => {
        const byIso: Record<string, EuropeCountryData> = {};
        countries.forEach(c => { byIso[c.iso2.toUpperCase()] = c; });

        const enriched: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: raw.features.map((f, idx) => {
            const iso2: string = ((f.properties as any)?.ISO2 ?? '').toUpperCase();
            const cd = byIso[iso2];
            const risk = cd?.riskLevel ?? 'none';
            return {
              ...f,
              id: idx,
              properties: {
                ...f.properties,
                iso2,
                riskLevel:          risk,
                fillColor:          RISK_COLOR[risk],
                textColor:          RISK_TEXT_COLOR[risk],
                historicalCases:    cd?.historicalCases    ?? 0,
                deaths:             cd?.deaths             ?? 0,
                currentMonitoring:  cd?.currentMonitoring  ?? 0,
                hasMonitoring:      (cd?.currentMonitoring ?? 0) > 0,
                virusType:          cd?.virusType          ?? '',
                countryName:        cd?.country            ?? (f.properties as any)?.NAME ?? iso2,
              },
            };
          }),
        };
        setGeojson(enriched);
      })
      .catch(console.error);
  }, [countries]);

  // Separate point source with hand-picked coordinates for rich labels
  const labelGeojson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: countries
      .filter(cd => COUNTRY_LABEL_COORDS[cd.iso2.toUpperCase()])
      .map(cd => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: COUNTRY_LABEL_COORDS[cd.iso2.toUpperCase()],
        },
        properties: {
          iso2:            cd.iso2,
          historicalCases: cd.historicalCases,
          textColor:       RISK_TEXT_COLOR[cd.riskLevel],
          hasMonitoring:   cd.currentMonitoring > 0,
        },
      })),
  }), [countries]);

  // ── Layers ─────────────────────────────────────────────────────────────

  const fillLayer: LayerProps = {
    id: 'eu-fill',
    type: 'fill',
    paint: {
      'fill-color':   ['get', 'fillColor'],
      'fill-opacity': [
        'case',
        ['==', ['get', 'riskLevel'], 'none'], 0.15,
        0.70,
      ],
    },
  };

  const outlineLayer: LayerProps = {
    id: 'eu-outline',
    type: 'line',
    paint: {
      'line-color': isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
      'line-width': 1,
    },
  };

  const monitoringGlowLayer: LayerProps = {
    id: 'eu-monitoring-glow',
    type: 'fill',
    filter: ['==', ['get', 'hasMonitoring'], true],
    paint: {
      'fill-color':   '#f6e05e',
      'fill-opacity': 0.18,
    },
  };

  const monitoringOutlineLayer: LayerProps = {
    id: 'eu-monitoring-outline',
    type: 'line',
    filter: ['==', ['get', 'hasMonitoring'], true],
    paint: {
      'line-color':   '#f6e05e',
      'line-width':   2,
      'line-opacity': 0.8,
    },
  };

  const labelLayer: LayerProps = {
    id: 'eu-labels',
    type: 'symbol',
    layout: {
      'text-field': [
        'case',
        ['>', ['get', 'historicalCases'], 0],
        ['concat', ['get', 'iso2'], '\n', ['to-string', ['get', 'historicalCases']], ' cases'],
        ['get', 'iso2'],
      ],
      'text-font':             ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size':             ['interpolate', ['linear'], ['zoom'], 3, 10, 5, 13, 7, 16],
      'text-anchor':           'center',
      'text-allow-overlap':    true,
      'text-ignore-placement': true,
      'text-max-width':        6,
      'text-line-height':      1.3,
    },
    paint: {
      'text-color':      ['get', 'textColor'],
      'text-halo-color': isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
      'text-halo-width': 2,
    },
  };

  // ── Interaction ─────────────────────────────────────────────────────────

  const handleClick = useCallback((e: any) => {
    const f = e.features?.[0];
    if (!f) return;
    const iso2: string = (f.properties?.iso2 ?? '').toUpperCase();
    const cd = countries.find(c => c.iso2.toUpperCase() === iso2);
    if (cd && cd.riskLevel !== 'none') setSelected(cd);
  }, [countries]);

  const handleMouseMove = useCallback((e: any) => {
    const f = e.features?.[0];
    if (!f) { setPopup(null); return; }
    const iso2: string = (f.properties?.iso2 ?? '').toUpperCase();
    const cd = countries.find(c => c.iso2.toUpperCase() === iso2);
    if (!cd || cd.riskLevel === 'none') { setPopup(null); return; }
    setPopup({ longitude: e.lngLat.lng, latitude: e.lngLat.lat, country: cd });
  }, [countries]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ height: 420, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <Map
          initialViewState={{ longitude: 15, latitude: 54, zoom: 3.2 }}
          minZoom={2}
          maxZoom={10}
          renderWorldCopies={false}
          mapStyle={isDark ? DARK_STYLE : LIGHT_STYLE}
          interactiveLayerIds={geojson ? ['eu-fill'] : []}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setPopup(null)}
          onError={(e) => console.error('[EuropeMap]', e)}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <ScaleControl position="bottom-left" unit="metric" />

          {geojson && (
            <Source id="eu-countries" type="geojson" data={geojson}>
              <Layer {...fillLayer} />
              <Layer {...monitoringGlowLayer} />
              <Layer {...outlineLayer} />
              <Layer {...monitoringOutlineLayer} />
            </Source>
          )}

          <Source id="eu-labels" type="geojson" data={labelGeojson}>
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
              <div style={{ fontFamily: 'var(--font-sans)', minWidth: 200, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {popup.country.country}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px',
                    borderRadius: 100, textTransform: 'uppercase',
                    background: RISK_COLOR[popup.country.riskLevel] + '30',
                    color: RISK_COLOR[popup.country.riskLevel],
                  }}>
                    {popup.country.riskLevel}
                  </span>
                </div>
                {[
                  { label: 'Historical Cases',  value: popup.country.historicalCases },
                  { label: 'Deaths',            value: popup.country.deaths },
                  { label: 'Active Monitoring', value: popup.country.currentMonitoring,
                    color: popup.country.currentMonitoring > 0 ? '#f6e05e' : undefined },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#888' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: color ?? 'inherit' }}>{value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 4, fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>
                  Virus: {popup.country.virusType}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: '#aaa' }}>Click for full details</div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      <div className="map-legend" style={{ marginTop: 8 }}>
        {[
          { color: RISK_COLOR.high,   label: 'High burden (≥500 cases)' },
          { color: RISK_COLOR.medium, label: 'Medium burden (50–499)' },
          { color: RISK_COLOR.low,    label: 'Low / sporadic' },
          { color: '#f6e05e',         label: '⚠ Active 2024 monitoring' },
        ].map(({ color, label }) => (
          <div key={label} className="legend-item">
            <div className="legend-dot" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="eumap-modal-title"
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="eumap-modal-title">
                🇪🇺 {selected.country} ({selected.iso2})
              </h2>
              <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Risk Level',           value: selected.riskLevel.toUpperCase(), color: RISK_COLOR[selected.riskLevel] },
                { label: 'Historical Cases',     value: selected.historicalCases,         color: 'var(--text-primary)' },
                { label: 'Deaths',               value: selected.deaths,                  color: '#fc8181' },
                { label: 'Active Monitoring',    value: selected.currentMonitoring,       color: selected.currentMonitoring > 0 ? '#f6e05e' : 'var(--text-muted)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color, textTransform: 'capitalize' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>VIRUS TYPE</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selected.virusType}</div>
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

export default EuropeMap;
