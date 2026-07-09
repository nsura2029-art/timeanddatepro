import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Dynamic sitemap.xml — driven by src/utils/sitemap.ts registry
import { generateSitemapXml, getSitemapEntryCount } from "./src/utils/sitemap";

const SITE_ORIGIN =
  process.env.PUBLIC_SITE_ORIGIN ||
  process.env.SITE_ORIGIN ||
  "https://timeanddatepro.com";

app.get("/sitemap.xml", (req, res) => {
  try {
    const xml = generateSitemapXml(SITE_ORIGIN);
    res.type("application/xml; charset=utf-8");
    // Cache at edge for 1 hour, allow stale-while-revalidate for 24h
    res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.send(xml);
  } catch (err) {
    console.error("sitemap.xml generation failed:", err);
    res.status(500).type("text/plain").send("sitemap generation error");
  }
});

// Tiny helper for ops — returns the count of registered URLs
app.get("/api/sitemap/stats", (req, res) => {
  res.json({
    entries: getSitemapEntryCount(),
    origin: SITE_ORIGIN,
    generatedAt: new Date().toISOString(),
  });
});

// AI Query parsing endpoint
app.post("/api/timezone/query", async (req, res) => {
  const { query, userContext } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const { country, timezone, locale, currentTime } = userContext || {};

  const systemInstruction = `You are the AI engine for a premium global Time & Date intelligence platform.
Your task is to parse the user's natural language time/date query and output a structured JSON response.

You MUST respond with a JSON object containing these keys:
1. "intent": string, one of ["convert", "time", "meeting", "business_days", "holiday", "dst", "unknown"]
2. "detectedParameters": an object containing any of these optional keys:
   - "sourceTime": string (e.g. "15:00")
   - "sourceDate": string (e.g. "2026-07-07")
   - "sourceTimezone": string (e.g. "America/New_York", "Asia/Kolkata", "Europe/Berlin", "UTC")
   - "targetTimezone": string (e.g. "Asia/Singapore", "Europe/London", "America/Los_Angeles")
   - "meetingAttendees": array of strings (timezones or city names, e.g. ["London", "New York", "Mumbai"])
   - "targetCountry": string (e.g. "Germany", "United States", "India")
   - "queryDate": string (e.g. "2026-07-07")
3. "answer": string, a highly accurate, beautifully written, natural language answer. Ensure you perform the correct time conversion or calculation.
4. "suggestedAction": string, one of ["open_converter", "open_meeting_planner", "open_days_calculator", "open_holiday_calendar", "general"]

Context:
- Today's date is Tuesday, July 7, 2026 (use this as the anchor date if the user refers to "today", "tomorrow", or calculates business days).
- The user is currently located in: ${country || "Unknown"} (timezone: ${timezone || "UTC"}).
- User's local current time: ${currentTime || "Unknown"}.

Examples:
- Query: "Convert 3 PM New York to Singapore"
  JSON: {
    "intent": "convert",
    "detectedParameters": { "sourceTime": "15:00", "sourceTimezone": "America/New_York", "targetTimezone": "Asia/Singapore" },
    "answer": "3:00 PM in New York (EDT, UTC-4) is 3:00 AM the next day (Wednesday, July 8) in Singapore (SGT, UTC+8). There is a 12-hour difference.",
    "suggestedAction": "open_converter"
  }

- Query: "How many business days until July 20?"
  JSON: {
    "intent": "business_days",
    "detectedParameters": { "sourceDate": "2026-07-07", "targetDate": "2026-07-20" },
    "answer": "There are exactly 9 business days between today (Tuesday, July 7, 2026) and Monday, July 20, 2026 (excluding weekends).",
    "suggestedAction": "open_days_calculator"
  }

- Query: "Best meeting time between New York, London, and Tokyo?"
  JSON: {
    "intent": "meeting",
    "detectedParameters": { "meetingAttendees": ["New York", "London", "Tokyo"] },
    "answer": "The best overlap for New York, London, and Tokyo is typically around 8:00 AM - 9:00 AM New York time (1:00 PM - 2:00 PM London, and 9:00 PM - 10:00 PM Tokyo). This avoids anyone being in deep night.",
    "suggestedAction": "open_meeting_planner"
  }

Ensure the output is strictly valid JSON matching the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: "The parsed user intent.",
            },
            detectedParameters: {
              type: Type.OBJECT,
              properties: {
                sourceTime: { type: Type.STRING },
                sourceDate: { type: Type.STRING },
                sourceTimezone: { type: Type.STRING },
                targetTimezone: { type: Type.STRING },
                meetingAttendees: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                targetCountry: { type: Type.STRING },
                queryDate: { type: Type.STRING },
              },
            },
            answer: {
              type: Type.STRING,
              description: "A highly accurate, beautiful natural language answer.",
            },
            suggestedAction: {
              type: Type.STRING,
              description: "The client-side UI action to trigger.",
            },
          },
          required: ["intent", "answer", "suggestedAction"],
        }
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: "Failed to parse query with Gemini",
      details: error.message || String(error)
    });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// Public REST API v1
// All endpoints return JSON in the shape:
//   { success: true, data: ..., meta: { endpoint, version, generatedAt } }
//   { success: false, error: { code, message } }
// ───────────────────────────────────────────────────────────────────────────

import {
  ApiError,
  timeNow,
  timeConvert,
  dateDiff,
  dateAdd,
  unixConvert,
  isoFormat,
  dateToWords,
  listCities,
  listCountries,
  countryHolidays,
  workingHours,
  meetingBest,
  cityPair,
} from "./src/utils/timeApi";

const API_VERSION = "1.0.0";

function ok(res: any, data: any, endpoint: string) {
  res.json({
    success: true,
    data,
    meta: { endpoint, version: API_VERSION, generatedAt: new Date().toISOString() },
  });
}

function err(res: any, e: any, endpoint: string) {
  if (e instanceof ApiError) {
    return res.status(e.status).json({
      success: false,
      error: { code: e.code, message: e.message },
      meta: { endpoint, version: API_VERSION, generatedAt: new Date().toISOString() },
    });
  }
  console.error(`[api] ${endpoint} crashed:`, e);
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL", message: e?.message || "Unknown error" },
    meta: { endpoint, version: API_VERSION, generatedAt: new Date().toISOString() },
  });
}

function cacheSeconds(res: any, secs: number) {
  res.set("Cache-Control", `public, max-age=${secs}`);
}

const H =
  (endpoint: string, ttl: number, fn: (req: any, res: any) => any) =>
  async (req: any, res: any) => {
    try {
      cacheSeconds(res, ttl);
      const data = await fn(req, res);
      if (res.headersSent) return;
      ok(res, data, endpoint);
    } catch (e) {
      err(res, e, endpoint);
    }
  };

app.get("/api/v1", (_req: any, res: any) => {
  ok(res, {
    name: "TimeAndDatePro API",
    version: API_VERSION,
    documentation: "/api-docs",
    sdk: { nodejs: "sdk/node/README.md" },
    endpoints: [
      "GET /api/v1/time/now",
      "GET /api/v1/time/convert",
      "GET /api/v1/time/diff",
      "GET /api/v1/time/add",
      "GET /api/v1/time/unix",
      "GET /api/v1/time/iso",
      "GET /api/v1/time/words",
      "GET /api/v1/cities",
      "GET /api/v1/cities/:slug",
      "GET /api/v1/countries",
      "GET /api/v1/countries/:code",
      "GET /api/v1/countries/:code/holidays",
      "GET /api/v1/countries/:code/working-hours",
      "GET /api/v1/pairs/:from/:to",
      "GET /api/v1/meeting/best",
      // Data-source APIs (new — landing page hero, news/events section)
      "GET /api/v1/time/sun",
      "GET /api/v1/time/sync",
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
      // Currency
      "GET /api/v1/currency/rates",
      "GET /api/v1/currency/convert",
      "GET /api/v1/currency/codes",
      // Wikipedia enrichment
      "GET /api/v1/news/by-country",
      "GET /api/v1/news/by-category",
      "GET /api/v1/news/global",
      "GET /api/v1/news/feeds",
      "GET /api/v1/history/by-country",
      "GET /api/v1/history/countries",
    ],
  }, "/api/v1");
});

app.get("/api/v1/health", (_req: any, res: any) =>
  ok(res, { status: "ok", uptime: process.uptime() }, "/api/v1/health")
);

app.get("/api/v1/time/now", H("/api/v1/time/now", 0, (req: any) =>
  timeNow({ tz: req.query.tz as string | undefined, city: req.query.city as string | undefined })
));

app.get("/api/v1/time/convert", H("/api/v1/time/convert", 0, (req: any) =>
  timeConvert({
    from: req.query.from as string,
    to: req.query.to as string,
    time: req.query.time as string | undefined,
    date: req.query.date as string | undefined,
  })
));

app.get("/api/v1/time/diff", H("/api/v1/time/diff", 60, (req: any) =>
  dateDiff({
    from: req.query.from as string,
    to: req.query.to as string,
    mode: ((req.query.mode as string) ?? "calendar") as "calendar" | "business",
    country: req.query.country as any,
  })
));

app.get("/api/v1/time/add", H("/api/v1/time/add", 0, (req: any) =>
  dateAdd({
    date: req.query.date as string,
    years: req.query.years ? +req.query.years : undefined,
    months: req.query.months ? +req.query.months : undefined,
    weeks: req.query.weeks ? +req.query.weeks : undefined,
    days: req.query.days ? +req.query.days : undefined,
    business: req.query.business === "true",
    country: req.query.country as any,
  })
));

app.get("/api/v1/time/unix", H("/api/v1/time/unix", 0, (req: any) =>
  unixConvert({
    value: req.query.value as string,
    direction: ((req.query.direction as string) ?? "to_date") as "to_date" | "to_unix",
    unit: req.query.unit as "s" | "ms" | undefined,
  })
));

app.get("/api/v1/time/iso", H("/api/v1/time/iso", 60, (req: any) =>
  isoFormat({
    date: req.query.date as string,
    format: req.query.format as any,
    tz: req.query.tz as string | undefined,
  })
));

app.get("/api/v1/time/words", H("/api/v1/time/words", 60, (req: any) =>
  dateToWords({
    date: req.query.date as string,
    lang: req.query.lang as string | undefined,
  })
));

app.get("/api/v1/cities", H("/api/v1/cities", 3600, () => listCities()));

app.get("/api/v1/cities/:slug", H("/api/v1/cities/:slug", 3600, (req: any) => {
  const slug = (req.params.slug as string).toLowerCase();
  const all = listCities();
  const found = all.find((c: any) =>
    c.code.toLowerCase() === slug ||
    c.name.toLowerCase().replace(/\s+/g, "-") === slug ||
    c.timezone.toLowerCase() === slug
  );
  if (!found) throw new ApiError(404, "UNKNOWN_CITY", `No city matches "${slug}".`);
  return { ...found, currentTime: timeNow({ tz: found.timezone }) };
}));

app.get("/api/v1/countries", H("/api/v1/countries", 3600, () => listCountries()));

app.get("/api/v1/countries/:code", H("/api/v1/countries/:code", 3600, (req: any) => {
  const code = (req.params.code as string).toUpperCase();
  const all = listCountries();
  const found = all.find((c: any) => c.code === code);
  if (!found) throw new ApiError(404, "UNKNOWN_COUNTRY", `Unknown country "${code}".`);
  return {
    ...found,
    holidays: countryHolidays(code).holidays.length,
    workingHours: workingHours(code, {}).totalHours,
  };
}));

app.get("/api/v1/countries/:code/holidays", H("/api/v1/countries/:code/holidays", 86400, (req: any) =>
  countryHolidays(req.params.code as string, req.query.year ? +req.query.year : undefined)
));

app.get("/api/v1/countries/:code/working-hours", H("/api/v1/countries/:code/working-hours", 86400, (req: any) =>
  workingHours(req.params.code as string, {
    year: req.query.year ? +req.query.year : undefined,
    hoursPerDay: req.query.hoursPerDay ? +req.query.hoursPerDay : undefined,
  })
));

app.get("/api/v1/pairs/:from/:to", H("/api/v1/pairs/:from/:to", 60, (req: any) =>
  cityPair(req.params.from as string, req.params.to as string)
));

app.get("/api/v1/meeting/best", H("/api/v1/meeting/best", 0, (req: any) =>
  meetingBest({
    cities: String(req.query.cities || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    workingStart: req.query.start ? +req.query.start : undefined,
    workingEnd: req.query.end ? +req.query.end : undefined,
    duration: req.query.duration ? +req.query.duration : undefined,
  })
));

// ============================================================================
// DATA SOURCE APIS — landing page, events, news, sun, holidays, sync, quotes
// ============================================================================

import { sunPosition } from "./src/utils/sunApi";
import { lookupHoliday, getUpcomingHolidaysForCountry, getHolidaysForCountry } from "./src/utils/holidayApi";
import { getPopularCities, getDefaultFavorites } from "./src/utils/popularApi";
import { pickQuote, rankQuotes } from "./src/utils/quoteApi";
import { getSyncResponse } from "./src/utils/syncApi";
import { dstInfo, getUpcomingDstChanges } from "./src/utils/dstApi";
import { getUpcomingEvents, getNextBigEvent, type AggregatedEvent } from "./src/utils/eventsApi";
import { fetchOnThisDay, selectHeadlines, formatOnThisDay } from "./src/utils/onthisdayApi";
import { buildBrowseHome } from "./src/utils/homeApi";
import { openapiSpec } from "./src/utils/openapi";
import { QUOTES_EN } from "./src/data/quotes/en";

// === OPENAPI / API DOCS ===
app.get("/api-docs", (_req: any, res: any) => {
  res.set("Content-Type", "application/json; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(JSON.stringify(openapiSpec(), null, 2));
});

app.get("/api-docs/swagger", (_req: any, res: any) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>TimeAndDatePro API - Swagger UI</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({ url: "/api-docs", dom_id: "#swagger-ui", deepLinking: true });
</script>
</body>
</html>`);
});

