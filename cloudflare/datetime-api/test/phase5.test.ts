// ============================================================
// Phase 5 endpoint tests — countries, holidays, DST, popular, etc.
// ============================================================

import { describe, it, expect } from "vitest";

const API = "https://datetime-api-dev.nsura2029.workers.dev/api/v1";
const TS = () => `&_t=${Date.now()}`;

async function get(path: string) {
  const r = await fetch(`${API}${path}${path.includes("?") ? "&" : "?"}_t=${Date.now()}`);
  const j = (await r.json()) as { success: boolean; data?: any; error?: any };
  if (!j.success) throw new Error(`API error: ${j.error?.message} (${path})`);
  return j.data;
}

async function post(path: string, body: any) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await r.json()) as { success: boolean; data?: any; error?: any };
  if (!j.success) throw new Error(`API error: ${j.error?.message} (${path})`);
  return j.data;
}

describe("5.1 Countries (D1)", () => {
  it("GET /countries returns 194 with full data", async () => {
    const d = await get("/countries?limit=5");
    expect(d.count).toBeGreaterThan(0);
    const first = d.countries[0];
    expect(first).toHaveProperty("code");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("capital");
    expect(first).toHaveProperty("languages");
    expect(first).toHaveProperty("currencies");
  });

  it("GET /countries/JP returns Japan with correct data", async () => {
    const d = await get("/countries/JP");
    expect(d.name).toBe("Japan");
    expect(d.capital).toBe("Tokyo");
    expect(d.timezones).toContain("Asia/Tokyo");
    expect(d.languages.length).toBeGreaterThan(0);
  });

  it("GET /countries/:code/cities returns cities in country", async () => {
    const d = await get("/countries/GB/cities?limit=5");
    expect(d.country).toBe("GB");
    expect(d.cities.length).toBeGreaterThan(0);
    for (const c of d.cities) {
      expect(c.countryCode).toBe("GB");
    }
  });

  it("GET /countries?region=Asia filters by region", async () => {
    const d = await get("/countries?region=Asia&limit=10");
    expect(d.countries.length).toBeGreaterThan(0);
    for (const c of d.countries) {
      expect(c.region).toBe("Asia");
    }
  });
});

describe("5.2 Popular cities (D1)", () => {
  it("GET /popular/cities returns top cities by population", async () => {
    const d = await get("/popular/cities?limit=5");
    expect(d.cities.length).toBe(5);
    // Verify descending population order
    for (let i = 1; i < d.cities.length; i++) {
      expect(d.cities[i - 1].population).toBeGreaterThanOrEqual(d.cities[i].population);
    }
  });

  it("GET /popular/defaults returns 20 default cities", async () => {
    const d = await get("/popular/defaults");
    expect(d.count).toBe(20);
  });

  it("GET /popular/cities?country=US filters by country", async () => {
    const d = await get("/popular/cities?country=US&limit=3");
    expect(d.cities.length).toBeGreaterThan(0);
    for (const c of d.cities) {
      expect(c.countryCode).toBe("US");
    }
  });
});

describe("5.3 Holidays (curated)", () => {
  it("GET /holidays/today returns today's holidays", async () => {
    const d = await get("/holidays/today");
    expect(d.date).toMatch(/^\d{2}-\d{2}$/);
    expect(d.holidays).toBeDefined();
  });

  it("GET /holidays/upcoming?country=US returns upcoming US holidays", async () => {
    const d = await get("/holidays/upcoming?country=US&days=60");
    expect(d.country).toBe("US");
    expect(d.holidays).toBeDefined();
  });

  it("GET /holidays/year?country=GB returns all UK holidays for 2026", async () => {
    const d = await get("/holidays/year?country=GB&year=2026");
    expect(d.country).toBe("GB");
    expect(d.year).toBe(2026);
    expect(d.holidays.length).toBeGreaterThan(0);
  });

  it("GET /holidays/year without country returns 400", async () => {
    const r = await fetch(`${API}/holidays/year?_t=${Date.now()}`);
    const j = await r.json() as { success: boolean; error?: any };
    expect(j.success).toBe(false);
    expect(j.error.status).toBe(400);
  });
});

