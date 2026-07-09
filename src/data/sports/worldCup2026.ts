// src/data/sports/worldCup2026.ts
// FIFA World Cup 2026 — 16 host cities + curated match schedule.
//
// Tournament facts (source: fifa.com, wikipedia):
//   - Dates: June 11 – July 19, 2026
//   - Format: 48 teams, 12 groups of 4, 104 matches total
//   - Final: MetLife Stadium, East Rutherford, NJ (USA) — July 19, 2026
//   - Host countries: USA (11 cities), Canada (2 cities), Mexico (3 cities)

export interface HostCity {
  code: string;
  name: string;
  countryCode: "US" | "CA" | "MX";
  stadium: string;
  timezone: string;
  capacity: number;
}

export const HOST_CITIES: HostCity[] = [
  { code: "ATL", name: "Atlanta",          countryCode: "US", stadium: "Mercedes-Benz Stadium",     timezone: "America/New_York",    capacity: 71000 },
  { code: "BOS", name: "Boston",           countryCode: "US", stadium: "Gillette Stadium",          timezone: "America/New_York",    capacity: 65878 },
  { code: "DAL", name: "Dallas",           countryCode: "US", stadium: "AT&T Stadium",               timezone: "America/Chicago",     capacity: 80000 },
  { code: "HOU", name: "Houston",          countryCode: "US", stadium: "NRG Stadium",                timezone: "America/Chicago",     capacity: 72220 },
  { code: "KC",  name: "Kansas City",      countryCode: "US", stadium: "GEHA Field at Arrowhead",    timezone: "America/Chicago",     capacity: 76416 },
  { code: "LAX", name: "Los Angeles",      countryCode: "US", stadium: "SoFi Stadium",               timezone: "America/Los_Angeles", capacity: 70240 },
  { code: "MIA", name: "Miami",            countryCode: "US", stadium: "Hard Rock Stadium",          timezone: "America/New_York",    capacity: 65326 },
  { code: "NYC", name: "New York / NJ",    countryCode: "US", stadium: "MetLife Stadium",            timezone: "America/New_York",    capacity: 82500 },
  { code: "PHL", name: "Philadelphia",     countryCode: "US", stadium: "Lincoln Financial Field",    timezone: "America/New_York",    capacity: 69596 },
  { code: "SFO", name: "San Francisco",    countryCode: "US", stadium: "Levi's Stadium",             timezone: "America/Los_Angeles", capacity: 68500 },
  { code: "SEA", name: "Seattle",          countryCode: "US", stadium: "Lumen Field",                timezone: "America/Los_Angeles", capacity: 69000 },
  { code: "YVR", name: "Vancouver",        countryCode: "CA", stadium: "BC Place",                   timezone: "America/Vancouver",   capacity: 54500 },
  { code: "YUL", name: "Montréal",         countryCode: "CA", stadium: "Stade Saputo",               timezone: "America/Toronto",     capacity: 33000 },
  { code: "GDL", name: "Guadalajara",      countryCode: "MX", stadium: "Estadio Akron",              timezone: "America/Mexico_City", capacity: 46000 },
  { code: "MTY", name: "Monterrey",        countryCode: "MX", stadium: "Estadio BBVA",               timezone: "America/Monterrey",   capacity: 53500 },
  { code: "MEX", name: "Mexico City",      countryCode: "MX", stadium: "Estadio Azteca",             timezone: "America/Mexico_City", capacity: 87523 },
];

export interface Match {
  id: string;
  stage: string;
  group: string | null;
  matchNumber: number;
  date: string;
  kickoffUtc: string;
  cityCode: string;
  stadium: string;
  home: string;
  away: string;
}

