// src/utils/timeApi.ts
// Pure functions powering the public API (and reused by the SDK).
// No Express, no React — easy to test, easy to embed.

import { CITY_DATA, COUNTRY_HOLIDAYS, DEFAULT_PREFERENCES, detectCountryFromTimezone } from "../data/countries";
import type { CountryCode, Holiday } from "../types";

// ──────────────────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────────────────

export function parseISODate(input: string | Date): Date {
  if (input instanceof Date) return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!m) throw new ApiError(400, "BAD_DATE", `Invalid date "${input}". Use YYYY-MM-DD.`);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

export function formatISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseClockTime(input: string): { hours: number; minutes: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(input);
  if (!m) throw new ApiError(400, "BAD_TIME", `Invalid time "${input}". Use HH:MM 24h.`);
  const hours = +m[1], minutes = +m[2];
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new ApiError(400, "BAD_TIME", `Time "${input}" out of range.`);
  }
  return { hours, minutes };
}

/** Airport/IATA-style aliases not already in CITY_DATA. */
const CITY_ALIASES: Record<string, { tz: string; city: string; code: string }> = {
  LDN: { tz: "Europe/London", city: "London", code: "LDN" },
  TYO: { tz: "Asia/Tokyo", city: "Tokyo", code: "TYO" },
  LAX: { tz: "America/Los_Angeles", city: "Los Angeles", code: "LAX" },
  JFK: { tz: "America/New_York", city: "New York", code: "JFK" },
  SFO: { tz: "America/Los_Angeles", city: "San Francisco", code: "SFO" },
  DXB: { tz: "Asia/Dubai", city: "Dubai", code: "DXB" },
  SIN: { tz: "Asia/Singapore", city: "Singapore", code: "SIN" },
  HKG: { tz: "Asia/Hong_Kong", city: "Hong Kong", code: "HKG" },
  SYD: { tz: "Australia/Sydney", city: "Sydney", code: "SYD" },
  MEL: { tz: "Australia/Melbourne", city: "Melbourne", code: "MEL" },
  PAR: { tz: "Europe/Paris", city: "Paris", code: "PAR" },
  BER: { tz: "Europe/Berlin", city: "Berlin", code: "BER" },
  MUM: { tz: "Asia/Kolkata", city: "Mumbai", code: "MUM" },
  DEL: { tz: "Asia/Kolkata", city: "Delhi", code: "DEL" },
  PEK: { tz: "Asia/Shanghai", city: "Beijing", code: "PEK" },
  SHA: { tz: "Asia/Shanghai", city: "Shanghai", code: "SHA" },
  ICN: { tz: "Asia/Seoul", city: "Seoul", code: "ICN" },
  MEX: { tz: "America/Mexico_City", city: "Mexico City", code: "MEX" },
  GRU: { tz: "America/Sao_Paulo", city: "São Paulo", code: "GRU" },
  GIG: { tz: "America/Sao_Paulo", city: "Rio de Janeiro", code: "GIG" },
  AMS: { tz: "Europe/Amsterdam", city: "Amsterdam", code: "AMS" },
  MAD: { tz: "Europe/Madrid", city: "Madrid", code: "MAD" },
  ROM: { tz: "Europe/Rome", city: "Rome", code: "ROM" },
  FCO: { tz: "Europe/Rome", city: "Rome", code: "FCO" },
  IST: { tz: "Europe/Istanbul", city: "Istanbul", code: "IST" },
  CAI: { tz: "Africa/Cairo", city: "Cairo", code: "CAI" },
  JNB: { tz: "Africa/Johannesburg", city: "Johannesburg", code: "JNB" },
  NAI: { tz: "Africa/Nairobi", city: "Nairobi", code: "NAI" },
  BKK: { tz: "Asia/Bangkok", city: "Bangkok", code: "BKK" },
  KUL: { tz: "Asia/Kuala_Lumpur", city: "Kuala Lumpur", code: "KUL" },
  TPE: { tz: "Asia/Taipei", city: "Taipei", code: "TPE" },
  MNL: { tz: "Asia/Manila", city: "Manila", code: "MNL" },
  AKL: { tz: "Pacific/Auckland", city: "Auckland", code: "AKL" },
  WLG: { tz: "Pacific/Auckland", city: "Wellington", code: "WLG" },
};

