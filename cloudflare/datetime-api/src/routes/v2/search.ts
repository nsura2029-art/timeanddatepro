import type { D1Database } from "@cloudflare/workers-types";
// ============================================================
// v2 search endpoint — full geographic + locale-aware search
// ============================================================
// GET /api/v2/search?q=Hyderabad&limit=8&country=US&tz=America/New_York
//                  &near=40.7,-74.0&locale=fr-FR&type=city&page=1
//                  &exclude=5128581,5391959
// ============================================================

import { Hono } from "hono";
import { search, type SearchResponse } from "../../lib/v2-search.js";
import { ok, err, requireString, parseCsv, parseFloatStrict } from "../../lib/responses.js";

type Bindings = { DB: D1Database };

export const v2SearchRouter = new Hono<{ Bindings: Bindings }>();

v2SearchRouter.get("/search", async (c) => {
  const qError = requireString(c.req.query("q"), "q");
  if (qError) return err(c, 400, qError, "bad_request");
  const q = c.req.query("q")!;

  const limit = parseInt(c.req.query("limit") ?? "8", 10);
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const type = c.req.query("type") as "city" | "country" | "state" | "all" | undefined;
  if (type && !["city", "country", "state", "all"].includes(type)) {
    return err(c, 400, `Invalid type: ${type}`, "bad_request");
  }
  const country = c.req.query("country")?.toUpperCase();
  const state = c.req.query("state")?.toUpperCase();
  const timezone = c.req.query("tz");
  const locale = c.req.query("locale");
  const exclude = parseCsv(c.req.query("exclude"));

  // Parse ?near=lat,lon
  let near: { lat: number; lon: number } | undefined;
  const nearParam = c.req.query("near");
  if (nearParam) {
    const [latStr, lonStr] = nearParam.split(",");
    const lat = parseFloatStrict(latStr);
    const lon = parseFloatStrict(lonStr);
    if (lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      near = { lat, lon };
    }
  }

  const result = await search(c.env.DB, {
    q,
    limit,
    page,
    type,
    country,
    state,
    timezone,
    locale,
    near,
    exclude,
  });

  return ok(c, result);
});

// Convenience: GET /api/v2/cities/search?q=... → same handler (alias)
v2SearchRouter.get("/cities/search", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = "/api/v2/search";
  return c.redirect(url.pathname + url.search, 307);
});