export const MATCHES: Match[] = [
  { id: "wc26-001", stage: "Group", group: "A", matchNumber: 1,  date: "2026-06-11", kickoffUtc: "2026-06-11T23:00:00Z", cityCode: "MEX", stadium: "Estadio Azteca", home: "TBD A1", away: "TBD A2" },
  { id: "wc26-002", stage: "Group", group: "A", matchNumber: 2,  date: "2026-06-12", kickoffUtc: "2026-06-12T20:00:00Z", cityCode: "GDL", stadium: "Estadio Akron", home: "TBD A3", away: "TBD A4" },
  { id: "wc26-014", stage: "Group", group: "B", matchNumber: 14, date: "2026-06-13", kickoffUtc: "2026-06-13T22:00:00Z", cityCode: "LAX", stadium: "SoFi Stadium", home: "TBD B1", away: "TBD B2" },
  { id: "wc26-024", stage: "Group", group: "C", matchNumber: 24, date: "2026-06-14", kickoffUtc: "2026-06-14T23:30:00Z", cityCode: "DAL", stadium: "AT&T Stadium", home: "TBD C1", away: "TBD C2" },
  { id: "wc26-038", stage: "Group", group: "D", matchNumber: 38, date: "2026-06-15", kickoffUtc: "2026-06-15T19:00:00Z", cityCode: "NYC", stadium: "MetLife Stadium", home: "TBD D1", away: "TBD D2" },
  { id: "wc26-050", stage: "Group", group: "E", matchNumber: 50, date: "2026-06-16", kickoffUtc: "2026-06-16T20:00:00Z", cityCode: "MIA", stadium: "Hard Rock Stadium", home: "TBD E1", away: "TBD E2" },
  { id: "wc26-062", stage: "Group", group: "F", matchNumber: 62, date: "2026-06-17", kickoffUtc: "2026-06-17T18:00:00Z", cityCode: "SEA", stadium: "Lumen Field", home: "TBD F1", away: "TBD F2" },
  { id: "wc26-074", stage: "Group", group: "G", matchNumber: 74, date: "2026-06-18", kickoffUtc: "2026-06-18T22:00:00Z", cityCode: "SFO", stadium: "Levi's Stadium", home: "TBD G1", away: "TBD G2" },
  { id: "wc26-084", stage: "Group", group: "H", matchNumber: 84, date: "2026-06-19", kickoffUtc: "2026-06-19T23:00:00Z", cityCode: "ATL", stadium: "Mercedes-Benz Stadium", home: "TBD H1", away: "TBD H2" },
  { id: "wc26-090", stage: "Group", group: "I", matchNumber: 90, date: "2026-06-20", kickoffUtc: "2026-06-20T19:00:00Z", cityCode: "BOS", stadium: "Gillette Stadium", home: "TBD I1", away: "TBD I2" },
  { id: "wc26-095", stage: "Group", group: "J", matchNumber: 95, date: "2026-06-21", kickoffUtc: "2026-06-21T20:00:00Z", cityCode: "HOU", stadium: "NRG Stadium", home: "TBD J1", away: "TBD J2" },
  { id: "wc26-099", stage: "Group", group: "K", matchNumber: 99, date: "2026-06-22", kickoffUtc: "2026-06-22T19:00:00Z", cityCode: "PHL", stadium: "Lincoln Financial Field", home: "TBD K1", away: "TBD K2" },
  { id: "wc26-103", stage: "Group", group: "L", matchNumber: 103, date: "2026-06-23", kickoffUtc: "2026-06-23T23:00:00Z", cityCode: "YVR", stadium: "BC Place", home: "TBD L1", away: "TBD L2" },
  { id: "wc26-r16-1", stage: "R16", group: null, matchNumber: 89, date: "2026-06-28", kickoffUtc: "2026-06-28T20:00:00Z", cityCode: "MIA", stadium: "Hard Rock Stadium", home: "Winner A", away: "Runner-up B" },
  { id: "wc26-r16-2", stage: "R16", group: null, matchNumber: 90, date: "2026-06-29", kickoffUtc: "2026-06-29T22:00:00Z", cityCode: "KC", stadium: "GEHA Field at Arrowhead", home: "Winner C", away: "Runner-up D" },
  { id: "wc26-r16-3", stage: "R16", group: null, matchNumber: 91, date: "2026-06-30", kickoffUtc: "2026-06-30T23:00:00Z", cityCode: "DAL", stadium: "AT&T Stadium", home: "Winner E", away: "Runner-up F" },
  { id: "wc26-r16-4", stage: "R16", group: null, matchNumber: 92, date: "2026-07-01", kickoffUtc: "2026-07-01T22:00:00Z", cityCode: "MEX", stadium: "Estadio Azteca", home: "Winner G", away: "Runner-up H" },
  { id: "wc26-qf-1", stage: "QF", group: null, matchNumber: 97, date: "2026-07-10", kickoffUtc: "2026-07-10T22:00:00Z", cityCode: "ATL", stadium: "Mercedes-Benz Stadium", home: "TBD", away: "TBD" },
  { id: "wc26-qf-2", stage: "QF", group: null, matchNumber: 98, date: "2026-07-11", kickoffUtc: "2026-07-11T22:00:00Z", cityCode: "LAX", stadium: "SoFi Stadium", home: "TBD", away: "TBD" },
  { id: "wc26-sf-1", stage: "SF", group: null, matchNumber: 101, date: "2026-07-14", kickoffUtc: "2026-07-14T22:00:00Z", cityCode: "DAL", stadium: "AT&T Stadium", home: "TBD", away: "TBD" },
  { id: "wc26-sf-2", stage: "SF", group: null, matchNumber: 102, date: "2026-07-15", kickoffUtc: "2026-07-15T22:00:00Z", cityCode: "ATL", stadium: "Mercedes-Benz Stadium", home: "TBD", away: "TBD" },
  { id: "wc26-3rd", stage: "3rd", group: null, matchNumber: 103, date: "2026-07-18", kickoffUtc: "2026-07-18T20:00:00Z", cityCode: "MIA", stadium: "Hard Rock Stadium", home: "Loser SF1", away: "Loser SF2" },
  { id: "wc26-final", stage: "Final", group: null, matchNumber: 104, date: "2026-07-19", kickoffUtc: "2026-07-19T20:00:00Z", cityCode: "NYC", stadium: "MetLife Stadium", home: "Winner SF1", away: "Winner SF2" },
];

export function getNextMatch(now: Date = new Date()): Match | null {
  const nowMs = now.getTime();
  const upcoming = MATCHES
    .filter((m) => new Date(m.kickoffUtc).getTime() > nowMs)
    .sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime());
  return upcoming[0] ?? null;
}

export function getHostCity(code: string): HostCity | undefined {
  return HOST_CITIES.find((c) => c.code === code);
}

export const STAGE_ORDER: string[] = ["Group", "R16", "QF", "SF", "3rd", "Final"];

export function groupByStage(matches: Match[]): Record<string, Match[]> {
  const out: Record<string, Match[]> = {};
  for (const m of matches) {
    (out[m.stage] ??= []).push(m);
  }
  return out;
}

export function groupMatchesByLetter(matches: Match[]): Record<string, Match[]> {
  const out: Record<string, Match[]> = {};
  for (const m of matches) {
    const key = m.group ?? "—";
    (out[key] ??= []).push(m);
  }
  return out;
}