// === SUN POSITION ===
app.get("/api/v1/time/sun", H("/api/v1/time/sun", 86400, (req: any) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const tz = (req.query.tz as string) || "UTC";
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw Object.assign(new Error("lat and lng query params required"), { status: 400 });
  }
  return sunPosition(lat, lng, date, tz);
}));

// === HOLIDAYS ===
app.get("/api/v1/holidays/today", H("/api/v1/holidays/today", 3600, (req: any) => {
  const country = (req.query.country as string)?.toUpperCase() || "US";
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  return lookupHoliday(country as any, date);
}));

app.get("/api/v1/holidays/upcoming", H("/api/v1/holidays/upcoming", 3600, (req: any) => {
  const country = (req.query.country as string)?.toUpperCase() || "US";
  const limit = parseInt((req.query.limit as string) || "5", 10);
  return getUpcomingHolidaysForCountry(country as any, limit);
}));

app.get("/api/v1/holidays/year", H("/api/v1/holidays/year", 86400, (req: any) => {
  const country = (req.query.country as string)?.toUpperCase() || "US";
  const all = getHolidaysForCountry(country as any);
  // Filter to current year + next year
  const year = new Date().getFullYear();
  return all.filter((h) => h.date.startsWith(String(year)) || h.date.startsWith(String(year + 1)));
}));

