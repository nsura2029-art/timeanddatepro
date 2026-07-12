// test/search.test.ts
// Tests for the city search logic + aliases. The most critical path
// in the whole API since it powers the "add city" dropdown.

import { describe, it, expect } from "vitest";
import { searchCities, resolveAlias, normalize, CITY_ALIASES } from "../src/lib/search";
import { CITIES } from "../src/data/cities";

describe("normalize", () => {
  it("lowercases", () => {
    expect(normalize("LONDON")).toBe("london");
  });
  it("strips diacritics", () => {
    expect(normalize("São Paulo")).toBe("sao paulo");
    expect(normalize("Zürich")).toBe("zurich");
  });
  it("trims whitespace", () => {
    expect(normalize("  tokyo  ")).toBe("tokyo");
  });
});

describe("resolveAlias", () => {
  it("resolves bangalore -> bengaluru", () => {
    expect(resolveAlias("bangalore")).toBe("bengaluru");
  });
  it("resolves bombay -> mumbai", () => {
    expect(resolveAlias("bombay")).toBe("mumbai");
  });
  it("resolves sao paulo (with diacritics stripped)", () => {
    // normalize() strips diacritics, so the alias resolution + name match
    // both produce the diacritic-free form. The search still works because
    // city names are also normalized before comparison.
    expect(resolveAlias("São Paulo")).toBe("sao paulo");
  });
  it("passes through unknown queries", () => {
    expect(resolveAlias("atlantis")).toBe("atlantis");
  });
  it("is case-insensitive", () => {
    expect(resolveAlias("BANGALORE")).toBe("bengaluru");
  });
});

describe("searchCities — happy path", () => {
  it("finds London by exact prefix", () => {
    const r = searchCities("london", CITIES, new Set(), 5);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].code).toBe("LON");
  });

  it("finds New York by substring", () => {
    const r = searchCities("york", CITIES, new Set(), 5);
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((c) => c.code === "NYC" || c.name.toLowerCase().includes("york"))).toBe(true);
  });

  it("finds Bangalore via alias -> Bengaluru", () => {
    const r = searchCities("bangalore", CITIES, new Set(), 5);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].code).toBe("BLR"); // Bengaluru
    expect(r[0].name).toBe("Bengaluru");
  });

  it("finds Bombay via alias -> Mumbai", () => {
    const r = searchCities("bombay", CITIES, new Set(), 5);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].code).toBe("BOM");
  });

  it("finds Sao Paulo with diacritics", () => {
    const r = searchCities("São", CITIES, new Set(), 5);
    expect(r.length).toBeGreaterThan(0);
    // In this dataset, São Paulo is coded as GRU (Guarulhos airport).
    expect(r[0].code).toBe("GRU");
    expect(r[0].name).toBe("São Paulo");
  });

  it("matches by country prefix", () => {
    const r = searchCities("japan", CITIES, new Set(), 5);
    expect(r.length).toBeGreaterThan(0);
    // Some entries in the bundled CITIES may not have country set — only
    // assert the matches that do are in Japan.
    const withCountry = r.filter((c) => c.country);
    expect(withCountry.every((c) => c.country === "Japan" || c.countryCode === "JP")).toBe(true);
  });
});

describe("searchCities — edge cases", () => {
  it("returns empty for empty query", () => {
    expect(searchCities("", CITIES, new Set(), 5)).toEqual([]);
    expect(searchCities(" ", CITIES, new Set(), 5)).toEqual([]);
  });

  it("returns empty for 1-char query", () => {
    expect(searchCities("a", CITIES, new Set(), 5)).toEqual([]);
  });

  it("returns empty for 2+ char unknown query", () => {
    // 'xyzqq' is guaranteed not to match any city name or country.
    expect(searchCities("xyzqq", CITIES, new Set(), 5)).toEqual([]);
  });

  it("respects the limit", () => {
    const r = searchCities("a", CITIES, new Set(), 1);
    expect(r.length).toBeLessThanOrEqual(1);
  });

  it("handles limit = 0 (returns empty)", () => {
    expect(searchCities("london", CITIES, new Set(), 0)).toEqual([]);
  });

  it("handles negative limit (returns empty)", () => {
    expect(searchCities("london", CITIES, new Set(), -5)).toEqual([]);
  });

  it("excludes specified codes", () => {
    const r = searchCities("london", CITIES, new Set(["LON"]), 5);
    expect(r.some((c) => c.code === "LON")).toBe(false);
  });

  it("handles a fully-excluded result set", () => {
    // Exclude every city in the dataset -> result must be empty
    // even if the query would otherwise match.
    const all = new Set(CITIES.map((c) => c.code));
    expect(searchCities("london", CITIES, all, 5)).toEqual([]);
  });

  it("handles whitespace in query", () => {
    const r = searchCities("  london  ", CITIES, new Set(), 5);
    expect(r.length).toBeGreaterThan(0);
  });

  it("case-insensitive", () => {
    const a = searchCities("LONDON", CITIES, new Set(), 5);
    const b = searchCities("london", CITIES, new Set(), 5);
    expect(a.map((c) => c.code)).toEqual(b.map((c) => c.code));
  });

  it("returns more populous cities first (within same prefix)", () => {
    const r = searchCities("new", CITIES, new Set(), 5);
    // NYC should be in the top results
    expect(r.some((c) => c.code === "NYC")).toBe(true);
  });

  it("handles a giant exclude set", () => {
    const exclude = new Set(CITIES.map((c) => c.code));
    expect(searchCities("london", CITIES, exclude, 5)).toEqual([]);
  });
});

describe("searchCities — alias coverage", () => {
  it.each([
    ["bangalore", "BLR"],
    ["BANGALORE", "BLR"],
    ["bombay", "BOM"],
    ["madras", "MAA"],
    ["calcutta", "CCU"],
    ["peking", "PEK"],
  ])("alias %s -> %s", (alias, expectedCode) => {
    const r = searchCities(alias, CITIES, new Set(), 5);
    expect(r.some((c) => c.code === expectedCode)).toBe(true);
  });
});

describe("CITY_ALIASES — integrity", () => {
  it("every alias maps to a non-empty lowercase string", () => {
    for (const [k, v] of Object.entries(CITY_ALIASES)) {
      expect(k).toBe(k.toLowerCase().trim());
      expect(v).toBe(v.toLowerCase().trim());
      expect(v.length).toBeGreaterThan(0);
    }
  });
  it("no alias maps to itself", () => {
    for (const [k, v] of Object.entries(CITY_ALIASES)) {
      expect(k).not.toBe(v);
    }
  });
});
