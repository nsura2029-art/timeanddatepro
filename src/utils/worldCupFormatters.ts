// src/utils/worldCupFormatters.ts
// Date/time helpers specific to the FIFA World Cup section.

import type { HostCity, Match } from "../data/sports/worldCup2026";

/**
 * Format kickoff UTC into the host city's local time as e.g. "Sat, Jul 19 · 16:00".
 */
export function formatMatchLocal(match: Match, hostCity: HostCity): string {
  const date = new Date(match.kickoffUtc);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: hostCity.timezone,
    weekday: "short",
  }).format(date);
  const dayMonth = new Intl.DateTimeFormat("en-US", {
    timeZone: hostCity.timezone,
    month: "short",
    day: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: hostCity.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${weekday}, ${dayMonth} · ${time}`;
}

/**
 * Format kickoff UTC into UTC time as e.g. "20:00 UTC".
 */
export function formatMatchUtc(match: Match): string {
  const date = new Date(match.kickoffUtc);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${time} UTC`;
}

/**
 * Format kickoff as just the time in host city, e.g. "16:00".
 */
export function formatMatchTimeOnly(match: Match, hostCity: HostCity): string {
  const date = new Date(match.kickoffUtc);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: hostCity.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Format kickoff as just the date in host city, e.g. "Sat, Jul 19".
 */
export function formatMatchDateOnly(match: Match, hostCity: HostCity): string {
  const date = new Date(match.kickoffUtc);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: hostCity.timezone,
    weekday: "short",
  }).format(date);
  const dayMonth = new Intl.DateTimeFormat("en-US", {
    timeZone: hostCity.timezone,
    month: "short",
    day: "numeric",
  }).format(date);
  return `${weekday}, ${dayMonth}`;
}

/**
 * Time until a match (e.g. "in 14 days" or "tomorrow" or "now").
 */
export function timeUntilMatch(match: Match, now: Date = new Date()): string {
  const ms = new Date(match.kickoffUtc).getTime() - now.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (ms < 0) return "started";
  if (days === 0 && hours === 0) return "starting now";
  if (days === 0) return `in ${hours}h`;
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 14) return "next week";
  return `in ${Math.floor(days / 7)} weeks`;
}

/**
 * Format current local time in a host city, e.g. "16:42".
 */
export function formatCityLocalTime(now: Date, city: HostCity): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: city.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

/**
 * Get the UTC offset of a city at a given moment, e.g. "-04:00" or "+09:00".
 */
export function getCityOffset(now: Date, city: HostCity): string {
  const offsetStr = new Intl.DateTimeFormat("en-US", {
    timeZone: city.timezone,
    timeZoneName: "shortOffset",
  }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value || "UTC";
  const m = offsetStr.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return offsetStr;
  const [, sign, h, mm] = m;
  return `${sign}${parseInt(h, 10).toString().padStart(2, "0")}:${(mm || "00").padStart(2, "0")}`;
}