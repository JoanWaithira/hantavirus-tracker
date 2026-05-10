import { GlobalStats, CountryData, StateData, EuropeCountryData, TrendDataPoint } from '../types';
import {
  globalStats as baseStats,
  countriesData,
  usStatesData,
  trendData,
} from '../data/mockData';
import { fetchScrapedStats } from './liveDataService';

// Merge live-scraped CDC numbers into base stats
export async function fetchGlobalStats(): Promise<GlobalStats> {
  let scraped: Awaited<ReturnType<typeof fetchScrapedStats>> | null = null;
  try {
    scraped = await fetchScrapedStats();
  } catch {
    // Server not ready yet — use base values
  }

  const cdcStats = scraped?.cdc?.stats;
  return {
    ...baseStats,
    // Overwrite with live-scraped values where available
    lastUpdated: new Date().toISOString(),
    ...(cdcStats?.cfr           != null && { casesFatalityRate: cdcStats.cfr }),
  };
}

export async function fetchCountries(): Promise<CountryData[]> {
  return countriesData;
}

// Merge live-scraped state rows into static state data
export async function fetchUSStates(): Promise<StateData[]> {
  let scraped: Awaited<ReturnType<typeof fetchScrapedStats>> | null = null;
  try {
    scraped = await fetchScrapedStats();
  } catch {
    // fall through
  }

  if (!scraped?.cdc?.stateData?.length) return usStatesData;

  // Update any state where scraper found a fresher case count
  const scrapedMap: Record<string, number> = {};
  for (const row of scraped.cdc.stateData) {
    scrapedMap[row.state.toLowerCase()] = row.cases;
  }

  return usStatesData.map(s => {
    const live = scrapedMap[s.state.toLowerCase()];
    return live != null && live > 0
      ? { ...s, historicalCases: live }
      : s;
  });
}

export async function fetchEuropeData(): Promise<EuropeCountryData[]> {
  try {
    const res = await fetch('/api/europe-data', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.countries ?? []) as EuropeCountryData[];
  } catch {
    return [];
  }
}

export async function fetchTrendData(): Promise<TrendDataPoint[]> {
  return trendData;
}
