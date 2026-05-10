import { GlobalStats, CountryData, StateData, LiveUpdate, TrendDataPoint, VirusStrain } from '../types';

export const globalStats: GlobalStats = {
  confirmedCases: 8,
  deaths: 3,
  countriesAffected: 12,
  underMonitoring: 147,
  lastUpdated: new Date().toISOString(),
  caseDetectionRate: 94.2,
  casesFatalityRate: 37.5,
};

export const countriesData: CountryData[] = [
  { id: 'ZAF', name: 'South Africa', cases: 2, deaths: 1, status: 'confirmed', coordinates: [25.0, -29.0], notes: 'MV Hondius passengers' },
  { id: 'NLD', name: 'Netherlands', cases: 2, deaths: 1, status: 'confirmed', coordinates: [5.3, 52.1], notes: 'Repatriated cruise passengers' },
  { id: 'CHE', name: 'Switzerland', cases: 1, deaths: 1, status: 'confirmed', coordinates: [8.2, 46.8], notes: 'MV Hondius crew member' },
  { id: 'FRA', name: 'France', cases: 0, deaths: 0, status: 'monitoring', coordinates: [2.3, 46.2], notes: '3 passengers under monitoring' },
  { id: 'SGP', name: 'Singapore', cases: 0, deaths: 0, status: 'monitoring', coordinates: [103.8, 1.3], notes: '2 passengers under monitoring' },
  { id: 'CAN', name: 'Canada', cases: 0, deaths: 0, status: 'monitoring', coordinates: [-96.8, 56.1], notes: '4 passengers under monitoring' },
  { id: 'GBR', name: 'United Kingdom', cases: 0, deaths: 0, status: 'monitoring', coordinates: [-3.4, 55.4], notes: '5 passengers under monitoring' },
  { id: 'USA', name: 'United States', cases: 0, deaths: 0, status: 'monitoring', coordinates: [-95.7, 37.1], notes: '9 persons under monitoring in 6 states' },
  { id: 'DEU', name: 'Germany', cases: 0, deaths: 0, status: 'suspected', coordinates: [10.5, 51.2], notes: 'Contact tracing ongoing' },
  { id: 'AUS', name: 'Australia', cases: 0, deaths: 0, status: 'suspected', coordinates: [133.8, -25.3], notes: 'Alert issued for cruise passengers' },
  { id: 'ARG', name: 'Argentina', cases: 0, deaths: 0, status: 'monitoring', coordinates: [-63.6, -38.4], notes: 'Andes virus endemic region - heightened surveillance' },
  { id: 'CHL', name: 'Chile', cases: 0, deaths: 0, status: 'monitoring', coordinates: [-71.5, -35.7], notes: 'Andes virus endemic region - heightened surveillance' },
];

