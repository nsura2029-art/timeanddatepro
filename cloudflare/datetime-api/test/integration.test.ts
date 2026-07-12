// test/integration.test.ts
// Integration tests for the HTTP endpoints. Uses Hono's app.fetch()
// directly so we test the full middleware + route stack.

import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/index";

let env: any;

beforeAll(() => {
  // Minimal env for Cloudflare bindings (none required in V1)
  env = {};
});

async function get(path: string, headers: Record<string, string> = {}) {
  const res = await app.request(path, { headers }, env);
  const json = await res.json() as any;
  return { res, json };
}

async function post(path: string, body: any, headers: Record<string, string> = {}) {
  const res = await app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }, env);
  const json = await res.json() as any;
  return { res, json };
}

describe("GET /", () => {
  it("returns API info", async () => {
    const { res, json } = await get("/");
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("TimeAndDatePro API");
    expect(json.data.version).toBeDefined();
    expect(json.data.health).toBe("/api/v1/health");
  });
});

describe("GET /api/v1", () => {
  it("lists all endpoints", async () => {
    const { res, json } = await get("/api/v1");
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.endpoints)).toBe(true);
    expect(json.data.endpoints.length).toBeGreaterThanOrEqual(30);
  });
});

describe("GET /api/v1/health", () => {
  it("returns ok", async () => {
    const { res, json } = await get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(json.data.status).toBe("ok");
  });
});

describe("GET /api/v1/cities", () => {
  it("lists all cities", async () => {
    const { res, json } = await get("/api/v1/cities");
    expect(res.status).toBe(200);
    expect(json.data.cities.length).toBeGreaterThan(50);
    expect(json.data.total).toBe(json.data.cities.length);
  });
  it("filters by country", async () => {
    const { res, json } = await get("/api/v1/cities?country=US");
    expect(res.status).toBe(200);
    expect(json.data.cities.every((c: any) => c.countryCode === "US")).toBe(true);
  });
  it("returns 404 for empty country result", async () => {
    const { res, json } = await get("/api/v1/cities?country=ZZ");
    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("country_not_found");
  });
  it("respects limit", async () => {
    const { res, json } = await get("/api/v1/cities?limit=5");
    expect(res.status).toBe(200);
    expect(json.data.cities.length).toBe(5);
    expect(json.data.limit).toBe(5);
  });
});

describe("GET /api/v1/cities/search", () => {
  it("finds London by exact prefix", async () => {
    const { res, json } = await get("/api/v1/cities/search?q=london&limit=5");
    expect(res.status).toBe(200);
    expect(json.data.cities[0].code).toBe("LON");
  });
  it("finds Bangalore via alias -> Bengaluru", async () => {
    const { res, json } = await get("/api/v1/cities/search?q=bangalore");
    expect(res.status).toBe(200);
    expect(json.data.cities[0].code).toBe("BLR");
  });
  it("excludes specified codes", async () => {
    const { res, json } = await get("/api/v1/cities/search?q=london&exclude=LON");
    expect(res.status).toBe(200);
    expect(json.data.cities.some((c: any) => c.code === "LON")).toBe(false);
  });
  it("rejects 1-char query", async () => {
    const { res, json } = await get("/api/v1/cities/search?q=a");
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("invalid_query");
  });
  it("rejects empty query", async () => {
    const { res, json } = await get("/api/v1/cities/search?q=");
    expect(res.status).toBe(400);
  });
  it("rejects missing query", async () => {
    const { res, json } = await get("/api/v1/cities/search");
    expect(res.status).toBe(400);
  });
  it("clamps limit to 1-50", async () => {
    const a = await get("/api/v1/cities/search?q=london&limit=100");
    expect(a.json.data.limit).toBe(50);
    const b = await get("/api/v1/cities/search?q=london&limit=0");
    expect(b.json.data.limit).toBe(1);
  });
});

