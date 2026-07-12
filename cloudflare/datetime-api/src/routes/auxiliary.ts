// src/routes/auxiliary.ts
// Auxiliary endpoints: DST, holidays, events, popular, quotes, onthisday,
// browse, currency, news, history. All V1 stubs that return sensible
// shapes so the frontend can wire to them. Full implementations in B5.

import { Hono } from "hono";
import { ok, err } from "../lib/responses";

const aux = new Hono();

// ── DST ────────────────────────────────────────────────────────
aux.get("/dst", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  if (!country) return err(c, 400, "country code required", "missing_country");
  return ok(c, { country, dst: null, note: "V1 stub. B5 will return DST status." });
});

aux.get("/dst/upcoming", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  if (!country) return err(c, 400, "country code required", "missing_country");
  return ok(c, { country, upcoming: [], note: "V1 stub." });
});

// ── Holidays ───────────────────────────────────────────────────
aux.get("/holidays/today", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  return ok(c, { country: country ?? null, holidays: [], note: "V1 stub." });
});

aux.get("/holidays/upcoming", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  const limit = Math.min(parseInt(c.req.query("limit") ?? "10", 10) || 10, 100);
  return ok(c, { country: country ?? null, limit, holidays: [], note: "V1 stub." });
});

aux.get("/holidays/year", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  const year = parseInt(c.req.query("year") ?? String(new Date().getFullYear()), 10);
  if (!Number.isFinite(year) || year < 1900 || year > 2200) {
    return err(c, 400, "year must be between 1900 and 2200", "invalid_year");
  }
  return ok(c, { country: country ?? null, year, holidays: [], note: "V1 stub." });
});

// ── Popular ────────────────────────────────────────────────────
aux.get("/popular/cities", (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10) || 20, 100);
  return ok(c, { count: limit, cities: [], note: "V1 stub." });
});

aux.get("/popular/defaults", (c) => {
  return ok(c, { cities: [], note: "V1 stub." });
});

// ── Quotes ─────────────────────────────────────────────────────
aux.get("/quotes/random", (c) => {
  return ok(c, { quote: null, note: "V1 stub." });
});

aux.get("/quotes/ranked", (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10) || 20, 100);
  return ok(c, { count: limit, quotes: [], note: "V1 stub." });
});

// ── Events ─────────────────────────────────────────────────────
aux.get("/events/upcoming", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  return ok(c, { country: country ?? null, events: [], note: "V1 stub." });
});

aux.get("/events/next", (c) => {
  return ok(c, { event: null, note: "V1 stub." });
});

// ── OnThisDay ──────────────────────────────────────────────────
aux.get("/onthisday", (c) => {
  const month = parseInt(c.req.query("month") ?? String(new Date().getMonth() + 1), 10);
  const day = parseInt(c.req.query("day") ?? String(new Date().getDate()), 10);
  if (month < 1 || month > 12) return err(c, 400, "month must be 1-12", "invalid_month");
  if (day < 1 || day > 31) return err(c, 400, "day must be 1-31", "invalid_day");
  return ok(c, { month, day, events: [], note: "V1 stub." });
});

// ── Browse home ────────────────────────────────────────────────
aux.get("/browse/home", (c) => {
  return ok(c, { greeting: null, statusPills: [], holiday: null, sun: null, sync: null, note: "V1 stub." });
});

// ── Currency ───────────────────────────────────────────────────
aux.get("/currency/rates", (c) => {
  const base = (c.req.query("base") ?? "USD").toUpperCase();
  return ok(c, { base, rates: {}, note: "V1 stub. Will use exchangerate.host in B5." });
});

aux.get("/currency/convert", (c) => {
  const from = c.req.query("from")?.toUpperCase();
  const to = c.req.query("to")?.toUpperCase();
  const amount = parseFloat(c.req.query("amount") ?? "1");
  if (!from || !to) return err(c, 400, "from and to required", "missing_params");
  if (!Number.isFinite(amount) || amount < 0) return err(c, 400, "amount must be a positive number", "invalid_amount");
  return ok(c, { from, to, amount, converted: null, rate: null, note: "V1 stub." });
});

aux.get("/currency/codes", (c) => {
  return ok(c, { codes: ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "AUD", "CAD", "CHF", "SGD"], note: "V1 stub. Will return 170+ ISO 4217 codes in B5." });
});

// ── News ───────────────────────────────────────────────────────
aux.get("/news/by-country", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  return ok(c, { country: country ?? null, articles: [], note: "V1 stub." });
});

aux.get("/news/by-category", (c) => {
  const category = c.req.query("category");
  return ok(c, { category, articles: [], note: "V1 stub." });
});

aux.get("/news/global", (c) => {
  return ok(c, { articles: [], note: "V1 stub." });
});

aux.get("/news/feeds", (c) => {
  return ok(c, { feeds: [], note: "V1 stub." });
});

// ── History ────────────────────────────────────────────────────
aux.get("/history/by-country", (c) => {
  const country = c.req.query("country")?.toUpperCase();
  return ok(c, { country: country ?? null, events: [], note: "V1 stub." });
});

aux.get("/history/countries", (c) => {
  return ok(c, { countries: [], note: "V1 stub." });
});

export { aux as auxRouter };
