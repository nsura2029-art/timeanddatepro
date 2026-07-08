// src/index.ts
// @timeanddatepro/sdk — official Node.js client.
//
// Usage:
//   import { TimeAndDatePro } from "@timeanddatepro/sdk";
//   const client = new TimeAndDatePro();                      // free tier
//   const client = new TimeAndDatePro({ apiKey: "xxx" });    // pro tier
//
//   await client.time.now({ city: "TYO" });
//   await client.time.convert({ from: "NYC", to: "TYO", time: "15:00" });
//   await client.meeting.best({ cities: ["NYC", "LDN", "TYO"] });

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: { endpoint: string; version: string; generatedAt: string };
}
export interface ApiFailure {
  success: false;
  error: { code: string; message: string };
  meta: { endpoint: string; version: string; generatedAt: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_BASE_URL = "https://timeanddatepro.com";
const DEFAULT_TIMEOUT = 10_000;

export interface TimeSnapshot {
  tz: string; iso: string; date: string; time: string;
  weekday: string; utcOffset: string; abbr: string;
}

export interface ConvertResult {
  from: TimeSnapshot & { city: string; code?: string; requestedTime?: string };
  to: TimeSnapshot & { city: string; code?: string };
  differenceHours: number;
  sourceUTC: string;
}

export interface CalendarDiff {
  from: string; to: string;
  mode: "calendar";
  totalDays: number; weeks: number; remainingDays: number;
  years: number; months: number; days: number;
}
export interface BusinessDiff {
  from: string; to: string;
  mode: "business";
  country: string;
  calendarDays: number; businessDays: number;
}
export type DiffResult = CalendarDiff | BusinessDiff;

export interface AddResult {
  input: string; output: string; business: boolean;
}

export interface UnixToDateResult {
  input: number; unit: "s" | "ms"; direction: "to_date";
  iso: string; utc: string; local: string;
}
export interface UnixFromDateResult {
  input: number; unit: "s" | "ms"; direction: "to_unix";
  seconds: number; milliseconds: number; iso: string;
}
export type UnixResult = UnixToDateResult | UnixFromDateResult;

export interface IsoResult {
  input: string; format: string; output: string;
}

export interface WordsResult {
  input: string; lang: string; output: string; iso: string;
}

export interface City {
  timezone: string; name: string; country: string; code: string;
}
export interface Country {
  code: string; name: string; language: string; timezone: string;
}
export interface Holiday {
  name: string; date: string;
  type: "federal" | "public" | "bank" | "observance";
}
export interface WorkingHoursResult {
  country: string; year: number; hoursPerDay: number;
  workingDays: number; totalHours: number; holidays: number;
}
export interface MeetingSlot {
  utcHour: number;
  perCity: Array<{ city: string; tz: string; localTime: string; utcOffset: string }>;
  score: number;
}
export interface MeetingResult {
  cities: string[];
  workingHours: { start: number; end: number };
  duration: number;
  topSlots: MeetingSlot[];
}
export interface PairResult {
  from: TimeSnapshot & { city: string; code?: string };
  to: TimeSnapshot & { city: string; code?: string };
  differenceHours: number;
  bestTimeToCall: { fromLocal: string; toLocal: string };
}

export interface TimeNowParams { tz?: string; city?: string; }
export interface TimeConvertParams {
  from: string; to: string; time?: string; date?: string;
}
export interface DateDiffParams {
  from: string; to: string;
  mode?: "calendar" | "business"; country?: string;
}
export interface DateAddParams {
  date: string;
  years?: number; months?: number; weeks?: number; days?: number;
  business?: boolean; country?: string;
}
export interface UnixParams {
  value: string | number;
  direction?: "to_date" | "to_unix";
  unit?: "s" | "ms";
}
export interface IsoParams {
  date: string;
  format: "8601" | "rfc3339" | "rfc2822" | "week" | "ordinal" | "basic";
  tz?: string;
}
export interface WordsParams { date: string; lang?: "en" | "fr" | "zh" | "ja"; }
export interface MeetingBestParams {
  cities: string[];
  workingStart?: number; workingEnd?: number; duration?: number;
}

export class TimeAndDatePro {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private fetchImpl: typeof fetch;
  private extraHeaders: Record<string, string>;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    this.extraHeaders = config.headers ?? {};
    if (typeof this.fetchImpl !== "function") {
      throw new Error("No fetch implementation found. Node 18+ required, or pass `fetch` in config.");
    }
  }

  private async request<T>(endpoint: string, params: object = {}): Promise<T> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) qs.set(k, v.join(","));
      else qs.set(k, String(v));
    }
    const url = `${this.baseUrl}${endpoint}${qs.toString() ? `?${qs}` : ""}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "@timeanddatepro/sdk/0.1.0",
      ...this.extraHeaders,
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await this.fetchImpl(url, { headers, signal: controller.signal });
      const json = (await res.json()) as ApiResponse<T>;
      if (!json.success) {
        throw new ApiClientError(res.status, json.error.code, json.error.message);
      }
      return json.data;
    } catch (e: any) {
      if (e instanceof ApiClientError) throw e;
      if (e?.name === "AbortError") {
        throw new ApiClientError(408, "TIMEOUT", `Request to ${endpoint} timed out after ${this.timeout}ms.`);
      }
      throw new ApiClientError(0, "NETWORK", e?.message ?? "Network error");
    } finally {
      clearTimeout(timer);
    }
  }

  time = {
    now: (params: TimeNowParams): Promise<TimeSnapshot> =>
      this.request<TimeSnapshot>("/api/v1/time/now", params),
    convert: (params: TimeConvertParams): Promise<ConvertResult> =>
      this.request<ConvertResult>("/api/v1/time/convert", params),
    diff: (params: DateDiffParams): Promise<DiffResult> =>
      this.request<DiffResult>("/api/v1/time/diff", params),
    add: (params: DateAddParams): Promise<AddResult> =>
      this.request<AddResult>("/api/v1/time/add", params),
    unix: (params: UnixParams): Promise<UnixResult> =>
      this.request<UnixResult>("/api/v1/time/unix", params),
    iso: (params: IsoParams): Promise<IsoResult> =>
      this.request<IsoResult>("/api/v1/time/iso", params),
    words: (params: WordsParams): Promise<WordsResult> =>
      this.request<WordsResult>("/api/v1/time/words", params),
  };

  cities = {
    list: (): Promise<City[]> => this.request<City[]>("/api/v1/cities"),
    get: (slug: string): Promise<City & { currentTime: TimeSnapshot }> =>
      this.request(`/api/v1/cities/${encodeURIComponent(slug)}`),
  };

  countries = {
    list: (): Promise<Country[]> => this.request<Country[]>("/api/v1/countries"),
    get: (code: string): Promise<Country & { holidays: number; workingHours: number }> =>
      this.request(`/api/v1/countries/${encodeURIComponent(code)}`),
    holidays: (code: string, year?: number): Promise<{ country: string; year: number; holidays: Holiday[] }> =>
      this.request(`/api/v1/countries/${encodeURIComponent(code)}/holidays`, year ? { year } : {}),
    workingHours: (code: string, params: { year?: number; hoursPerDay?: number } = {}): Promise<WorkingHoursResult> =>
      this.request(`/api/v1/countries/${encodeURIComponent(code)}/working-hours`, params),
  };

  pairs = {
    get: (from: string, to: string): Promise<PairResult> =>
      this.request(`/api/v1/pairs/${encodeURIComponent(from)}/${encodeURIComponent(to)}`),
  };

  meeting = {
    best: (params: MeetingBestParams): Promise<MeetingResult> =>
      this.request<MeetingResult>("/api/v1/meeting/best", {
        cities: params.cities,
        start: params.workingStart,
        end: params.workingEnd,
        duration: params.duration,
      }),
  };
}

export default TimeAndDatePro;
