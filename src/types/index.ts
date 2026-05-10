export interface GlobalStats {
  confirmedCases: number;
  deaths: number;
  countriesAffected: number;
  underMonitoring: number;
  lastUpdated: string;
  caseDetectionRate: number;
  casesFatalityRate: number;
}

export interface CountryData {
  id: string;
  name: string;
  cases: number;
  deaths: number;
  status: 'confirmed' | 'suspected' | 'monitoring' | 'safe';
  coordinates: [number, number];
  notes?: string;
}

export interface StateData {
  state: string;
  abbreviation: string;
  historicalCases: number;
  deaths: number;
  currentMonitoring: number;
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  lastCase?: string;
}

export interface LiveUpdate {
  id: string;
  timestamp: string;
  source: 'WHO' | 'CDC' | 'ECDC' | 'ProMED' | 'SYSTEM';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  content: string;
}

export interface TrendDataPoint {
  year: number;
  cases: number;
  deaths: number;
  month?: string;
}

export interface EuropeCountryData {
  country: string;
  iso2: string;
  historicalCases: number;
  deaths: number;
  currentMonitoring: number;
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  virusType: string;
  lastCase?: string;
}

export interface VirusStrain {
  name: string;
  type: string;
  transmissionRoute: string;
  personToPerson: boolean;
  fatalityRate: number;
  reservoirHost: string;
  geographicRange: string;
}