// === POPULAR CITIES ===
app.get("/api/v1/popular/cities", H("/api/v1/popular/cities", 86400, (req: any) => {
  const limit = parseInt((req.query.limit as string) || "20", 10);
  return { cities: getPopularCities(limit) };
}));

app.get("/api/v1/popular/defaults", H("/api/v1/popular/defaults", 86400, (req: any) => {
  const countryCode = req.query.country as string | undefined;
  return { cities: getDefaultFavorites(countryCode) };
}));

// === QUOTES ===
app.get("/api/v1/quotes/random", H("/api/v1/quotes/random", 0, (req: any) => {
  const locale = (req.query.locale as string) || "en";
  const seed = req.query.seed as string | undefined;
  const tag = req.query.tag as string | undefined;
  const countryTag = req.query.country ? `country:${(req.query.country as string).toLowerCase()}` : undefined;
  const pool = locale === "en" ? QUOTES_EN : QUOTES_EN;
  const lastQuoteId = req.query.lastQuoteId as string | undefined;
  const quote = pickQuote({
    pool,
    lastQuoteId,
    now: new Date(),
    countryTag,
    isHoliday: req.query.isHoliday === "true",
  });
  return { ...quote, seed, locale };
}));

app.get("/api/v1/quotes/ranked", H("/api/v1/quotes/ranked", 60, (req: any) => {
  const locale = (req.query.locale as string) || "en";
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const countryTag = req.query.country ? `country:${(req.query.country as string).toLowerCase()}` : undefined;
  const excludeIds = String(req.query.exclude || "").split(",").filter(Boolean);
  const pool = locale === "en" ? QUOTES_EN : QUOTES_EN;
  const ranked = rankQuotes({ pool, countryTag, isHoliday: req.query.isHoliday === "true", excludeIds, limit });
  return { quotes: ranked };
}));