export function resolveTimezone(input: string): { tz: string; city: string; code?: string } {
  const raw = input.trim();
  if (!raw) throw new ApiError(400, "MISSING_PARAM", "Timezone or city required.");
  const lower = raw.toLowerCase();

  // 1. direct IANA
  if (raw.includes("/")) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: raw }).format(new Date());
      return { tz: raw, city: raw.split("/").pop()!.replace(/_/g, " ") };
    } catch {
      throw new ApiError(400, "BAD_TIMEZONE", `Unknown timezone "${raw}".`);
    }
  }

  // 2. alias (LDN, JFK, SFO, etc.)
  const alias = Object.entries(CITY_ALIASES).find(([code]) => code.toLowerCase() === lower);
  if (alias) return alias[1];

  // 3. code from CITY_DATA (LON, NYC, TYO, etc.)
  for (const [tz, info] of Object.entries(CITY_DATA)) {
    if (info.code.toLowerCase() === lower) return { tz, city: info.name, code: info.code };
  }
  // 4. city name
  for (const [tz, info] of Object.entries(CITY_DATA)) {
    if (info.name.toLowerCase() === lower) return { tz, city: info.name, code: info.code };
  }

  throw new ApiError(404, "UNKNOWN_CITY", `No timezone/city matches "${raw}".`);
}

/**
 * Numeric offset in minutes east of UTC for `tz` at `at`.
 * Positive = ahead of UTC.  This is the robust computation — don't trust
 * the abbr string from Intl.
 */
export function getOffsetMinutes(tz: string, at: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(at);
  const get = (t: string) => parts.find(p => p.type === t)?.value || "0";
  const asUTC = Date.UTC(
    +get("year"), +get("month") - 1, +get("day"),
    +get("hour") % 24, +get("minute"), +get("second"),
  );
  return Math.round((asUTC - at.getTime()) / 60000);
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

export function getTimeIn(tz: string, at: Date = new Date()): {
  tz: string; iso: string; date: string; time: string; weekday: string; utcOffset: string; abbr: string;
} {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, weekday: "long",
      timeZoneName: "short",
    });
    const parts = fmt.formatToParts(at);
    const get = (t: string) => parts.find(p => p.type === t)?.value || "";
    const weekday = get("weekday");
    const date = `${get("year")}-${get("month")}-${get("day")}`;
    const time = `${get("hour")}:${get("minute")}:${get("second")}`;
    const abbr = parts.find(p => p.type === "timeZoneName")?.value || "";
    const offsetMin = getOffsetMinutes(tz, at);
    return { tz, iso: at.toISOString(), date, time, weekday, utcOffset: formatOffset(offsetMin), abbr };
  } catch {
    throw new ApiError(400, "BAD_TIMEZONE", `Invalid timezone "${tz}".`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Endpoint logic
// ──────────────────────────────────────────────────────────────────────────

export interface NowParams { tz?: string; city?: string; }
export function timeNow(p: NowParams) {
  const tz = p.tz ?? (p.city ? resolveTimezone(p.city).tz : null);
  if (!tz) throw new ApiError(400, "MISSING_PARAM", "Provide ?tz= or ?city=.");
  return getTimeIn(tz, new Date());
}

export interface ConvertParams { from: string; to: string; time?: string; date?: string; }
export function timeConvert(p: ConvertParams) {
  const fromInfo = resolveTimezone(p.from);
  const toInfo = resolveTimezone(p.to);
  // Reference date is today if omitted
  const refDate = p.date ? parseISODate(p.date) : new Date();
  const time = p.time ? parseClockTime(p.time) : { hours: refDate.getUTCHours(), minutes: refDate.getUTCMinutes() };

  // Build a UTC Date representing the requested wall-clock time in `from`.
  // We do this by anchoring on the reference date and applying the offset
  // for `from` at that moment.
  const refUTCAtMidnight = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate()));
  const fromOffsetAtRef = getOffsetMinutes(fromInfo.tz, refUTCAtMidnight);
  const fromAsUTC = new Date(refUTCAtMidnight.getTime() + time.hours * 3600_000 + time.minutes * 60_000 - fromOffsetAtRef * 60_000);

  const src = getTimeIn(fromInfo.tz, fromAsUTC);
  const dst = getTimeIn(toInfo.tz, fromAsUTC);
  const diffMin = getOffsetMinutes(toInfo.tz, fromAsUTC) - fromOffsetAtRef;

  return {
    from: { ...fromInfo, ...src, requestedTime: `${String(time.hours).padStart(2,"0")}:${String(time.minutes).padStart(2,"0")}` },
    to: { ...toInfo, ...dst },
    differenceHours: diffMin / 60,
    sourceUTC: fromAsUTC.toISOString(),
  };
}

