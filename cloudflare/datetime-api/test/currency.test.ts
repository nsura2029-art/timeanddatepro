// test/currency.test.ts
// Vitest tests for the Currency API endpoints.
// Run with: npm test
//
// Tests are written against the live dev Worker. For local dev, point
// BASE_URL at http://localhost:8787 (wrangler dev default).

import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.CURRENCY_API_BASE
  || "https://datetime-api-dev.nsura2029.workers.dev";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; status: number };
}

async function get<T = any>(path: string): Promise<ApiResponse<T>> {
  const r = await fetch(`${BASE_URL}${path}`);
  return r.json();
}

async function post<T = any>(path: string, body: any): Promise<ApiResponse<T>> {
  const r = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

describe("/api/v1/currency/codes", () => {
  it("returns active currency list", async () => {
    const r = await get("/api/v1/currency/codes");
    expect(r.success).toBe(true);
    expect(r.data!.count).toBeGreaterThan(30);
    expect(r.data!.codes).toBeInstanceOf(Array);
    const usd = r.data!.codes.find((c: any) => c.code === "USD");
    expect(usd).toBeDefined();
    expect(usd.name).toBe("US Dollar");
    expect(usd.symbol).toBe("$");
  });
});

describe("/api/v1/currency/rates", () => {
  it("returns rates for USD base", async () => {
    const r = await get("/api/v1/currency/rates?base=USD");
    expect(r.success).toBe(true);
    expect(r.data!.base).toBe("USD");
    expect(r.data!.rates).toBeInstanceOf(Object);
    expect(r.data!.rates.EUR).toBeGreaterThan(0);
    expect(r.data!.rates.EUR).toBeLessThan(2);
  });

  it("defaults to USD when base omitted", async () => {
    const r = await get("/api/v1/currency/rates");
    expect(r.success).toBe(true);
    expect(r.data!.base).toBe("USD");
  });

  it("rejects invalid base code", async () => {
    const r = await get("/api/v1/currency/rates?base=XX");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_base");
  });

  it("rejects lowercase 3-letter codes that aren't valid", async () => {
    const r = await get("/api/v1/currency/rates?base=abc");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_base");
  });

  it("rejects non-3-letter base", async () => {
    const r = await get("/api/v1/currency/rates?base=USDD");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_base");
  });
});

describe("/api/v1/currency/convert", () => {
  it("converts USD to EUR", async () => {
    const r = await get("/api/v1/currency/convert?from=USD&to=EUR&amount=100");
    expect(r.success).toBe(true);
    expect(r.data!.result).toBeGreaterThan(80);
    expect(r.data!.result).toBeLessThan(95);
    expect(r.data!.rate).toBeGreaterThan(0.8);
  });

  it("returns identity for same currency", async () => {
    const r = await get("/api/v1/currency/convert?from=USD&to=USD&amount=100");
    expect(r.success).toBe(true);
    expect(r.data!.result).toBe(100);
    expect(r.data!.rate).toBe(1);
    expect(r.data!.source).toBe("identity");
  });

  it("rejects negative amount", async () => {
    const r = await get("/api/v1/currency/convert?from=USD&to=EUR&amount=-5");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_amount");
  });

  it("rejects missing amount", async () => {
    const r = await get("/api/v1/currency/convert?from=USD&to=EUR");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("missing_amount");
  });

  it("rejects non-numeric amount", async () => {
    const r = await get("/api/v1/currency/convert?from=USD&to=EUR&amount=abc");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_amount");
  });

  it("rejects missing from", async () => {
    const r = await get("/api/v1/currency/convert?to=EUR&amount=100");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("missing_from");
  });

  it("rejects missing to", async () => {
    const r = await get("/api/v1/currency/convert?from=USD&amount=100");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("missing_to");
  });

  it("rejects unknown currency", async () => {
    const r = await get("/api/v1/currency/convert?from=ZZZ&to=EUR&amount=100");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_from");
  });
});

describe("/api/v1/currency/pair", () => {
  it("returns rate + change + chart", async () => {
    const r = await get("/api/v1/currency/pair?from=USD&to=EUR");
    expect(r.success).toBe(true);
    expect(r.data!.rate).toBeGreaterThan(0.8);
    expect(r.data!.change).toBeDefined();
    expect(r.data!.change["24h"]).toBeDefined();
    expect(r.data!.change["24hPct"]).toBeDefined();
  });

  it("returns identity for same currency", async () => {
    const r = await get("/api/v1/currency/pair?from=USD&to=USD");
    expect(r.success).toBe(true);
    expect(r.data!.rate).toBe(1);
    expect(r.data!.source).toBe("identity");
  });

  it("rejects invalid codes", async () => {
    const r = await get("/api/v1/currency/pair?from=XX&to=YY");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_codes");
  });
});

describe("/api/v1/currency/timeseries", () => {
  it("returns historical series", async () => {
    const r = await get("/api/v1/currency/timeseries?from=USD&to=EUR&start=2026-06-12&end=2026-07-10");
    expect(r.success).toBe(true);
    expect(r.data!.count).toBeGreaterThan(0);
    expect(r.data!.series[0].date).toBe("2026-06-12");
  });

  it("rejects start after end", async () => {
    const r = await get("/api/v1/currency/timeseries?from=USD&to=EUR&start=2026-12-01&end=2026-01-01");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("start_after_end");
  });

  it("rejects invalid date format", async () => {
    const r = await get("/api/v1/currency/timeseries?from=USD&to=EUR&start=2026/06/12&end=2026/07/10");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_date_format");
  });

  it("rejects range > 5 years", async () => {
    const r = await get("/api/v1/currency/timeseries?from=USD&to=EUR&start=2010-01-01&end=2026-01-01");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("range_too_large");
  });
});

describe("/api/v1/currency/bulk", () => {
  it("converts multiple items", async () => {
    const r = await post("/api/v1/currency/bulk", {
      items: [
        { amount: 100, from: "USD", to: "EUR" },
        { amount: 50, from: "EUR", to: "USD" },
      ],
    });
    expect(r.success).toBe(true);
    expect(r.data!.count).toBe(2);
    expect(r.data!.results[0].result).toBeGreaterThan(0);
  });

  it("rejects empty items", async () => {
    const r = await post("/api/v1/currency/bulk", { items: [] });
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("empty_items");
  });

  it("rejects too many items", async () => {
    const items = Array.from({ length: 101 }, () => ({ amount: 1, from: "USD", to: "EUR" }));
    const r = await post("/api/v1/currency/bulk", { items });
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("too_many_items");
  });

  it("rejects invalid JSON", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/currency/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const r = await res.json();
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_json");
  });

  it("handles partial failures gracefully", async () => {
    const r = await post("/api/v1/currency/bulk", {
      items: [
        { amount: 100, from: "USD", to: "EUR" },
        { amount: 100, from: "ZZZ", to: "EUR" },
      ],
    });
    expect(r.success).toBe(true);
    expect(r.data!.results[0].error).toBeNull();
    expect(r.data!.results[1].error).toBe("invalid_codes");
  });
});

describe("/api/v1/crypto", () => {
  it("rejects missing ids", async () => {
    const r = await get("/api/v1/crypto/prices");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("missing_ids");
  });

  it("rejects all-unknown ids", async () => {
    const r = await get("/api/v1/crypto/prices?ids=fakecoin,anotherfake");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("all_unknown");
  });

  it("rejects too many ids", async () => {
    const ids = Array.from({ length: 51 }, () => "bitcoin").join(",");
    const r = await get(`/api/v1/crypto/prices?ids=${ids}`);
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("too_many_ids");
  });

  it("rejects invalid amount on convert", async () => {
    const r = await get("/api/v1/crypto/convert?from=BTC&to=USD&amount=-1");
    expect(r.success).toBe(false);
    expect(r.error?.code).toBe("invalid_amount");
  });
});

describe("/api/v1/status", () => {
  it("returns all source statuses", async () => {
    const r = await get("/api/v1/status");
    expect(r.success).toBe(true);
    expect(r.data!.sources).toBeDefined();
    expect(r.data!.sources.frankfurter).toBeDefined();
    expect(r.data!.sources.allratestoday).toBeDefined();
    expect(r.data!.sources.coingecko).toBeDefined();
  });
});