describe("GET /api/v1/cities/live", () => {
  it("returns live times for multiple cities", async () => {
    const { res, json } = await get("/api/v1/cities/live?codes=WLC,LON,DXB");
    expect(res.status).toBe(200);
    expect(json.data.cities.length).toBe(3);
    expect(json.data.cities[0].code).toBe("WLC");
    expect(json.data.cities[0].iso).toBeDefined();
    expect(json.data.cities[0].abbreviation).toBeDefined();
  });
  it("returns per-city error for unknown codes", async () => {
    const { res, json } = await get("/api/v1/cities/live?codes=WLC,ZZZ");
    expect(res.status).toBe(200);
    expect(json.data.cities[1].error).toBe("city_not_found");
  });
  it("rejects missing codes", async () => {
    const { res, json } = await get("/api/v1/cities/live");
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("missing_codes");
  });
  it("rejects empty codes", async () => {
    const { res, json } = await get("/api/v1/cities/live?codes=");
    expect(res.status).toBe(400);
  });
  it("accepts a custom t=ISO", async () => {
    const { res, json } = await get("/api/v1/cities/live?codes=LON&t=2026-01-01T12:00:00Z");
    expect(res.status).toBe(200);
    expect(json.data.cities[0].iso).toBe("2026-01-01T12:00:00");
  });
  it("rejects invalid t=ISO", async () => {
    const { res, json } = await get("/api/v1/cities/live?codes=LON&t=not-a-date");
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("invalid_time");
  });
});