export const usStatesData: StateData[] = [
  { state: 'New Mexico', abbreviation: 'NM', historicalCases: 122, deaths: 44, currentMonitoring: 0, riskLevel: 'high', lastCase: '2023' },
  { state: 'Colorado', abbreviation: 'CO', historicalCases: 119, deaths: 43, currentMonitoring: 0, riskLevel: 'high', lastCase: '2023' },
  { state: 'Arizona', abbreviation: 'AZ', historicalCases: 86, deaths: 31, currentMonitoring: 1, riskLevel: 'high', lastCase: '2024' },
  { state: 'California', abbreviation: 'CA', historicalCases: 68, deaths: 25, currentMonitoring: 1, riskLevel: 'high', lastCase: '2024' },
  { state: 'Utah', abbreviation: 'UT', historicalCases: 50, deaths: 18, currentMonitoring: 0, riskLevel: 'medium', lastCase: '2022' },
  { state: 'Montana', abbreviation: 'MT', historicalCases: 48, deaths: 17, currentMonitoring: 0, riskLevel: 'medium', lastCase: '2022' },
  { state: 'Washington', abbreviation: 'WA', historicalCases: 46, deaths: 17, currentMonitoring: 0, riskLevel: 'medium', lastCase: '2023' },
  { state: 'Texas', abbreviation: 'TX', historicalCases: 35, deaths: 13, currentMonitoring: 2, riskLevel: 'medium', lastCase: '2024' },
  { state: 'Idaho', abbreviation: 'ID', historicalCases: 32, deaths: 12, currentMonitoring: 0, riskLevel: 'medium', lastCase: '2022' },
  { state: 'Oregon', abbreviation: 'OR', historicalCases: 30, deaths: 11, currentMonitoring: 0, riskLevel: 'medium', lastCase: '2023' },
  { state: 'Wyoming', abbreviation: 'WY', historicalCases: 28, deaths: 10, currentMonitoring: 0, riskLevel: 'medium', lastCase: '2021' },
  { state: 'Nevada', abbreviation: 'NV', historicalCases: 25, deaths: 9, currentMonitoring: 0, riskLevel: 'medium', lastCase: '2022' },
  { state: 'South Dakota', abbreviation: 'SD', historicalCases: 20, deaths: 7, currentMonitoring: 0, riskLevel: 'low', lastCase: '2021' },
  { state: 'North Dakota', abbreviation: 'ND', historicalCases: 14, deaths: 5, currentMonitoring: 0, riskLevel: 'low', lastCase: '2020' },
  { state: 'Nebraska', abbreviation: 'NE', historicalCases: 12, deaths: 4, currentMonitoring: 0, riskLevel: 'low', lastCase: '2021' },
  { state: 'Kansas', abbreviation: 'KS', historicalCases: 10, deaths: 4, currentMonitoring: 0, riskLevel: 'low', lastCase: '2020' },
  { state: 'New Jersey', abbreviation: 'NJ', historicalCases: 3, deaths: 1, currentMonitoring: 2, riskLevel: 'low', lastCase: '2024' },
  { state: 'Georgia', abbreviation: 'GA', historicalCases: 2, deaths: 1, currentMonitoring: 2, riskLevel: 'low', lastCase: '2024' },
  { state: 'Virginia', abbreviation: 'VA', historicalCases: 2, deaths: 1, currentMonitoring: 1, riskLevel: 'low', lastCase: '2024' },
];

export const trendData: TrendDataPoint[] = [
  { year: 1993, cases: 24, deaths: 19 },
  { year: 1994, cases: 17, deaths: 7 },
  { year: 1995, cases: 19, deaths: 8 },
  { year: 1996, cases: 18, deaths: 7 },
  { year: 1997, cases: 35, deaths: 14 },
  { year: 1998, cases: 18, deaths: 7 },
  { year: 1999, cases: 22, deaths: 9 },
  { year: 2000, cases: 25, deaths: 10 },
  { year: 2001, cases: 27, deaths: 10 },
  { year: 2002, cases: 26, deaths: 10 },
  { year: 2003, cases: 25, deaths: 10 },
  { year: 2004, cases: 41, deaths: 16 },
  { year: 2005, cases: 26, deaths: 10 },
  { year: 2006, cases: 41, deaths: 16 },
  { year: 2007, cases: 32, deaths: 13 },
  { year: 2008, cases: 22, deaths: 9 },
  { year: 2009, cases: 21, deaths: 8 },
  { year: 2010, cases: 20, deaths: 8 },
  { year: 2011, cases: 24, deaths: 9 },
  { year: 2012, cases: 36, deaths: 14 },
  { year: 2013, cases: 28, deaths: 11 },
  { year: 2014, cases: 32, deaths: 12 },
  { year: 2015, cases: 29, deaths: 11 },
  { year: 2016, cases: 26, deaths: 10 },
  { year: 2017, cases: 31, deaths: 12 },
  { year: 2018, cases: 26, deaths: 10 },
  { year: 2019, cases: 28, deaths: 11 },
  { year: 2020, cases: 20, deaths: 8 },
  { year: 2021, cases: 25, deaths: 10 },
  { year: 2022, cases: 23, deaths: 9 },
  { year: 2023, cases: 27, deaths: 10 },
  { year: 2024, cases: 8, deaths: 3 },
];