export interface DiffParams {
  from: string; to: string;
  mode?: "calendar" | "business";
  country?: CountryCode;
}
export function dateDiff(p: DiffParams) {
  const a = parseISODate(p.from);
  const b = parseISODate(p.to);
  const ms = b.getTime() - a.getTime();
  const days = Math.round(ms / 86_400_000);

  if (p.mode === "business") {
    const country = (p.country ?? detectCountryFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)) as CountryCode;
    const holidays = new Set((COUNTRY_HOLIDAYS[country] || []).map(h => h.date));
    let count = 0;
    const step = a <= b ? 1 : -1;
    const cur = new Date(a);
    const stop = new Date(b);
    while ((step > 0 && cur < stop) || (step < 0 && cur > stop)) {
      cur.setUTCDate(cur.getUTCDate() + step);
      const dow = cur.getUTCDay();
      const iso = formatISODate(cur);
      if (dow !== 0 && dow !== 6 && !holidays.has(iso)) count += step;
    }
    return {
      from: p.from, to: p.to, mode: "business", country,
      calendarDays: Math.abs(days), businessDays: Math.abs(count),
    };
  }

  const totalDays = Math.abs(days);
  const weeks = Math.floor(totalDays / 7);
  const remDays = totalDays % 7;
  let y = b.getUTCFullYear() - a.getUTCFullYear();
  let m = b.getUTCMonth() - a.getUTCMonth();
  let d = b.getUTCDate() - a.getUTCDate();
  if (d < 0) { m--; d += new Date(b.getUTCFullYear(), b.getUTCMonth(), 0).getUTCDate(); }
  if (m < 0) { y--; m += 12; }
  return {
    from: p.from, to: p.to, mode: "calendar",
    totalDays, weeks, remainingDays: remDays,
    years: Math.abs(y), months: Math.abs(m), days: Math.abs(d),
  };
}

export interface AddParams {
  date: string;
  years?: number; months?: number; weeks?: number; days?: number;
  business?: boolean; country?: CountryCode;
}
export function dateAdd(p: AddParams) {
  const base = parseISODate(p.date);
  const out = new Date(base);
  if (p.years) out.setUTCFullYear(out.getUTCFullYear() + p.years);
  if (p.months) out.setUTCMonth(out.getUTCMonth() + p.months);
  if (p.weeks) out.setUTCDate(out.getUTCDate() + p.weeks * 7);
  if (!p.business && p.days) out.setUTCDate(out.getUTCDate() + p.days);
  if (p.business && p.days) {
    const country = (p.country ?? "US") as CountryCode;
    const holidays = new Set((COUNTRY_HOLIDAYS[country] || []).map(h => h.date));
    let remaining = Math.abs(p.days);
    const step = p.days >= 0 ? 1 : -1;
    let safety = 0;
    while (remaining > 0) {
      out.setUTCDate(out.getUTCDate() + step);
      const dow = out.getUTCDay();
      const iso = formatISODate(out);
      if (dow !== 0 && dow !== 6 && !holidays.has(iso)) remaining--;
      if (++safety > 10000) throw new ApiError(400, "RANGE_TOO_LARGE", "Business-day addition > 10000 iterations.");
    }
  }
  return { input: p.date, output: formatISODate(out), business: !!p.business };
}