describe("GET /api/v1/cities/:slug", () => {
  it("finds by code (uppercase)", async () => {
    const { res, json } = await get("/api/v1/cities/lon");
    expect(res.status).toBe(200);
    expect(json.data.code).toBe("LON");
  });
  it("finds by code (lowercase)", async () => {
    const { res, json } = await get("/api/v1/cities/lon");
    expect(res.status).toBe(200);
  });
  it("finds by name slug", async () => {
    const { res, json } = await get("/api/v1/cities/london");
    expect(res.status).toBe(200);
  });
  it("returns 404 for unknown slug", async () => {
    const { res, json } = await get("/api/v1/cities/atlantis");
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("city_not_found");
  });
  it("rejects 1-char slug", async () => {
    const { res, json } = await get("/api/v1/cities/a");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/time/now", () => {
  it("returns current time in a tz", async () => {
    const { res, json } = await get("/api/v1/time/now?tz=America/New_York");
    expect(res.status).toBe(200);
    expect(json.data.timezone).toBe("America/New_York");
    expect(json.data.local.iso).toBeDefined();
  });
  it("defaults to UTC", async () => {
    const { res, json } = await get("/api/v1/time/now");
    expect(res.status).toBe(200);
    expect(json.data.timezone).toBe("UTC");
  });
  it("rejects invalid timezone", async () => {
    const { res, json } = await get("/api/v1/time/now?tz=Not/A/Zone");
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("invalid_timezone");
  });
});

describe("GET /api/v1/time/convert", () => {
  it("converts between timezones", async () => {
    const { res, json } = await get("/api/v1/time/convert?from=UTC&to=America/New_York&time=2026-01-01T12:00:00Z");
    expect(res.status).toBe(200);
    expect(json.data.from.timezone).toBe("UTC");
    expect(json.data.to.timezone).toBe("America/New_York");
    expect(json.data.delta_minutes).toBe(-300);
  });
  it("rejects invalid from-tz", async () => {
    const { res, json } = await get("/api/v1/time/convert?from=Not/A/Zone&to=UTC");
    expect(res.status).toBe(400);
  });
  it("rejects invalid to-tz", async () => {
    const { res, json } = await get("/api/v1/time/convert?from=UTC&to=Not/A/Zone");
    expect(res.status).toBe(400);
  });
  it("rejects invalid time", async () => {
    const { res, json } = await get("/api/v1/time/convert?from=UTC&to=UTC&time=not-a-date");
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("invalid_time");
  });
});

describe("GET /api/v1/time/diff", () => {
  it("computes calendar days", async () => {
    const { res, json } = await get("/api/v1/time/diff?from=2026-01-01&to=2026-01-31&mode=calendar");
    expect(res.status).toBe(200);
    expect(json.data.total_days).toBe(30);
  });
  it("computes business days", async () => {
    const { res, json } = await get("/api/v1/time/diff?from=2026-01-05&to=2026-01-09&mode=business");
    expect(res.status).toBe(200);
    expect(json.data.business_days).toBe(5);
  });
  it("rejects missing from", async () => {
    const { res, json } = await get("/api/v1/time/diff?to=2026-01-01");
    expect(res.status).toBe(400);
  });
  it("rejects missing to", async () => {
    const { res, json } = await get("/api/v1/time/diff?from=2026-01-01");
    expect(res.status).toBe(400);
  });
  it("rejects invalid mode", async () => {
    const { res, json } = await get("/api/v1/time/diff?from=2026-01-01&to=2026-01-02&mode=foo");
    expect(res.status).toBe(400);
  });
  it("handles negative direction", async () => {
    const { res, json } = await get("/api/v1/time/diff?from=2026-01-31&to=2026-01-01&mode=calendar");
    expect(res.status).toBe(200);
    expect(json.data.direction).toBe("backward");
    expect(json.data.total_days).toBe(30);
  });
});

describe("GET /api/v1/time/add", () => {
  it("adds 5 days", async () => {
    const { res, json } = await get("/api/v1/time/add?date=2026-01-01&days=5");
    expect(res.status).toBe(200);
    expect(json.data.result.iso).toContain("2026-01-06");
  });
  it("adds 1 month", async () => {
    const { res, json } = await get("/api/v1/time/add?date=2026-01-15&months=1");
    expect(res.status).toBe(200);
    expect(json.data.result.iso).toContain("2026-02-15");
  });
  it("business mode skips weekends", async () => {
    // Friday 2026-01-02 + 1 business day = Monday 2026-01-05
    const { res, json } = await get("/api/v1/time/add?date=2026-01-02&days=1&business=true");
    expect(res.status).toBe(200);
    expect(json.data.result.iso).toContain("2026-01-05");
  });
  it("rejects missing date", async () => {
    const { res, json } = await get("/api/v1/time/add");
    expect(res.status).toBe(400);
  });
  it("rejects invalid date", async () => {
    const { res, json } = await get("/api/v1/time/add?date=not-a-date");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/time/unix", () => {
  it("converts unix to date", async () => {
    const { res, json } = await get("/api/v1/time/unix?value=1735689600&direction=to_date");
    expect(res.status).toBe(200);
    expect(json.data.iso).toBe("2025-01-01T00:00:00.000Z");
  });
  it("converts date to unix", async () => {
    const { res, json } = await get("/api/v1/time/unix?value=2025-01-01T00:00:00Z&direction=to_unix");
    expect(res.status).toBe(200);
    expect(json.data.unix).toBe(1735689600);
  });
  it("rejects non-numeric value", async () => {
    const { res, json } = await get("/api/v1/time/unix?value=foo");
    expect(res.status).toBe(400);
  });
  it("rejects invalid direction", async () => {
    const { res, json } = await get("/api/v1/time/unix?value=0&direction=foo");
    expect(res.status).toBe(400);
  });
  it("rejects invalid unit", async () => {
    const { res, json } = await get("/api/v1/time/unix?value=0&unit=foo");
    expect(res.status).toBe(400);
  });
  it("rejects out-of-range unix", async () => {
    const { res, json } = await get("/api/v1/time/unix?value=99999999999999");
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("out_of_range");
  });
});

describe("GET /api/v1/time/iso", () => {
  it("formats as date", async () => {
    const { res, json } = await get("/api/v1/time/iso?date=2026-01-01T12:00:00Z&format=date&tz=UTC");
    expect(res.status).toBe(200);
    expect(json.data.output).toBe("2026-01-01");
  });
  it("formats as unix", async () => {
    const { res, json } = await get("/api/v1/time/iso?date=2026-01-01T00:00:00Z&format=unix");
    expect(res.status).toBe(200);
    expect(json.data.output).toBe("1767225600");
  });
  it("rejects invalid format", async () => {
    const { res, json } = await get("/api/v1/time/iso?date=2026-01-01T12:00:00Z&format=foo");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/time/words", () => {
  it("returns human-readable words in English", async () => {
    const { res, json } = await get("/api/v1/time/words?date=2026-01-01");
    expect(res.status).toBe(200);
    expect(json.data.words.toLowerCase()).toContain("january");
  });
  it("rejects invalid language", async () => {
    const { res, json } = await get("/api/v1/time/words?date=2026-01-01&lang=zz");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/time/sun", () => {
  it("returns sunrise/sunset for NYC", async () => {
    const { res, json } = await get("/api/v1/time/sun?lat=40.7128&lon=-74.0060&date=2026-06-21");
    expect(res.status).toBe(200);
    expect(json.data.sunrise_utc).toBeDefined();
    expect(json.data.sunset_utc).toBeDefined();
  });
  it("rejects invalid lat", async () => {
    const { res, json } = await get("/api/v1/time/sun?lat=99&lon=0");
    expect(res.status).toBe(400);
  });
  it("rejects invalid lon", async () => {
    const { res, json } = await get("/api/v1/time/sun?lat=0&lon=200");
    expect(res.status).toBe(400);
  });
  it("rejects non-numeric coords", async () => {
    const { res, json } = await get("/api/v1/time/sun?lat=foo&lon=bar");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/countries", () => {
  it("lists countries", async () => {
    const { res, json } = await get("/api/v1/countries");
    expect(res.status).toBe(200);
    expect(json.data.countries.length).toBeGreaterThan(0);
  });
  it("filters by region", async () => {
    const { res, json } = await get("/api/v1/countries?region=Europe");
    expect(res.status).toBe(200);
    expect(json.data.countries.every((co: any) => co.region === "Europe")).toBe(true);
  });
  it("returns 404 for empty region", async () => {
    const { res, json } = await get("/api/v1/countries?region=Atlantis");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/countries/:code", () => {
  it("finds US", async () => {
    const { res, json } = await get("/api/v1/countries/US");
    expect(res.status).toBe(200);
    expect(json.data.name).toBe("United States");
  });
  it("finds with lowercase", async () => {
    const { res, json } = await get("/api/v1/countries/us");
    expect(res.status).toBe(200);
  });
  it("returns 404 for unknown", async () => {
    const { res, json } = await get("/api/v1/countries/ZZ");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/pairs/:from/:to", () => {
  it("computes a pair", async () => {
    const { res, json } = await get("/api/v1/pairs/LON/NYC");
    expect(res.status).toBe(200);
    expect(json.data.from.code).toBe("LON");
    expect(json.data.to.code).toBe("NYC");
  });
  it("returns 404 for unknown from", async () => {
    const { res, json } = await get("/api/v1/pairs/ZZZ/LON");
    expect(res.status).toBe(404);
  });
  it("returns 404 for unknown to", async () => {
    const { res, json } = await get("/api/v1/pairs/LON/ZZZ");
    expect(res.status).toBe(404);
  });
  it("rejects same city pair", async () => {
    const { res, json } = await get("/api/v1/pairs/LON/LON");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/meeting/best", () => {
  it("rejects single city", async () => {
    const { res, json } = await get("/api/v1/meeting/best?codes=LON");
    expect(res.status).toBe(400);
  });
  it("rejects invalid codes", async () => {
    const { res, json } = await get("/api/v1/meeting/best?codes=LON,ZZZ");
    expect(res.status).toBe(404);
  });
  it("rejects bad duration", async () => {
    const { res, json } = await get("/api/v1/meeting/best?codes=LON,NYC&duration=99999");
    expect(res.status).toBe(400);
  });
});

describe("404 handler", () => {
  it("returns a stable shape for unknown routes", async () => {
    const { res, json } = await get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("not_found");
  });
});

describe("CORS", () => {
  it("sets CORS headers for allowed origins", async () => {
    const res = await app.request("/api/v1/health", {
      headers: { "Origin": "https://dateandtime.live" },
    }, env);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://dateandtime.live");
    expect(res.headers.get("Vary")).toBe("Origin");
  });
  it("handles preflight OPTIONS", async () => {
    const res = await app.request("/api/v1/health", {
      method: "OPTIONS",
      headers: {
        "Origin": "https://dateandtime.live",
        "Access-Control-Request-Method": "GET",
      },
    }, env);
    expect(res.status).toBe(204);
  });
  it("handles preflight for pages.dev", async () => {
    const res = await app.request("/api/v1/health", {
      method: "OPTIONS",
      headers: {
        "Origin": "https://anything.pages.dev",
        "Access-Control-Request-Method": "GET",
      },
    }, env);
    expect(res.status).toBe(204);
  });
});

describe("POST /api/v1/feedback", () => {
  it("creates a feedback entry", async () => {
    const { res, json } = await post("/api/v1/feedback", { text: "Love the new search!" });
    expect(res.status).toBe(200);
    expect(json.data.id).toBeDefined();
    expect(json.data.text).toBe("Love the new search!");
  });
  it("rejects empty text", async () => {
    const { res, json } = await post("/api/v1/feedback", { text: "" });
    expect(res.status).toBe(400);
  });
  it("rejects missing text", async () => {
    const { res, json } = await post("/api/v1/feedback", {});
    expect(res.status).toBe(400);
  });
  it("rejects text > 5000 chars", async () => {
    const { res, json } = await post("/api/v1/feedback", { text: "x".repeat(5001) });
    expect(res.status).toBe(400);
  });
  it("rejects invalid JSON", async () => {
    const res = await app.request("/api/v1/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    }, env);
    expect(res.status).toBe(400);
    const json = await res.json() as any;
    expect(json.error.code).toBe("invalid_body");
  });
});
