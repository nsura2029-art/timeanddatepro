// src/data/regions.ts
// Country subdivisions (states / provinces / regions) with the cities that
// fall inside each. Drives the LocationPicker's "Florida" → [Miami, Tampa,
// Orlando, ...] typeahead behavior.

import { CITIES } from "./cities";

export interface RegionEntry {
  id: string;                 // "US-FL"
  name: string;               // "Florida"
  country: string;            // "United States"
  countryCode: string;        // "US"
  timezone: string;           // IANA — default for the region (state capital / largest city)
  cityCodes: string[];        // references into CITIES via code
  population?: number;        // sum of cities, used for ranking
}

// ---------- US STATES (all 50) ----------
// We derive cityCodes from CITIES automatically so the data can't drift.

function buildRegions(prefix: string, name: string, country: string, countryCode: string, items: { state: string; tz: string; pop: number }[]): RegionEntry[] {
  return items.map((it) => {
    const cityCodes = CITIES
      .filter((c) => c.countryCode === countryCode && c.state === it.state)
      .map((c) => c.code);
    return {
      id: `${prefix}-${it.state.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
      name: it.state,
      country,
      countryCode,
      timezone: it.tz,
      cityCodes,
      population: it.pop,
    } as RegionEntry;
  }).filter((r) => r.cityCodes.length > 0);
}

const US_STATES = buildRegions("US", "State", "United States", "US", [
  { state: "Alabama",              tz: "America/Chicago",      pop: 0 },
  { state: "Alaska",               tz: "America/Anchorage",    pop: 0 },
  { state: "Arizona",              tz: "America/Phoenix",      pop: 0 },
  { state: "Arkansas",             tz: "America/Chicago",      pop: 0 },
  { state: "California",           tz: "America/Los_Angeles",  pop: 0 },
  { state: "Colorado",             tz: "America/Denver",       pop: 0 },
  { state: "Connecticut",          tz: "America/New_York",     pop: 0 },
  { state: "Delaware",             tz: "America/New_York",     pop: 0 },
  { state: "District of Columbia", tz: "America/New_York",     pop: 0 },
  { state: "Florida",              tz: "America/New_York",     pop: 0 },
  { state: "Georgia",              tz: "America/New_York",     pop: 0 },
  { state: "Hawaii",               tz: "Pacific/Honolulu",     pop: 0 },
  { state: "Idaho",                tz: "America/Boise",        pop: 0 },
  { state: "Illinois",             tz: "America/Chicago",      pop: 0 },
  { state: "Indiana",              tz: "America/Indiana/Indianapolis", pop: 0 },
  { state: "Iowa",                 tz: "America/Chicago",      pop: 0 },
  { state: "Kansas",               tz: "America/Chicago",      pop: 0 },
  { state: "Kentucky",             tz: "America/Kentucky/Louisville", pop: 0 },
  { state: "Louisiana",            tz: "America/Chicago",      pop: 0 },
  { state: "Maine",                tz: "America/New_York",     pop: 0 },
  { state: "Maryland",             tz: "America/New_York",     pop: 0 },
  { state: "Massachusetts",        tz: "America/New_York",     pop: 0 },
  { state: "Michigan",             tz: "America/New_York",     pop: 0 },
  { state: "Minnesota",            tz: "America/Chicago",      pop: 0 },
  { state: "Mississippi",          tz: "America/Chicago",      pop: 0 },
  { state: "Missouri",             tz: "America/Chicago",      pop: 0 },
  { state: "Montana",              tz: "America/Denver",       pop: 0 },
  { state: "Nebraska",             tz: "America/Chicago",      pop: 0 },
  { state: "Nevada",               tz: "America/Los_Angeles",  pop: 0 },
  { state: "New Hampshire",        tz: "America/New_York",     pop: 0 },
  { state: "New Jersey",           tz: "America/New_York",     pop: 0 },
  { state: "New Mexico",           tz: "America/Denver",       pop: 0 },
  { state: "New York",             tz: "America/New_York",     pop: 0 },
  { state: "North Carolina",       tz: "America/New_York",     pop: 0 },
  { state: "North Dakota",         tz: "America/Chicago",      pop: 0 },
  { state: "Ohio",                 tz: "America/New_York",     pop: 0 },
  { state: "Oklahoma",             tz: "America/Chicago",      pop: 0 },
  { state: "Oregon",               tz: "America/Los_Angeles",  pop: 0 },
  { state: "Pennsylvania",         tz: "America/New_York",     pop: 0 },
  { state: "Rhode Island",         tz: "America/New_York",     pop: 0 },
  { state: "South Carolina",       tz: "America/New_York",     pop: 0 },
  { state: "South Dakota",         tz: "America/Chicago",      pop: 0 },
  { state: "Tennessee",            tz: "America/Chicago",      pop: 0 },
  { state: "Texas",                tz: "America/Chicago",      pop: 0 },
  { state: "Utah",                 tz: "America/Denver",       pop: 0 },
  { state: "Vermont",              tz: "America/New_York",     pop: 0 },
  { state: "Virginia",             tz: "America/New_York",     pop: 0 },
  { state: "Washington",           tz: "America/Los_Angeles",  pop: 0 },
  { state: "West Virginia",        tz: "America/New_York",     pop: 0 },
  { state: "Wisconsin",            tz: "America/Chicago",      pop: 0 },
  { state: "Wyoming",              tz: "America/Denver",       pop: 0 },
]);

// ---------- CANADIAN PROVINCES ----------
const CA_PROVINCES = buildRegions("CA", "Province", "Canada", "CA", [
  { state: "Ontario",          tz: "America/Toronto",   pop: 0 },
  { state: "Quebec",           tz: "America/Toronto",   pop: 0 },
  { state: "British Columbia", tz: "America/Vancouver", pop: 0 },
  { state: "Alberta",          tz: "America/Edmonton",  pop: 0 },
  { state: "Manitoba",         tz: "America/Winnipeg",  pop: 0 },
  { state: "Saskatchewan",     tz: "America/Regina",    pop: 0 },
  { state: "Nova Scotia",      tz: "America/Halifax",   pop: 0 },
]);

// ---------- AUSTRALIAN STATES ----------
const AU_STATES = buildRegions("AU", "State", "Australia", "AU", [
  { state: "New South Wales",               tz: "Australia/Sydney",    pop: 0 },
  { state: "Victoria",                      tz: "Australia/Melbourne", pop: 0 },
  { state: "Queensland",                    tz: "Australia/Brisbane",  pop: 0 },
  { state: "Western Australia",             tz: "Australia/Perth",     pop: 0 },
  { state: "South Australia",               tz: "Australia/Adelaide",  pop: 0 },
  { state: "Australian Capital Territory",  tz: "Australia/Sydney",    pop: 0 },
]);

// ---------- INDIAN STATES (the ones with cities in CITIES) ----------
const IN_STATES = buildRegions("IN", "State", "India", "IN", [
  { state: "Delhi",          tz: "Asia/Kolkata", pop: 0 },
  { state: "Maharashtra",    tz: "Asia/Kolkata", pop: 0 },
  { state: "Karnataka",      tz: "Asia/Kolkata", pop: 0 },
  { state: "Tamil Nadu",     tz: "Asia/Kolkata", pop: 0 },
  { state: "West Bengal",    tz: "Asia/Kolkata", pop: 0 },
  { state: "Telangana",      tz: "Asia/Kolkata", pop: 0 },
  { state: "Gujarat",        tz: "Asia/Kolkata", pop: 0 },
  { state: "Rajasthan",      tz: "Asia/Kolkata", pop: 0 },
  { state: "Uttar Pradesh",  tz: "Asia/Kolkata", pop: 0 },
  { state: "Goa",            tz: "Asia/Kolkata", pop: 0 },
  { state: "Kerala",         tz: "Asia/Kolkata", pop: 0 },
]);

// ---------- BRAZILIAN STATES ----------
const BR_STATES = buildRegions("BR", "State", "Brazil", "BR", [
  { state: "São Paulo",      tz: "America/Sao_Paulo", pop: 0 },
  { state: "Rio de Janeiro", tz: "America/Sao_Paulo", pop: 0 },
]);

export const REGIONS: RegionEntry[] = [
  ...US_STATES,
  ...CA_PROVINCES,
  ...AU_STATES,
  ...IN_STATES,
  ...BR_STATES,
];

export const REGION_BY_ID: Record<string, RegionEntry> =
  Object.fromEntries(REGIONS.map((r) => [r.id, r]));

// Group regions by country for fast lookup
export const REGIONS_BY_COUNTRY: Record<string, RegionEntry[]> = {};
for (const r of REGIONS) {
  (REGIONS_BY_COUNTRY[r.countryCode] ||= []).push(r);
}