export const virusStrain: VirusStrain = {
  name: 'Andes Virus (ANDV)',
  type: 'Hantavirus Pulmonary Syndrome (HPS)',
  transmissionRoute: 'Rodent excreta inhalation; person-to-person (rare)',
  personToPerson: true,
  fatalityRate: 37.5,
  reservoirHost: 'Long-tailed rice rat (Oligoryzomys longicaudatus)',
  geographicRange: 'South America (Chile, Argentina); currently spreading via cruise ship outbreak',
};

const now = new Date();
const formatTime = (offset: number) => {
  const d = new Date(now.getTime() - offset * 60000);
  return d.toISOString();
};

export const liveFeedData: LiveUpdate[] = [
  {
    id: '1',
    timestamp: formatTime(2),
    source: 'CDC',
    severity: 'critical',
    title: 'CDC EMERGENCY HEALTH ADVISORY — MV Hondius Outbreak Update',
    content: 'CDC confirms 8 cases of Andes hantavirus linked to MV Hondius cruise ship. 3 deaths reported. All passengers and crew from the January 2024 voyage are urged to contact their healthcare provider immediately. CDC Level 3 emergency response is active.',
  },
  {
    id: '2',
    timestamp: formatTime(15),
    source: 'WHO',
    severity: 'critical',
    title: 'WHO Disease Outbreak News — Hantavirus (Andes) Cluster',
    content: 'WHO is monitoring an international cluster of Andes hantavirus cases linked to a common exposure on a polar expedition cruise ship. Cases have been reported in South Africa, Netherlands, and Switzerland. Risk to the general public remains LOW. Healthcare facilities should maintain heightened vigilance.',
  },
  {
    id: '3',
    timestamp: formatTime(32),
    source: 'ECDC',
    severity: 'warning',
    title: 'ECDC Rapid Risk Assessment — Hantavirus Cases in EU/EEA',
    content: 'ECDC has initiated a rapid risk assessment following confirmed hantavirus cases in Netherlands. Contact tracing is ongoing across multiple countries. EU/EEA health authorities have been notified. The overall risk to the general population in Europe is assessed as LOW.',
  },
  {
    id: '4',
    timestamp: formatTime(58),
    source: 'CDC',
    severity: 'warning',
    title: 'Multi-State Health Alert — HPS Exposure Monitoring',
    content: 'Health departments in Texas, New Jersey, Georgia, California, Virginia, and Arizona are monitoring 9 individuals with potential hantavirus exposure from the MV Hondius voyage. These individuals are in home isolation with daily symptom monitoring. No new confirmed cases.',
  },
  {
    id: '5',
    timestamp: formatTime(90),
    source: 'ProMED',
    severity: 'info',
    title: 'ProMED-mail — HANTAVIRUS, ANDES: PERSON-TO-PERSON TRANSMISSION CONCERN',
    content: 'Andes virus (ANDV) is unique among hantaviruses in its documented ability for person-to-person transmission. Cases from South America have confirmed this route. The current outbreak investigation is focused on determining if person-to-person transmission occurred aboard MV Hondius.',
  },
  {
    id: '6',
    timestamp: formatTime(125),
    source: 'CDC',
    severity: 'info',
    title: 'Genomic Sequencing Update — ANDV Strain Characterization',
    content: 'Preliminary genomic sequencing of specimens from confirmed cases shows the virus belongs to the Andes virus clade, consistent with South American origin. Full phylogenetic analysis is underway. No evidence of genetic mutations affecting transmissibility or virulence detected to date.',
  },
  {
    id: '7',
    timestamp: formatTime(180),
    source: 'WHO',
    severity: 'info',
    title: 'WHO Situation Report — International Contact Tracing Progress',
    content: 'International contact tracing has identified 147 individuals under monitoring across 12 countries. All close contacts of confirmed cases have been notified. WHO is coordinating with national health authorities to ensure consistent monitoring protocols across all affected countries.',
  },
  {
    id: '8',
    timestamp: formatTime(240),
    source: 'CDC',
    severity: 'info',
    title: 'Historical Context — Hantavirus Pulmonary Syndrome in the US',
    content: 'Since 1993, CDC has recorded 890 confirmed HPS cases in the US, with a 36% case fatality rate. The majority of cases (94%) occur west of the Mississippi River. Sin Nombre virus is responsible for most US cases, affecting primarily rural populations with rodent exposure.',
  },
];