// === CLOCK SYNC ===
app.get("/api/v1/time/sync", H("/api/v1/time/sync", 0, (req: any, res: any) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  const clientNowMs = req.query.clientTime ? parseInt(req.query.clientTime as string, 10) : undefined;
  return getSyncResponse(clientNowMs);
}));

// === DST ===
app.get("/api/v1/dst", H("/api/v1/dst", 86400, (req: any) => {
  const tz = (req.query.tz as string) || "America/New_York";
  const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
  return dstInfo(tz, year);
}));

app.get("/api/v1/dst/upcoming", H("/api/v1/dst/upcoming", 86400, () => {
  return { changes: getUpcomingDstChanges() };
}));

// === EVENTS (sports + holidays + observances) ===
app.get("/api/v1/events/upcoming", H("/api/v1/events/upcoming", 3600, (req: any) => {
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const source = req.query.source as "sports" | "holiday" | "observance" | undefined;
  const country = req.query.country as string | undefined;
  return { events: getUpcomingEvents({ limit, source, country }) };
}));

app.get("/api/v1/events/next", H("/api/v1/events/next", 3600, () => {
  const event = getNextBigEvent();
  return { event };
}));

// === ON THIS DAY (Wikipedia wrapper) ===
app.get("/api/v1/onthisday", H("/api/v1/onthisday", 86400, async (req: any) => {
  const now = new Date();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
  const day = req.query.day ? parseInt(req.query.day as string, 10) : now.getDate();
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const feed = await fetchOnThisDay(month, day, limit);
  const headlines = selectHeadlines(feed);
  return {
    month,
    day,
    headlines: {
      events: headlines.events.map(formatOnThisDay),
      births: headlines.births.map(formatOnThisDay),
      deaths: headlines.deaths.map(formatOnThisDay),
    },
    attribution: feed.attribution,
  };
}));

