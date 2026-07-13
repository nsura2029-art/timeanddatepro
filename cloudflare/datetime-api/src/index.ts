// src/index.ts
// TimeAndDatePro API Worker — Hono on Cloudflare Workers.
// Wires all route modules + middleware + global error handler.

import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import { citiesRouter } from "./routes/cities";
import { timeRouter } from "./routes/time";
import { countriesRouter } from "./routes/countries";
import { pairsRouter } from "./routes/pairs";
import { auxRouter } from "./routes/auxiliary";
import { feedbackRouter } from "./routes/feedback";
import { waitlistRouter } from "./routes/waitlist";
import { capturesRouter } from "./routes/captures";
import { dateToWordRouter } from "./routes/dateToWord";
import { currencyRouter } from "./routes/currency";
import { cryptoRouter } from "./routes/crypto";
import { statusRouter } from "./routes/status";
import { v2SearchRouter } from "./routes/v2/search";
import { ok, err, API_VERSION } from "./lib/responses";

const app = new Hono();

// ── Global middleware ──────────────────────────────────────
app.use("*", corsMiddleware);

// ── Root: API info + endpoint list ───────────────────────
app.get("/", (c) =>
  ok(c, {
    name: "TimeAndDatePro API",
    version: API_VERSION,
    status: "live",
    documentation: "/api/v1",
    health: "/api/v1/health",
  })
);

app.get("/api/v1", (c) =>
  ok(c, {
    name: "TimeAndDatePro API",
    version: API_VERSION,
    sdk: { nodejs: "sdk/node/README.md" },
    endpoints: [
      // Cities (V1)
      "GET /api/v1/cities",
      "GET /api/v1/cities/:slug",
      "GET /api/v1/cities/live",
      "GET /api/v1/cities/search",
      // Time (V1)
      "GET /api/v1/time/now",
      "GET /api/v1/time/convert",
      "GET /api/v1/time/diff",
      "GET /api/v1/time/add",
      "GET /api/v1/time/unix",
      "GET /api/v1/time/iso",
      "GET /api/v1/time/words",
      "GET /api/v1/time/sun",
      // Countries (V1 stub)
      "GET /api/v1/countries",
      "GET /api/v1/countries/:code",
      "GET /api/v1/countries/:code/holidays",
      "GET /api/v1/countries/:code/working-hours",
      // Pairs (V1 stub)
      "GET /api/v1/pairs/:from/:to",
      "GET /api/v1/meeting/best",
      // Auxiliary (V1 stub)
      "GET /api/v1/dst",
      "GET /api/v1/dst/upcoming",
      "GET /api/v1/holidays/today",
      "GET /api/v1/holidays/upcoming",
      "GET /api/v1/holidays/year",
      "GET /api/v1/popular/cities",
      "GET /api/v1/popular/defaults",
      "GET /api/v1/quotes/random",
      "GET /api/v1/quotes/ranked",
      "GET /api/v1/events/upcoming",
      "GET /api/v1/events/next",
      "GET /api/v1/onthisday",
      "GET /api/v1/browse/home",
      "GET /api/v1/currency/rates",
      "GET /api/v1/currency/convert",
      "GET /api/v1/currency/codes",
      "GET /api/v1/news/by-country",
      "GET /api/v1/news/by-category",
      "GET /api/v1/news/global",
      "GET /api/v1/news/feeds",
      "GET /api/v1/history/by-country",
      "GET /api/v1/history/countries",
      // Feedback (V1 stub)
      "GET /api/v1/feedback",
      "GET /api/v1/feedback/top",
      "GET /api/v1/feedback/:id",
      "POST /api/v1/feedback",
      "POST /api/v1/feedback/:id/vote",
      "DELETE /api/v1/feedback/:id",
      // Phase 6 — thin API for user captures
      "POST /api/v1/waitlist",
      "GET /api/v1/waitlist/count",
      "GET /api/v1/waitlist/recent",
      "POST /api/v1/captures",
      "GET /api/v1/captures/recent",
      "GET /api/v1/captures/stats",
      "POST /api/v1/tools/date-to-word/bulk",
      "GET /api/v1/tools/date-to-word/translate",
      "GET /api/v1/tools/date-to-word/formats",
      "GET /api/v1/tools/date-to-word/preview",
      // Phase 6.5 — Currency API (9 endpoints)
      "GET  /api/v1/currency/codes",
      "GET  /api/v1/currency/rates",
      "GET  /api/v1/currency/convert",
      "GET  /api/v1/currency/pair",
      "GET  /api/v1/currency/timeseries",
      "POST /api/v1/currency/bulk",
      "GET  /api/v1/crypto/prices",
      "GET  /api/v1/crypto/convert",
      "GET  /api/v1/status",
    ],
  })
);

// ── Health ────────────────────────────────────────────────
app.get("/api/v1/health", (c) =>
  ok(c, {
    status: "ok",
    version: API_VERSION,
    uptime_ms: typeof performance !== "undefined" ? performance.now() : 0,
  })
);

// ── Mount route modules ──────────────────────────────────
app.route("/api/v1/cities", citiesRouter);
app.route("/api/v1/time", timeRouter);
app.route("/api/v1/countries", countriesRouter);
app.route("/api/v1/pairs", pairsRouter);
app.route("/api/v1/meeting", pairsRouter);
app.route("/api/v1", auxRouter);
app.route("/api/v1/feedback", feedbackRouter);
app.route("/api/v1/waitlist", waitlistRouter);
app.route("/api/v1/captures", capturesRouter);
app.route("/api/v1/tools/date-to-word", dateToWordRouter);
app.route("/api/v1/currency", currencyRouter);
app.route("/api/v1/crypto", cryptoRouter);
app.route("/api/v1/status", statusRouter);

// ── v2 — full D1-backed geographic + locale-aware search ──
// Mounted BEFORE the v1 cities router so /api/v2/* takes priority
// over the v1 wildcard.
app.route("/api/v2", v2SearchRouter);

// ── 404 handler ──────────────────────────────────────────
app.notFound((c) => err(c, 404, `Route not found: ${c.req.method} ${c.req.path}`, "not_found"));

// ── Global error handler ─────────────────────────────────
// Catches any unhandled exception and returns a 500 with a stable shape.
app.onError((err, c) => {
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error:", err);
  return c.json(
    {
      success: false,
      error: {
        message: "Internal server error",
        code: "internal_error",
        status: 500,
      },
    },
    500
  );
});

export default app;
