// src/utils/dstApi.ts
// DST transitions for a given timezone in a given year.
// Used by the landing page "DST changes coming up" alert + future DST widgets.

export interface DstTransition {
  /** ISO 8601 UTC when the transition happens */
  utc: string;
  /** Local time at the moment of transition */
  local: string;
  /** Description: "Spring forward" / "Fall back" */
  type: "spring-forward" | "fall-back" | "no-change";
  /** Offset before transition (e.g. -0500 for EST) */
  offsetBefore: string;
  /** Offset after transition (e.g. -0400 for EDT) */
  offsetAfter: string;
}

export interface DstInfo {
  timezone: string;
  year: number;
  /** Whether this timezone observes DST at all */
  observesDst: boolean;
  /** List of transitions in the year (typically 0 or 2) */
  transitions: DstTransition[];
  /** Next transition after today (if any) */
  nextTransition: DstTransition | null;
}

/**
 * Detect DST transitions in a timezone for a year.
 * Pure function — uses Intl.DateTimeFormat to detect offset changes.
 */
export function dstInfo(timezone: string, year: number = new Date().getFullYear(), now: Date = new Date()): DstInfo {
  const transitions: DstTransition[] = [];

  // Sample offsets every Sunday of the year (DST always changes on Sunday in most zones)
  const samples: Array<{ date: Date; offset: number }> = [];
  const start = new Date(year, 0, 1);
  for (let week = 0; week < 53; week++) {
    const d = new Date(start);
    d.setDate(start.getDate() + week * 7);
    samples.push({ date: d, offset: getOffset(d, timezone) });
  }

  // Detect changes
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const curr = samples[i];
    if (curr.offset !== prev.offset) {
      const isForward = curr.offset > prev.offset;
      transitions.push({
        utc: curr.date.toISOString(),
        local: new Intl.DateTimeFormat("en-US", { timeZone: timezone, dateStyle: "long", timeStyle: "short" }).format(curr.date),
        type: isForward ? "spring-forward" : "fall-back",
        offsetBefore: formatOffset(prev.offset),
        offsetAfter: formatOffset(curr.offset),
      });
    }
  }

  const nextTransition = transitions.find((t) => new Date(t.utc).getTime() > now.getTime()) ?? null;
  const observesDst = transitions.length > 0;

  return { timezone, year, observesDst, transitions, nextTransition };
}

function getOffset(date: Date, tz: string): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
  return Math.round((tzDate.getTime() - utcDate.getTime()) / 60_000);
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const absMin = Math.abs(minutes);
  const h = String(Math.floor(absMin / 60)).padStart(2, "0");
  const m = String(absMin % 60).padStart(2, "0");
  return `UTC${sign}${h}:${m}`;
}

/**
 * Get upcoming DST changes for popular timezones.
 * Used by the landing page "DST alert" section.
 */
export function getUpcomingDstChanges(now: Date = new Date()): DstInfo[] {
  const popularTzs = [
    "America/New_York", "America/Los_Angeles", "America/Chicago", "America/Denver",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid",
    "Asia/Tokyo", "Australia/Sydney",
  ];
  return popularTzs
    .map((tz) => dstInfo(tz, now.getFullYear(), now))
    .filter((info) => info.nextTransition !== null);
}