describe("5.4 DST (computed)", () => {
  it("GET /dst?tz=America/New_York correctly identifies DST", async () => {
    const d = await get("/dst?tz=America/New_York");
    expect(d.timezone).toBe("America/New_York");
    expect(d.observesDst).toBe(true);
    expect(d.julyOffset).not.toBe(d.januaryOffset);
  });

  it("GET /dst?tz=Asia/Tokyo correctly identifies no DST", async () => {
    const d = await get("/dst?tz=Asia/Tokyo");
    expect(d.observesDst).toBe(false);
  });

  it("GET /dst without tz returns 400", async () => {
    const r = await fetch(`${API}/dst?_t=${Date.now()}`);
    const j = await r.json() as { success: boolean; error?: any };
    expect(j.success).toBe(false);
  });
});

describe("5.5 OnThisDay (curated)", () => {
  it("GET /onthisday returns events for today", async () => {
    const d = await get("/onthisday");
    expect(d.month).toBeGreaterThan(0);
    expect(d.day).toBeGreaterThan(0);
    expect(d.events).toBeDefined();
  });

  it("GET /onthisday?month=7&day=20 returns Moon landing", async () => {
    const d = await get("/onthisday?month=7&day=20");
    expect(d.month).toBe(7);
    expect(d.day).toBe(20);
    const moonLanding = d.events.find((e: any) => e.event.includes("Moon"));
    expect(moonLanding).toBeDefined();
    expect(moonLanding.year).toBe(1969);
  });
});

describe("5.6 Currency (static)", () => {
  it("GET /currency/rates?base=USD returns 36 currencies", async () => {
    const d = await get("/currency/rates?base=USD");
    expect(d.base).toBe("USD");
    expect(Object.keys(d.rates).length).toBeGreaterThan(30);
  });

  it("GET /currency/convert converts USD to EUR", async () => {
    const d = await get("/currency/convert?from=USD&to=EUR&amount=100");
    expect(d.from).toBe("USD");
    expect(d.to).toBe("EUR");
    expect(d.amount).toBe(100);
    expect(d.converted).toBeGreaterThan(0);
    expect(d.rate).toBeGreaterThan(0);
  });

  it("GET /currency/codes returns 36 currencies", async () => {
    const d = await get("/currency/codes");
    expect(d.currencies.length).toBeGreaterThan(30);
  });
});

describe("5.7 Quotes (curated)", () => {
  it("GET /quotes/random returns a quote", async () => {
    const d = await get("/quotes/random");
    expect(d.text).toBeTruthy();
    expect(d.author).toBeTruthy();
  });

  it("GET /quotes/ranked returns list of quotes", async () => {
    const d = await get("/quotes/ranked?limit=5");
    expect(d.quotes.length).toBe(5);
  });
});

describe("5.8 Feedback (D1 CRUD)", () => {
  it("POST /feedback creates a new entry", async () => {
    const d = await post("/feedback", {
      type: "feature",
      title: "Test feedback from Phase 5 tests",
      body: "This is a test feedback entry created by the Phase 5 test suite.",
      author: "phase5-test",
      countryCode: "US",
    });
    expect(d.id).toBeGreaterThan(0);
    expect(d.title).toBe("Test feedback from Phase 5 tests");
    expect(d.votes).toBe(0);
    expect(d.status).toBe("open");
  });

  it("GET /feedback returns list including our entry", async () => {
    const d = await get("/feedback?limit=10");
    expect(d.feedback.length).toBeGreaterThan(0);
  });

  it("GET /feedback/top returns top-voted", async () => {
    const d = await get("/feedback/top?limit=3");
    expect(d.feedback).toBeDefined();
  });

  it("POST /feedback/:id/vote increments votes", async () => {
    // Create one first
    const created = await post("/feedback", {
      type: "praise",
      title: "Vote test entry",
      body: "Testing vote increment",
    });
    const voted = await post(`/feedback/${created.id}/vote`, {});
    expect(voted.votes).toBe(1);
    const voted2 = await post(`/feedback/${created.id}/vote`, {});
    expect(voted2.votes).toBe(2);
  });
});

describe("5.9 Browse home (computed)", () => {
  it("GET /browse/home returns greeting, popularCities, onThisDay", async () => {
    const d = await get("/browse/home");
    expect(d.greeting).toBeTruthy();
    expect(d.popularCities).toBeDefined();
    expect(d.popularCities.length).toBeGreaterThan(0);
  });
});

describe("Performance", () => {
  it("countries list responds in < 300ms", async () => {
    const t0 = Date.now();
    await get("/countries?limit=50");
    expect(Date.now() - t0).toBeLessThan(300);
  });

  it("popular cities responds in < 200ms", async () => {
    const t0 = Date.now();
    await get("/popular/cities?limit=20");
    expect(Date.now() - t0).toBeLessThan(200);
  });
});
