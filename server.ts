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

// Setup Vite Dev server or static asset production build
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