export interface UnixParams { value: string | number; direction: "to_date" | "to_unix"; unit?: "s" | "ms"; }
export function unixConvert(p: UnixParams) {
  const n = Number(p.value);
  if (!Number.isFinite(n)) throw new ApiError(400, "BAD_VALUE", `Invalid number "${p.value}".`);
  const unit = p.unit ?? (Math.abs(n) > 1e12 ? "ms" : "s");
  if (p.direction === "to_date") {
    const ms = unit === "s" ? n * 1000 : n;
    const d = new Date(ms);
    return { input: n, unit, direction: p.direction, iso: d.toISOString(), utc: d.toUTCString(), local: d.toString() };
  } else {
    const ms = unit === "s" ? n * 1000 : n;
    const s = Math.floor(ms / 1000);
    return { input: n, unit, direction: p.direction, seconds: s, milliseconds: ms, iso: new Date(ms).toISOString() };
  }
}

export interface IsoParams { date: string; format: "8601" | "rfc3339" | "rfc2822" | "week" | "ordinal" | "basic"; tz?: string; }
export function isoFormat(p: IsoParams) {
  const d = parseISODate(p.date);
  const tz = p.tz ?? "UTC";
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-CA", { ...opts, timeZone: tz }).formatToParts(d).reduce<Record<string,string>>((acc, part) => { acc[part.type] = part.value; return acc; }, {});

  switch (p.format) {
    case "8601": {
      const parts = fmt({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      return { input: p.date, format: "ISO 8601", output: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}` };
    }
    case "rfc3339": {
      const parts = fmt({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      const off = formatOffset(getOffsetMinutes(tz, d));
      return { input: p.date, format: "RFC 3339", output: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${off === "+00:00" ? "Z" : off}` };
    }
    case "rfc2822":
      return { input: p.date, format: "RFC 2822", output: d.toUTCString() };
    case "week": {
      const tmp = new Date(d);
      tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return { input: p.date, format: "ISO Week", output: `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}` };
    }
    case "ordinal": {
      const start = Date.UTC(d.getUTCFullYear(), 0, 0);
      const diff = d.getTime() - start;
      const day = Math.floor(diff / 86400000);
      return { input: p.date, format: "ISO Ordinal Day", output: `${d.getUTCFullYear()}-${String(day).padStart(3,"0")}` };
    }
    case "basic": {
      const parts = fmt({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      return { input: p.date, format: "ISO 8601 Basic", output: `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}` };
    }
  }
}

const WORD_NAMES: Record<string, { days: string[]; months: string[] }> = {
  en: { days: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], months: ["January","February","March","April","May","June","July","August","September","October","November","December"] },
  fr: { days: ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"], months: ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"] },
  zh: { days: ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"], months: ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"] },
  ja: { days: ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"], months: ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"] },
};

export interface WordsParams { date: string; lang?: string; }
export function dateToWords(p: WordsParams) {
  const d = parseISODate(p.date);
  const lang = p.lang ?? "en";
  const dict = WORD_NAMES[lang] ?? WORD_NAMES.en;
  const dow = dict.days[d.getUTCDay()];
  const month = dict.months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  let output: string;
  if (lang === "zh") output = `${year}年${month}${day}日 ${dow}`;
  else if (lang === "ja") output = `${year}年${month}${day}日 ${dow}`;
  else if (lang === "fr") output = `${dow} ${day} ${month} ${year}`;
  else output = `${dow}, ${month} ${day}, ${year}`;
  return { input: p.date, lang, output, iso: d.toISOString() };
}

// ──────────────────────────────────────────────────────────────────────────
// Listings
// ──────────────────────────────────────────────────────────────────────────

export function listCities() {
  return [
    ...Object.entries(CITY_DATA).map(([tz, info]) => ({ timezone: tz, ...info })),
    ...Object.entries(CITY_ALIASES).filter(([code]) => !Object.values(CITY_DATA).some(c => c.code === code))
      .map(([code, info]) => ({ timezone: info.tz, name: info.city, country: "—", code })),
  ];
}

export function listCountries(): Array<{ code: CountryCode; name: string; language: string; timezone: string }> {
  return Object.entries(DEFAULT_PREFERENCES).map(([code, prefs]) => ({
    code: code as CountryCode, name: prefs.countryName, language: prefs.language, timezone: prefs.timezone,
  }));
}

