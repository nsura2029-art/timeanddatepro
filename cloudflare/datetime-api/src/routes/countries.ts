// src/routes/countries.ts
// Country endpoints: list, get by code, holidays, working hours.

import { Hono } from "hono";
import { ok, err } from "../lib/responses";

const countries = new Hono();

// V1 stub: returns a minimal list. The full port (B5) will query D1
// for the 194-country dataset.
const COUNTRIES: Record<string, { code: string; name: string; capital: string; region: string; subregion: string; languages: string[]; currency: string; flag: string; population: number }> = {
  US: { code: "US", name: "United States", capital: "Washington, D.C.", region: "Americas", subregion: "Northern America", languages: ["en"], currency: "USD", flag: "🇺🇸", population: 331900000 },
  GB: { code: "GB", name: "United Kingdom", capital: "London", region: "Europe", subregion: "Northern Europe", languages: ["en"], currency: "GBP", flag: "🇬🇧", population: 67500000 },
  IN: { code: "IN", name: "India", capital: "New Delhi", region: "Asia", subregion: "Southern Asia", languages: ["en", "hi"], currency: "INR", flag: "🇮🇳", population: 1380000000 },
  DE: { code: "DE", name: "Germany", capital: "Berlin", region: "Europe", subregion: "Western Europe", languages: ["de"], currency: "EUR", flag: "🇩🇪", population: 83000000 },
  FR: { code: "FR", name: "France", capital: "Paris", region: "Europe", subregion: "Western Europe", languages: ["fr"], currency: "EUR", flag: "🇫🇷", population: 67000000 },
  JP: { code: "JP", name: "Japan", capital: "Tokyo", region: "Asia", subregion: "Eastern Asia", languages: ["ja"], currency: "JPY", flag: "🇯🇵", population: 125000000 },
  CN: { code: "CN", name: "China", capital: "Beijing", region: "Asia", subregion: "Eastern Asia", languages: ["zh"], currency: "CNY", flag: "🇨🇳", population: 1411000000 },
  BR: { code: "BR", name: "Brazil", capital: "Brasília", region: "Americas", subregion: "South America", languages: ["pt"], currency: "BRL", flag: "🇧🇷", population: 214000000 },
  AU: { code: "AU", name: "Australia", capital: "Canberra", region: "Oceania", subregion: "Australia and New Zealand", languages: ["en"], currency: "AUD", flag: "🇦🇺", population: 26000000 },
  CA: { code: "CA", name: "Canada", capital: "Ottawa", region: "Americas", subregion: "Northern America", languages: ["en", "fr"], currency: "CAD", flag: "🇨🇦", population: 39000000 },
  AE: { code: "AE", name: "United Arab Emirates", capital: "Abu Dhabi", region: "Asia", subregion: "Western Asia", languages: ["ar"], currency: "AED", flag: "🇦🇪", population: 9900000 },
  SG: { code: "SG", name: "Singapore", capital: "Singapore", region: "Asia", subregion: "South-Eastern Asia", languages: ["en", "zh", "ms", "ta"], currency: "SGD", flag: "🇸🇬", population: 5900000 },
};

const ALL_COUNTRIES = Object.values(COUNTRIES);

/** GET /api/v1/countries — list all countries. */
countries.get("/", (c) => {
  const region = c.req.query("region");
  let list = ALL_COUNTRIES;
  if (region) {
    list = list.filter((co) => co.region.toLowerCase() === region.toLowerCase());
    if (list.length === 0) {
      return err(c, 404, `No countries found in region: ${region}`, "region_not_found");
    }
  }
  return ok(c, { count: list.length, total: ALL_COUNTRIES.length, countries: list });
});

/** GET /api/v1/countries/:code — get a country. */
countries.get("/:code", (c) => {
  const code = c.req.param("code").toUpperCase();
  const country = COUNTRIES[code];
  if (!country) {
    return err(c, 404, `Country not found: ${code}`, "country_not_found");
  }
  return ok(c, country);
});

/** GET /api/v1/countries/:code/holidays — V1 stub. */
countries.get("/:code/holidays", (c) => {
  const code = c.req.param("code").toUpperCase();
  if (!COUNTRIES[code]) {
    return err(c, 404, `Country not found: ${code}`, "country_not_found");
  }
  const yearParam = c.req.query("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  if (!Number.isFinite(year) || year < 1900 || year > 2200) {
    return err(c, 400, "year must be between 1900 and 2200", "invalid_year");
  }
  return ok(c, {
    country: code,
    year,
    holidays: [],
    note: "V1 stub. The full port (B5) will return 1,847 holidays from the bundled dataset.",
  });
});

/** GET /api/v1/countries/:code/working-hours — V1 stub. */
countries.get("/:code/working-hours", (c) => {
  const code = c.req.param("code").toUpperCase();
  if (!COUNTRIES[code]) {
    return err(c, 404, `Country not found: ${code}`, "country_not_found");
  }
  // Standard working hours: Mon-Fri 9-17
  return ok(c, {
    country: code,
    days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
    hours: { start: "09:00", end: "17:00" },
    hours_per_week: 40,
    note: "V1 stub. The full port (B5) will return country-specific working hours with holiday exceptions.",
  });
});

export { countries as countriesRouter };
