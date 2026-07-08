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
