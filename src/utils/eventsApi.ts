// src/utils/eventsApi.ts
// Aggregates upcoming events from multiple sources:
//   - Major sporting events (sportsEvents.ts)
//   - Upcoming public holidays (holidayApi.ts)
//   - Day-of notable observances (e.g. "International Day of X")
//
// Powers the landing page "next big event" countdown + news section.
// Used by GET /api/v1/events/upcoming.

import { SPORTS_EVENTS, getUpcomingSportsEvents } from "../data/sports/sportsEvents";
import type { SportEvent } from "../types/sportEvent";
import { getUpcomingHolidaysForCountry, type Holiday } from "./holidayApi";
import type { CountryCode } from "../types";

export type EventSource = "sports" | "holiday" | "observance";

export interface AggregatedEvent {
  id: string;
  source: EventSource;
  title: string;
  description?: string;
  /** ISO 8601 UTC start time */
  startUtc: string;
  /** ISO 8601 UTC end time (optional) */
  endUtc?: string;
  /** Location */
  city?: string;
  country?: string;
  /** IANA timezone */
  timezone?: string;
  /** Time until event starts (negative if started, positive if upcoming) */
  msUntilStart: number;
  /** Human-readable countdown: "87 days, 4 hours" */
  countdown: string;
  url?: string;
  tags: string[];
}

function timeUntil(isoUtc: string, now: Date): { ms: number; label: string } {
  const ms = new Date(isoUtc).getTime() - now.getTime();
  if (ms <= 0) return { ms, label: "started" };

  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);

  if (days > 0) return { ms, label: `${days} day${days === 1 ? "" : "s"}, ${hours}h` };
  if (hours > 0) return { ms, label: `${hours}h ${minutes}m` };
  if (minutes > 0) return { ms, label: `${minutes}m ${seconds}s` };
  return { ms, label: `${seconds}s` };
}

function holidayToEvent(h: Holiday, country: CountryCode, now: Date): AggregatedEvent {
  const dateIso = `${h.date}T00:00:00Z`; // midnight UTC
  const { ms, label } = timeUntil(dateIso, now);
  return {
    id: `holiday-${country}-${h.date}`,
    source: "holiday",
    title: h.name_en,
    description: h.description,
    startUtc: dateIso,
    msUntilStart: ms,
    countdown: label,
    country,
    tags: [h.type, "holiday", country.toLowerCase()],
  };
}

function sportsToEvent(e: SportEvent, now: Date): AggregatedEvent {
  const { ms, label } = timeUntil(e.startUtc, now);
  return {
    id: e.id,
    source: "sports",
    title: e.name,
    description: `Venue: ${e.venue}`,
    startUtc: e.startUtc,
    endUtc: e.endUtc,
    city: e.city,
    country: e.country,
    timezone: e.timezone,
    msUntilStart: ms,
    countdown: label,
    url: e.urls.official,
    tags: e.tags,
  };
}

/**
 * Get upcoming events, sorted by time until start.
 * Filterable by country (filters sports events to that country) and source.
 */
export function getUpcomingEvents(opts: {
  now?: Date;
  limit?: number;
  source?: EventSource;
  country?: CountryCode | string;
} = {}): AggregatedEvent[] {
  const { now = new Date(), limit = 10, source, country } = opts;

  const events: AggregatedEvent[] = [];

  if (!source || source === "sports") {
    const sports = getUpcomingSportsEvents(now);
    const filtered = country
      ? sports.filter((e) => e.country === country)
      : sports;
    events.push(...filtered.map((e) => sportsToEvent(e, now)));
  }

  if (!source || source === "holiday") {
    const codes: CountryCode[] = country
      ? [country as CountryCode]
      : (["US", "GB", "FR", "DE", "JP", "CN", "IN", "BR", "AU", "CA"] as CountryCode[]);
    codes.forEach((code) => {
      const holidays = getUpcomingHolidaysForCountry(code, 2);
      events.push(...holidays.map((h) => holidayToEvent(h, code, now)));
    });
  }

  return events
    .filter((e) => e.msUntilStart > 0)
    .sort((a, b) => a.msUntilStart - b.msUntilStart)
    .slice(0, limit);
}

/** Get the single next big event (used for hero countdown). */
export function getNextBigEvent(now: Date = new Date()): AggregatedEvent | null {
  return getUpcomingEvents({ now, limit: 1 })[0] ?? null;
}

/** All configured sports event count for diagnostics. */
export function sportsEventCount(): number {
  return SPORTS_EVENTS.length;
}