// src/data/sports/sportsEvents.ts
// Major sporting events with timezone-aware start times.
// Used by /api/v1/events/upcoming for the landing page "next big event" section.
// SEO boost: each event becomes a queryable URL pattern (e.g. /en/events/world-cup-2026).
//
// Sources (manual curation):
//   - FIFA World Cup 2026 official schedule (fifa.com)
//   - IOC Olympics 2028 (olympics.com)
//   - UEFA Champions League (uefa.com)
//   - NBA / MLB / NFL season schedules (team sites)

import type { SportEvent } from "../../types/sportEvent";

export const SPORTS_EVENTS: SportEvent[] = [
  // ===== FIFA World Cup 2026 =====
  // Tournament: June 11 - July 19, 2026
  // 48 teams, 104 matches, 16 host cities across US/MX/CA
  {
    id: "wc2026-final",
    name: "FIFA World Cup 2026 — Final",
    category: "football",
    venue: "MetLife Stadium, East Rutherford, NJ",
    city: "New York",
    country: "US",
    timezone: "America/New_York",
    startUtc: "2026-07-19T20:00:00Z",
    endUtc: "2026-07-19T22:30:00Z",
    status: "upcoming",
    urls: {
      official: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/26",
      wiki: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup",
    },
    tags: ["world-cup", "fifa", "football", "soccer", "final"],
  },
  {
    id: "wc2026-semi-1",
    name: "FIFA World Cup 2026 — Semifinal 1",
    category: "football",
    venue: "AT&T Stadium, Dallas",
    city: "Dallas",
    country: "US",
    timezone: "America/Chicago",
    startUtc: "2026-07-14T22:00:00Z",
    status: "upcoming",
    urls: { official: "https://www.fifa.com/fifaplus" },
    tags: ["world-cup", "fifa", "football", "soccer", "semifinal"],
  },
  {
    id: "wc2026-semi-2",
    name: "FIFA World Cup 2026 — Semifinal 2",
    category: "football",
    venue: "Mercedes-Benz Stadium, Atlanta",
    city: "Atlanta",
    country: "US",
    timezone: "America/New_York",
    startUtc: "2026-07-15T22:00:00Z",
    status: "upcoming",
    urls: { official: "https://www.fifa.com/fifaplus" },
    tags: ["world-cup", "fifa", "football", "soccer", "semifinal"],
  },
  {
    id: "wc2026-quarter-finals",
    name: "FIFA World Cup 2026 — Quarterfinals",
    category: "football",
    venue: "Various (USA/Mexico/Canada)",
    city: "Multiple",
    country: "Multi",
    timezone: "America/New_York",
    startUtc: "2026-07-10T20:00:00Z",
    endUtc: "2026-07-12T22:00:00Z",
    status: "upcoming",
    urls: { official: "https://www.fifa.com/fifaplus" },
    tags: ["world-cup", "fifa", "football", "soccer", "quarterfinal"],
  },
  {
    id: "wc2026-round-of-16",
    name: "FIFA World Cup 2026 — Round of 16",
    category: "football",
    venue: "Various",
    city: "Multiple",
    country: "Multi",
    timezone: "America/New_York",
    startUtc: "2026-06-28T16:00:00Z",
    endUtc: "2026-07-03T22:00:00Z",
    status: "upcoming",
    urls: { official: "https://www.fifa.com/fifaplus" },
    tags: ["world-cup", "fifa", "football", "soccer"],
  },
  {
    id: "wc2026-group-stage",
    name: "FIFA World Cup 2026 — Group Stage",
    category: "football",
    venue: "Various (16 cities)",
    city: "Multiple",
    country: "Multi",
    timezone: "America/New_York",
    startUtc: "2026-06-11T19:00:00Z",
    endUtc: "2026-06-27T22:00:00Z",
    status: "upcoming",
    urls: { official: "https://www.fifa.com/fifaplus" },
    tags: ["world-cup", "fifa", "football", "soccer", "group-stage"],
  },
  {
    id: "wc2026-opening",
    name: "FIFA World Cup 2026 — Opening Match",
    category: "football",
    venue: "Estadio Azteca, Mexico City",
    city: "Mexico City",
    country: "MX",
    timezone: "America/Mexico_City",
    startUtc: "2026-06-11T22:00:00Z",
    status: "upcoming",
    urls: { official: "https://www.fifa.com/fifaplus" },
    tags: ["world-cup", "fifa", "football", "soccer", "opening"],
  },

  // ===== Olympics =====
  {
    id: "olympics-2028-opening",
    name: "Los Angeles 2028 Olympics — Opening Ceremony",
    category: "olympics",
    venue: "SoFi Stadium, Inglewood",
    city: "Los Angeles",
    country: "US",
    timezone: "America/Los_Angeles",
    startUtc: "2028-07-14T17:00:00Z",
    status: "upcoming",
    urls: {
      official: "https://olympics.com/en/olympic-games/los-angeles-2028",
      wiki: "https://en.wikipedia.org/wiki/2028_Summer_Olympics",
    },
    tags: ["olympics", "la-2028", "opening-ceremony"],
  },

  // ===== UEFA Champions League =====
  {
    id: "ucl-2026-final",
    name: "UEFA Champions League 2025/26 — Final",
    category: "football",
    venue: "Puskás Aréna, Budapest",
    city: "Budapest",
    country: "HU",
    timezone: "Europe/Budapest",
    startUtc: "2026-05-30T19:00:00Z",
    status: "upcoming",
    urls: {
      official: "https://www.uefa.com/uefachampionsleague/",
    },
    tags: ["ucl", "champions-league", "football", "soccer", "final"],
  },

  // ===== Tennis =====
  {
    id: "wimbledon-2026-mens-final",
    name: "Wimbledon 2026 — Men's Final",
    category: "tennis",
    venue: "All England Lawn Tennis Club, London",
    city: "London",
    country: "GB",
    timezone: "Europe/London",
    startUtc: "2026-07-12T14:00:00Z",
    status: "upcoming",
    urls: { official: "https://www.wimbledon.com/" },
    tags: ["wimbledon", "tennis", "grand-slam", "final"],
  },
  {
    id: "usopen-2026-mens-final",
    name: "US Open 2026 — Men's Final",
    category: "tennis",
    venue: "USTA Billie Jean King National Tennis Center, New York",
    city: "New York",
    country: "US",
    timezone: "America/New_York",
    startUtc: "2026-09-13T22:00:00Z",
    status: "upcoming",
    urls: { official: "https://www.usopen.org/" },
    tags: ["us-open", "tennis", "grand-slam", "final"],
  },

  // ===== Cricket =====
  {
    id: "t20wc-2026-final",
    name: "ICC Men's T20 World Cup 2026 — Final",
    category: "cricket",
    venue: "Narendra Modi Stadium, Ahmedabad",
    city: "Ahmedabad",
    country: "IN",
    timezone: "Asia/Kolkata",
    startUtc: "2026-03-08T14:30:00Z",
    status: "upcoming",
    urls: { official: "https://www.icc-cricket.com/" },
    tags: ["t20", "world-cup", "cricket", "final"],
  },
];

export function getUpcomingSportsEvents(now: Date = new Date()): SportEvent[] {
  const nowMs = now.getTime();
  return SPORTS_EVENTS
    .filter((e) => new Date(e.startUtc).getTime() > nowMs)
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());
}

export function getNextSportsEvent(now: Date = new Date()): SportEvent | null {
  const upcoming = getUpcomingSportsEvents(now);
  return upcoming[0] ?? null;
}