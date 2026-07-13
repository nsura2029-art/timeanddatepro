// src/lib/api/captures.ts
// Thin client for the Phase 6 capture endpoints (waitlist + captures).
// Mirrors the routes/cloudflare/datetime-api/src/routes/{waitlist,captures,dateToWord}.ts
//
// All functions are fire-and-best-effort:
//  - POST functions return `{ ok, data, error }` — caller decides what to do
//  - GET functions return `{ ok, data, error }` — caller handles loading/error states
//  - All endpoints fall back to localStorage if the network is offline
//  - Failures are non-fatal (the user already saw the success state)
//
// API base is injected via VITE_API_BASE (Vite env var). In dev it points
// to the local Node server; in prod it points to the Cloudflare Worker.

// safeStorage helpers inlined at the top so we don't pull in a new module
function safeGetJSON<T>(key: string): T | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function safeSetJSON<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota exceeded — non-fatal
  }
}
function safeRemove(key: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(key);
  } catch {
    // non-fatal
  }
}

export type WaitlistEntry = {
  id?: number;
  email: string;
  locale: string;
  language?: string;
  tool?: string;
  format?: string;
  date?: string;
  source?: string;
  duplicate?: boolean;
};

export type CaptureEntry = {
  id?: number;
  type: "feedback" | "bulk_convert" | "translate" | "suggestion" | "praise" | "bug" | "interest" | "waitlist";
  payload?: unknown;
  page?: string;
  tool?: string;
  email?: string;
  countryCode?: string;
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

function apiBase(): string {
  // Vite injects import.meta.env.VITE_API_BASE at build time
  // Fallback to dev Worker for safety
  // The double cast keeps tsc happy when this file is type-checked
  // outside Vite (e.g. in isolation or in some test runners).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = ((import.meta as any)?.env ?? {}) as { VITE_API_BASE?: string };
  return env.VITE_API_BASE || "https://dev.api.dateandtime.live";
}

async function postJSON<T>(path: string, body: unknown, timeoutMs = 6000): Promise<ApiResult<T>> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${apiBase()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, error: `HTTP ${r.status}: ${text.slice(0, 200)}` };
    }
    const json = await r.json();
    // API shape: { success: true, data: T } or { success: false, error: {...} }
    if (json?.success) return { ok: true, data: json.data as T };
    return { ok: false, error: json?.error?.message || "unknown" };
  } catch (e: any) {
    clearTimeout(t);
    return { ok: false, error: e?.message || "network_error" };
  }
}

async function getJSON<T>(path: string, timeoutMs = 6000): Promise<ApiResult<T>> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${apiBase()}${path}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, error: `HTTP ${r.status}: ${text.slice(0, 200)}` };
    }
    const json = await r.json();
    if (json?.success) return { ok: true, data: json.data as T };
    return { ok: false, error: json?.error?.message || "unknown" };
  } catch (e: any) {
    clearTimeout(t);
    return { ok: false, error: e?.message || "network_error" };
  }
}

// ── Waitlist ───────────────────────────────────────────────

const WAITLIST_LOCAL_KEY = "tdp_translate_waitlist_v2"; // v2 = API-backed, fallback to localStorage
const WAITLIST_LOCAL_KEY_LEGACY = "tdp_translate_waitlist";

export async function postWaitlist(entry: Omit<WaitlistEntry, "id" | "duplicate">): Promise<ApiResult<WaitlistEntry>> {
  const result = await postJSON<WaitlistEntry>("/api/v1/waitlist", entry);
  if (result.ok) {
    // Successful API call — clear the legacy localStorage key
    safeRemove(WAITLIST_LOCAL_KEY_LEGACY);
  } else {
    // API failed — fall back to localStorage (offline queue)
    const existing = safeGetJSON<WaitlistEntry[]>(WAITLIST_LOCAL_KEY) || [];
    existing.push(entry);
    safeSetJSON(WAITLIST_LOCAL_KEY, existing);
  }
  return result;
}

export async function getWaitlistCount(opts?: { tool?: string; locale?: string }): Promise<ApiResult<{ total: number; tool: string | null; locale: string | null }>> {
  const qs = new URLSearchParams();
  if (opts?.tool) qs.set("tool", opts.tool);
  if (opts?.locale) qs.set("locale", opts.locale);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return getJSON(`/api/v1/waitlist/count${suffix}`);
}

// ── Captures ───────────────────────────────────────────────

const CAPTURES_LOCAL_KEY = "tdp_captures_v2";
const CAPTURES_LOCAL_KEY_LEGACY = "tdp_feedback";

export async function postCapture(entry: Omit<CaptureEntry, "id">): Promise<ApiResult<CaptureEntry>> {
  const result = await postJSON<CaptureEntry>("/api/v1/captures", entry);
  if (result.ok) {
    safeRemove(CAPTURES_LOCAL_KEY_LEGACY);
  } else {
    const existing = safeGetJSON<CaptureEntry[]>(CAPTURES_LOCAL_KEY) || [];
    existing.push(entry);
    safeSetJSON(CAPTURES_LOCAL_KEY, existing);
  }
  return result;
}

export async function getCaptureStats(): Promise<ApiResult<{ total: number; byType: Record<string, number> }>> {
  return getJSON("/api/v1/captures/stats");
}

// ── Date to Words bulk + translate ─────────────────────────

export type BulkConvertRequest = {
  dates: string[];
  format?: "formal" | "legal" | "banking" | "casual" | "british";
};

export type BulkConvertResult = {
  date: string;
  words: string;
  format: string;
  error?: string;
};

export type BulkConvertResponse = {
  count: number;
  successCount: number;
  format: string;
  results: BulkConvertResult[];
};

export async function postBulkConvert(req: BulkConvertRequest): Promise<ApiResult<BulkConvertResponse>> {
  return postJSON<BulkConvertResponse>("/api/v1/tools/date-to-word/bulk", req);
}

export type TranslateInterest = {
  status: "not_available" | "available";
  available: string[];
  requested: { date: string; format: string; lang: string };
  english: string;
  message: string;
  joinWaitlist: string;
};

export async function getTranslateInterest(date: string, format: string, lang: string): Promise<ApiResult<TranslateInterest>> {
  const qs = new URLSearchParams({ date, format, lang });
  return getJSON(`/api/v1/tools/date-to-word/translate?${qs.toString()}`);
}
