// src/lib/responses.ts
// Response helpers with strict edge-case handling.
// All API responses follow the envelope: { success, data?, error? }

export const API_VERSION = "1.0.0";

/** Successful response with typed data. */
export function ok<T>(c: any, data: T, path?: string) {
  return c.json({
    success: true,
    data,
    meta: path ? { path, version: API_VERSION, ts: Date.now() } : undefined,
  });
}

/** Error response with HTTP status code. */
export function err(c: any, status: number, message: string, code?: string) {
  return c.json(
    {
      success: false,
      error: { message, code: code ?? defaultCode(status), status },
    },
    status
  );
}

function defaultCode(status: number): string {
  switch (status) {
    case 400: return "bad_request";
    case 401: return "unauthorized";
    case 403: return "forbidden";
    case 404: return "not_found";
    case 405: return "method_not_allowed";
    case 408: return "timeout";
    case 422: return "unprocessable_entity";
    case 429: return "rate_limited";
    case 500: return "internal_error";
    case 502: return "bad_gateway";
    case 503: return "service_unavailable";
    case 504: return "gateway_timeout";
    default: return status >= 500 ? "server_error" : "client_error";
  }
}

/** Validate that a query param is a non-empty string. */
export function requireString(value: unknown, name: string): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return `${name} is required and must be a non-empty string`;
  }
  return null;
}

/** Validate that a query param is a positive integer. */
export function requireInt(
  value: unknown,
  name: string,
  opts: { min?: number; max?: number; default?: number } = {}
): { value: number; error: string | null } {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, default: def } = opts;
  if (value === undefined || value === null || value === "") {
    if (def !== undefined) return { value: def, error: null };
    return { value: 0, error: `${name} is required` };
  }
  const n = typeof value === "string" ? parseInt(value, 10) : (value as number);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { value: 0, error: `${name} must be an integer` };
  }
  if (n < min) return { value: 0, error: `${name} must be >= ${min}` };
  if (n > max) return { value: 0, error: `${name} must be <= ${max}` };
  return { value: n, error: null };
}

/** Parse a CSV query param into a deduped, trimmed, capped array. */
export function parseCsv(
  value: string | undefined,
  opts: { maxItems?: number; uppercase?: boolean } = {}
): string[] {
  if (!value) return [];
  const { maxItems = 100, uppercase = false } = opts;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value.split(",")) {
    const v = (uppercase ? raw.trim().toUpperCase() : raw.trim());
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
      if (out.length >= maxItems) break;
    }
  }
  return out;
}

/** Validate IANA timezone. Returns null if valid, error string if not. */
export function validateTimezone(tz: string): string | null {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return null;
  } catch {
    return `Invalid IANA timezone: ${tz}`;
  }
}

/** Safe Date parse. Returns Date or null. */
export function safeDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
