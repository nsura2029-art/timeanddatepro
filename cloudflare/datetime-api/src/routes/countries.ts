import type { D1Database } from "@cloudflare/workers-types";
// src/routes/countries.ts
// Country endpoints backed by D1 (194 countries from mledoze/restcountries).

import { Hono } from "hono";
import { ok, err } from "../lib/responses";

type Bindings = { DB: D1Database };
const countries = new Hono<{ Bindings: Bindings }>();

interface CountryRow {
  cca2: string;
  cca3: string;
  ccn3: string | null;
  cioc: string | null;
  name: string;
  ascii_name: string;
  official_name: string | null;
  capital: string | null;
  continent: string | null;
  un_region: string | null;
  un_subregion: string | null;
  un_region_m49: string | null;
  un_subregion_m49: string | null;
  languages: string;        // JSON
  currencies: string;       // JSON
  phone_code: string | null;
  driving_side: string | null;
  flag_emoji: string | null;
  flag_svg: string | null;
  flag_png: string | null;
  latitude: number | null;
  longitude: number | null;
  area_km2: number | null;
  population: number | null;
  un_member: number | null;
  landlocked: number | null;
  independent: number | null;
  start_of_week: string | null;
  canonical_timezones: string;  // JSON
  borders: string;              // JSON
  tld: string | null;
}

function shapeCountry(r: CountryRow) {
  return {
    code: r.cca2,
    code3: r.cca3,
    numeric: r.ccn3,
    cioc: r.cioc,
    name: r.name,
    asciiName: r.ascii_name,
    officialName: r.official_name,
    capital: r.capital,
    continent: r.continent,
    region: r.un_region,
    subregion: r.un_subregion,
    regionM49: r.un_region_m49,
    subregionM49: r.un_subregion_m49,
    languages: safeJson(r.languages, []),
    currencies: safeJson(r.currencies, []),
    phoneCode: r.phone_code,
    drivingSide: r.driving_side,
    flagEmoji: r.flag_emoji,
    flagSvg: r.flag_svg,
    flagPng: r.flag_png,
    latitude: r.latitude,
    longitude: r.longitude,
    area: r.area_km2,
    population: r.population,
    unMember: r.un_member === 1,
    landlocked: r.landlocked === 1,
    independent: r.independent === 1,
    startOfWeek: r.start_of_week,
    timezones: safeJson(r.canonical_timezones, []),
    borders: safeJson(r.borders, []),
    tld: r.tld,
  };
}

function safeJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** GET /api/v1/countries — list all 194 countries. */
countries.get("/", async (c) => {
  const region = c.req.query("region");
  const subregion = c.req.query("subregion");
  const continent = c.req.query("continent");
  const limit = Math.min(300, Math.max(1, parseInt(c.req.query("limit") ?? "300", 10) || 300));
  const offset = Math.max(0, parseInt(c.req.query("offset") ?? "0", 10) || 0);

  let sql = `SELECT * FROM countries WHERE 1=1`;
  const params: any[] = [];
  if (region) { sql += ` AND LOWER(un_region) = LOWER(?${params.length + 1})`; params.push(region); }
  if (subregion) { sql += ` AND LOWER(un_subregion) = LOWER(?${params.length + 1})`; params.push(subregion); }
  if (continent) { sql += ` AND continent = ?${params.length + 1}`; params.push(continent.toUpperCase()); }
  sql += ` ORDER BY population DESC NULLS LAST LIMIT ?${params.length + 1} OFFSET ?${params.length + 2}`;
  params.push(limit, offset);

  const result = await c.env.DB.prepare(sql).bind(...params).all<CountryRow>();
  const list = (result.results || []).map(shapeCountry);

  return ok(c, {
    count: list.length,
    limit,
    offset,
    countries: list,
  });
});

/** GET /api/v1/countries/:code — get a single country by cca2, cca3, or cioc. */
countries.get("/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const r = await c.env.DB.prepare(
    `SELECT * FROM countries WHERE cca2 = ?1 OR cca3 = ?1 OR cioc = ?1 LIMIT 1`,
  ).bind(code).first<CountryRow>();
  if (!r) {
    return err(c, 404, `Country not found: ${code}`, "country_not_found");
  }
  return ok(c, shapeCountry(r));
});

/** GET /api/v1/countries/:code/holidays — V1 stub (full port in 5.3). */
countries.get("/:code/holidays", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const r = await c.env.DB.prepare(
    `SELECT cca2 FROM countries WHERE cca2 = ?1 OR cca3 = ?1 LIMIT 1`,
  ).bind(code).first<{ cca2: string }>();
  if (!r) {
    return err(c, 404, `Country not found: ${code}`, "country_not_found");
  }
  const yearParam = c.req.query("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  if (!Number.isFinite(year) || year < 1900 || year > 2200) {
    return err(c, 400, "year must be between 1900 and 2200", "invalid_year");
  }
  return ok(c, {
    country: r.cca2,
    year,
    holidays: [],
    note: "Holidays table will be seeded in Phase 5.3. Currently returns empty list.",
  });
});

/** GET /api/v1/countries/:code/working-hours — standard hours. */
countries.get("/:code/working-hours", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const r = await c.env.DB.prepare(
    `SELECT cca2, start_of_week FROM countries WHERE cca2 = ?1 OR cca3 = ?1 LIMIT 1`,
  ).bind(code).first<{ cca2: string; start_of_week: string | null }>();
  if (!r) {
    return err(c, 404, `Country not found: ${code}`, "country_not_found");
  }
  // Standard working hours: Mon-Fri 9-17 (40 hrs/week)
  // Note: real working hours vary by country. This is a reasonable default.
  return ok(c, {
    country: r.cca2,
    days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
    hours: { start: "09:00", end: "17:00" },
    hours_per_week: 40,
    startOfWeek: r.start_of_week,
    note: "Default working hours. Country-specific hours available in future phases.",
  });
});

/** GET /api/v1/countries/:code/cities — list cities in a country. */
countries.get("/:code/cities", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const r = await c.env.DB.prepare(
    `SELECT cca2 FROM countries WHERE cca2 = ?1 OR cca3 = ?1 LIMIT 1`,
  ).bind(code).first<{ cca2: string }>();
  if (!r) {
    return err(c, 404, `Country not found: ${code}`, "country_not_found");
  }
  const limit = Math.min(500, Math.max(1, parseInt(c.req.query("limit") ?? "100", 10) || 100));
  const result = await c.env.DB.prepare(
    `SELECT geoname_id AS id, name, ascii_name AS asciiName, country_code AS countryCode,
            country_name AS countryName, admin1_code AS stateCode, latitude, longitude,
            timezone, population, is_capital AS isCapital, feature_code AS featureCode
     FROM cities
     WHERE country_code = ?1
     ORDER BY population DESC
     LIMIT ?2`,
  ).bind(r.cca2, limit).all();
  return ok(c, {
    country: r.cca2,
    count: (result.results || []).length,
    cities: result.results || [],
  });
});

export { countries as countriesRouter };