// === COMPOSITE: hero snapshot ===
app.get("/api/v1/browse/home", H("/api/v1/browse/home", 60, async (req: any) => {
  const userCountry = req.query.country as string | undefined;
  return await buildBrowseHome({ userCountryCode: userCountry });
}));

// === Currency APIs (Phase A of admin/currency track) ====================
// Wraps European Central Bank eurofxref daily feed (CC-BY 4.0).
// Currencies: 33 ISO 4217 codes; base EUR + cross-rate math for USD users.
import {
  fetchLatestRates as fetchLatestCurrencyRates,
  convertCurrency,
  getAllRatesAgainstBase,
  CURRENCIES,
} from "./src/utils/currencyApi";

app.get("/api/v1/currency/rates", H("/api/v1/currency/rates", 3600, async (req: any) => {
  const base = ((req.query.base as string) || "USD").toUpperCase();
  if (!CURRENCIES.some((c) => c.code === base)) {
    throw new Error(`Unsupported base currency: ${base}`);
  }
  return await getAllRatesAgainstBase(base);
}));

app.get(
  "/api/v1/currency/convert",
  H("/api/v1/currency/convert", 300, async (req: any) => {
    const amount = Number(req.query.amount);
    const from = ((req.query.from as string) || "USD").toUpperCase();
    const to = ((req.query.to as string) || "EUR").toUpperCase();
    if (!Number.isFinite(amount)) throw new Error("`amount` must be a number");
    return await convertCurrency({ amount, from, to });
  })
);

app.get("/api/v1/currency/codes", H("/api/v1/currency/codes", 86400, () => CURRENCIES));

// === Wikipedia enrichment APIs (Phase B) ================================
// News (RSS-driven) and country-specific history. Public, cached 15 min
// for news, 1 day for history (Wikipedia refresh cadence).
import {
  newsByCountry,
  newsByCategory,
  newsGlobal,
  _internalClearNewsCache,
  listFeeds,
} from "./src/utils/newsApi";
import { historyByCountry, listSupportedCountries as listHistoryCountries } from "./src/utils/countryHistoryApi";

app.get("/api/v1/news/by-country", H("/api/v1/news/by-country", 900, async (req: any) => {
  const country = (req.query.country as string) || "US";
  const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 12, 30));
  return await newsByCountry(country, limit);
}));

app.get("/api/v1/news/by-category", H("/api/v1/news/by-category", 900, async (req: any) => {
  const category = (req.query.category as string) || "world";
  const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 12, 30));
  return await newsByCategory(category, limit);
}));

app.get("/api/v1/news/global", H("/api/v1/news/global", 900, async (req: any) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 20, 50));
  return await newsGlobal(limit);
}));

app.get("/api/v1/news/feeds", H("/api/v1/news/feeds", 3600, () => ({
  feeds: listFeeds(),
  count: listFeeds().length,
})));

app.get(
  "/api/v1/history/by-country",
  H("/api/v1/history/by-country", 86400, async (req: any) => {
    const country = (req.query.country as string) || "US";
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const day = req.query.day ? parseInt(req.query.day as string) : undefined;
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 12, 50));
    return await historyByCountry({ country, month, day, limit });
  })
);

app.get(
  "/api/v1/history/countries",
  H("/api/v1/history/countries", 86400, () => listHistoryCountries())
);

// === Setup Vite Dev server or static asset production build
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      envDir: process.cwd(),
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static files...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
});