export function countryHolidays(code: string, year?: number): { country: string; year: number; holidays: Holiday[] } {
  const cc = code.toUpperCase() as CountryCode;
  if (!COUNTRY_HOLIDAYS[cc]) throw new ApiError(404, "UNKNOWN_COUNTRY", `Unknown country "${code}".`);
  const y = year ?? new Date().getUTCFullYear();
  const all = COUNTRY_HOLIDAYS[cc];
  return { country: cc, year: y, holidays: all.filter(h => h.date.startsWith(String(y))) };
}

export function workingHours(code: string, params: { year?: number; hoursPerDay?: number }) {
  const cc = code.toUpperCase() as CountryCode;
  if (!DEFAULT_PREFERENCES[cc]) throw new ApiError(404, "UNKNOWN_COUNTRY", `Unknown country "${code}".`);
  const y = params.year ?? new Date().getUTCFullYear();
  const hpd = params.hoursPerDay ?? 8;
  const holidays = (COUNTRY_HOLIDAYS[cc] || []).filter(h => h.date.startsWith(String(y)));
  let workingDays = 0;
  const start = new Date(Date.UTC(y, 0, 1));
  const end = new Date(Date.UTC(y + 1, 0, 1));
  const holidaySet = new Set(holidays.map(h => h.date));
  const cur = new Date(start);
  while (cur < end) {
    const dow = cur.getUTCDay();
    const iso = formatISODate(cur);
    if (dow !== 0 && dow !== 6 && !holidaySet.has(iso)) workingDays++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return { country: cc, year: y, hoursPerDay: hpd, workingDays, totalHours: workingDays * hpd, holidays: holidays.length };
}

// ──────────────────────────────────────────────────────────────────────────
// Meeting planner
// ──────────────────────────────────────────────────────────────────────────

export interface MeetingParams {
  cities: string[];
  workingStart?: number;
  workingEnd?: number;
  duration?: number;
}
export function meetingBest(p: MeetingParams) {
  const start = p.workingStart ?? 9;
  const end = p.workingEnd ?? 17;
  const dur = p.duration ?? 60;
  if (!p.cities?.length) throw new ApiError(400, "MISSING_PARAM", "Provide ?cities=NYC,LDN,TYO");
  const slots: Array<{ utcHour: number; perCity: Array<{ city: string; tz: string; localTime: string; utcOffset: string }>; score: number }> = [];
  // Anchor date — pick a Wednesday so weekend logic doesn't bias the result
  const anchor = new Date(Date.UTC(2026, 6, 8));
  for (let h = 0; h < 24; h++) {
    const stamp = new Date(anchor.getTime() + h * 3600_000);
    const perCity = p.cities.map(c => {
      const info = resolveTimezone(c);
      const t = getTimeIn(info.tz, stamp);
      return { city: info.city, tz: info.tz, localTime: t.time, utcOffset: t.utcOffset };
    });
    let inWindow = 0;
    for (const c of perCity) {
      const hh = +c.localTime.split(":")[0];
      if (hh >= start && hh < end) inWindow++;
    }
    slots.push({ utcHour: h, perCity, score: perCity.length ? inWindow / perCity.length : 0 });
  }
  const ranked = [...slots].sort((a, b) => b.score - a.score || a.utcHour - b.utcHour).slice(0, 6);
  return {
    cities: p.cities.map(c => resolveTimezone(c).city),
    workingHours: { start, end },
    duration: dur,
    topSlots: ranked,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// City pair (programmatic SEO backbone)
// ──────────────────────────────────────────────────────────────────────────

export function cityPair(from: string, to: string) {
  const a = resolveTimezone(from);
  const b = resolveTimezone(to);
  const now = new Date();
  const aNow = getTimeIn(a.tz, now);
  const bNow = getTimeIn(b.tz, now);
  return {
    from: { ...a, ...aNow },
    to: { ...b, ...bNow },
    differenceHours: (getOffsetMinutes(a.tz, now) - getOffsetMinutes(b.tz, now)) / 60,
    bestTimeToCall: {
      fromLocal: "9:00 AM",
      toLocal: getTimeIn(b.tz, new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 0, 0))).time,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Custom error class so Express layer can map cleanly
// ──────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}