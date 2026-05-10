import { LiveUpdate } from '../types';

export interface SourceStatus {
  'WHO-RSS': boolean;
  'ProMED-RSS': boolean;
  'Google-News': boolean;
  'Bing-News': boolean;
  'ProMED-Search': boolean;
  'WHO-DON': boolean;
  'CDC-HAN': boolean;
}

export interface LiveFeedResponse {
  updates: LiveUpdate[];
  hantavirusSpecific: LiveUpdate[];
  generalDisease: LiveUpdate[];
  totalCount: number;
  lastRefreshed: string;
  cacheAge: number;
  sources?: Record<string, { ok: boolean; count?: number; error?: string }>;
}

export interface ScrapedStats {
  cdc: {
    stats: {
      totalUSCases: number | null;
      totalUSDeaths: number | null;
      cfr: number | null;
      timespan: string;
      source: string;
      scrapedAt: string;
    };
    stateData: { state: string; cases: number; deaths: number | null }[];
  } | null;
  ecdc: {
    stats: Record<string, number>;
    tableRows: string[][];
    source: string;
  } | null;
  scrapedAt: string;
  sources: { cdc: boolean; ecdc: boolean };
}

export interface NewsResponse {
  articles: {
    title: string;
    url: string;
    date: string;
    description: string;
    source: string;
  }[];
  count: number;
  sources: { google: boolean; bing: boolean };
}

export interface HealthStatus {
  status: string;
  feedCached: number;
  feedAge: number | null;
  statsAge: number | null;
  uptime: number;
  timestamp: string;
}

// ── API calls to the local scraping server ────────────────────────────────
// CRA proxy forwards /api/* to http://localhost:3001

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchLiveFeed(): Promise<LiveFeedResponse> {
  return apiFetch<LiveFeedResponse>('/api/live-feed');
}

export async function fetchScrapedStats(): Promise<ScrapedStats> {
  return apiFetch<ScrapedStats>('/api/scraped-stats');
}

export async function fetchNews(): Promise<NewsResponse> {
  return apiFetch<NewsResponse>('/api/news');
}

export async function fetchServerHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/api/health');
}

export async function triggerRefresh(): Promise<{ ok: boolean; feedCount: number }> {
  const res = await fetch('/api/refresh', { method: 'POST', cache: 'no-store' });
  if (!res.ok) throw new Error(`Refresh failed: HTTP ${res.status}`);
  return res.json();
}
