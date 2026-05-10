import React, { useState, useEffect, useCallback } from 'react';
import { GlobalStats, CountryData, StateData, EuropeCountryData, TrendDataPoint } from '../types';
import { LiveUpdate } from '../types';
import {
  fetchGlobalStats,
  fetchCountries,
  fetchUSStates,
  fetchEuropeData,
  fetchTrendData,
} from '../services/dataService';
import {
  fetchLiveFeed,
  fetchServerHealth,
  triggerRefresh,
  HealthStatus,
} from '../services/liveDataService';

import StatsCards from './StatsCards';
import GlobalMap from './GlobalMap';
import USMap from './USMap';
import EuropeMap from './EuropeMap';
import TrendChart from './TrendChart';
import LiveFeed from './LiveFeed';
import CountryTable from './CountryTable';
import VirusInfoCard from './VirusInfoCard';

type MapView = 'global' | 'us' | 'europe';
type DataTab  = 'table'  | 'trends';

const Dashboard: React.FC = () => {
  const [stats, setStats]           = useState<GlobalStats | null>(null);
  const [countries, setCountries]   = useState<CountryData[]>([]);
  const [usStates, setUsStates]     = useState<StateData[]>([]);
  const [europeCountries, setEuropeCountries] = useState<EuropeCountryData[]>([]);
  const [liveFeed, setLiveFeed]     = useState<LiveUpdate[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [feedMeta, setFeedMeta]   = useState<{ lastRefreshed: string; cacheAge: number; sources?: Record<string, any> } | null>(null);
  const [serverHealth, setServerHealth] = useState<HealthStatus | null>(null);

  const [loading, setLoading]         = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [mapView, setMapView] = useState<MapView>('global');
  const [dataTab, setDataTab] = useState<DataTab>('table');

  // ── load static/scraped stats ────────────────────────────────────────
  const loadStatic = useCallback(async () => {
    const [s, c, u, e, t] = await Promise.all([
      fetchGlobalStats().catch(() => null),
      fetchCountries().catch(() => []),
      fetchUSStates().catch(() => []),
      fetchEuropeData().catch(() => []),
      fetchTrendData().catch(() => []),
    ]);
    if (s) setStats(s);
    setCountries(c as CountryData[]);
    setUsStates(u as StateData[]);
    setEuropeCountries(e as EuropeCountryData[]);
    setTrendData(t as TrendDataPoint[]);
  }, []);

  // ── load live scraped feed ────────────────────────────────────────────
  const loadFeed = useCallback(async (showSpinner = false) => {
    if (showSpinner) setFeedLoading(true);
    try {
      const data = await fetchLiveFeed();
      setLiveFeed(data.updates);
      setFeedMeta({ lastRefreshed: data.lastRefreshed, cacheAge: data.cacheAge, sources: data.sources });
      setServerError(null);
    } catch (err: any) {
      setServerError('Scraping server offline — run: npm start');
    } finally {
      if (showSpinner) setFeedLoading(false);
    }
  }, []);

  // ── check server health ───────────────────────────────────────────────
  const checkHealth = useCallback(async () => {
    try {
      const h = await fetchServerHealth();
      setServerHealth(h);
    } catch {
      setServerHealth(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadStatic(), loadFeed(), checkHealth()]);
      setLoading(false);
    };
    init();

    const statsInterval  = setInterval(loadStatic,  30_000);
    const feedInterval   = setInterval(loadFeed,     60_000);
    const healthInterval = setInterval(checkHealth,  30_000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(feedInterval);
      clearInterval(healthInterval);
    };
  }, [loadStatic, loadFeed, checkHealth]);

  const handleForceRefresh = async () => {
    setFeedLoading(true);
    try {
      await triggerRefresh();
      await Promise.all([loadFeed(), loadStatic(), checkHealth()]);
    } catch {
      await loadFeed(true);
    } finally {
      setFeedLoading(false);
    }
  };

  return (
    <main className="main-content" role="main">

      {/* Server status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.5rem 1rem', marginBottom: '1rem',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)', fontSize: '0.72rem', flexWrap: 'wrap',
      }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>SCRAPING SERVER</span>

        {serverHealth ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#68d391' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#68d391', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Online · {serverHealth.feedCached} items cached
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Feed age: {serverHealth.feedAge != null ? `${serverHealth.feedAge}s` : '—'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Stats age: {serverHealth.statsAge != null ? `${serverHealth.statsAge}s` : '—'}
            </span>
          </>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fc8181' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fc8181', display: 'inline-block' }} />
            {serverError || 'Connecting…'}
          </span>
        )}

        {feedMeta?.sources && (
          <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {Object.entries(feedMeta.sources).map(([src, info]: [string, any]) => (
              <span key={src} style={{
                padding: '0.1rem 0.45rem', borderRadius: 100, fontWeight: 700,
                background: info.ok ? 'rgba(56,161,105,0.12)' : 'rgba(229,62,62,0.12)',
                border: `1px solid ${info.ok ? 'rgba(56,161,105,0.3)' : 'rgba(229,62,62,0.3)'}`,
                color: info.ok ? '#68d391' : '#fc8181',
              }}>
                {src}{info.ok && info.count != null ? ` (${info.count})` : ''}
              </span>
            ))}
          </span>
        )}
      </div>

      <VirusInfoCard />
      <StatsCards stats={stats} loading={loading} />

      <div className="dashboard-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">🗺️ Surveillance Map</div>
              <div className="panel-controls">
                <button className={`tab-btn ${mapView === 'global' ? 'active' : ''}`} onClick={() => setMapView('global')} aria-pressed={mapView === 'global'}>🌍 Global</button>
                <button className={`tab-btn ${mapView === 'us'     ? 'active' : ''}`} onClick={() => setMapView('us')}     aria-pressed={mapView === 'us'}>🇺🇸 US States</button>
                <button className={`tab-btn ${mapView === 'europe' ? 'active' : ''}`} onClick={() => setMapView('europe')} aria-pressed={mapView === 'europe'}>🇪🇺 Europe</button>
              </div>
            </div>
            <div style={{ padding: '0.75rem' }}>
              {loading
                ? <div style={{ height: 380, background: 'var(--border-color)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
                : mapView === 'global' ? <GlobalMap countries={countries} />
                : mapView === 'us'     ? <USMap states={usStates} />
                :                       <EuropeMap countries={europeCountries} />
              }
            </div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-header">
              <div className="panel-title">📊 Data Analysis</div>
              <div className="panel-controls">
                {(['table', 'trends'] as DataTab[]).map(tab => (
                  <button key={tab} className={`tab-btn ${dataTab === tab ? 'active' : ''}`} onClick={() => setDataTab(tab)} aria-pressed={dataTab === tab}>
                    {tab === 'table' ? '🌍 Country Data' : '📈 Trends (1993–2024)'}
                  </button>
                ))}
              </div>
            </div>
            {dataTab === 'table'
              ? <CountryTable countries={countries} loading={loading} />
              : <TrendChart data={trendData} loading={loading} />
            }
          </div>
        </div>

        {/* Right column — live scraped feed */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: 860 }}>
          <div className="panel-header">
            <div className="panel-title">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: serverHealth ? '#68d391' : '#fc8181', display: 'inline-block', animation: 'pulse 1.5s infinite' }} aria-hidden="true" />
              Live Scraped Feed
            </div>
            <button
              className="tab-btn"
              onClick={handleForceRefresh}
              disabled={feedLoading}
              aria-label="Force refresh all scrapers"
              style={{ opacity: feedLoading ? 0.6 : 1 }}
            >
              {feedLoading ? '…scraping' : '↺ Re-scrape'}
            </button>
          </div>
          <LiveFeed
            updates={liveFeed}
            loading={loading || feedLoading}
            feedMeta={feedMeta}
          />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
