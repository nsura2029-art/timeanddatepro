// src/routes/dateToWord.ts
// Date to Words thin API endpoints (Phase 6).
//
//   POST /api/v1/tools/date-to-word/bulk
//     Body: { dates: string[], format: "formal"|"legal"|"banking"|"casual"|"british" }
//     Response: { results: [{ date, words, format }] }
//     Capped at 100 dates per request. Server-side conversion via the
//     same converter used by the client. Also logs to captures for
//     analytics (how many users hit the bulk endpoint).
//
//   GET /api/v1/tools/date-to-word/translate
//     Query: ?date=YYYY-MM-DD&format=legal&lang=fr
//     Response: { status: "not_available", available: [...], message }
//     Translation is a future feature. For now, returns a clear
//     "coming soon" payload + logs the interest to waitlist/captures
//     so we can prioritize the roadmap.
//
//   GET /api/v1/tools/date-to-word/formats
//     Response: { formats: ["formal", "legal", "banking", "casual", "british"], examples: {...} }
//     Lists the 5 supported formats with one example each.

import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { ok, err } from "../lib/responses";
import { convertDateToWords, getAllFormats } from "../lib/dateToWords/converter";

type Bindings = { DB: D1Database };
const dateToWord = new Hono<{ Bindings: Bindings }>();

const SUPPORTED_FORMATS = ["formal", "legal", "banking", "casual", "british"] as const;
type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

const FORMAT_EXAMPLES: Record<SupportedFormat, string> = {
  formal:  "Eleventh of July, Two Thousand Twenty-Six",
  legal:   "Eleventh day of July, Two Thousand Twenty-Six",
  banking: "Eleventh July, Two Thousand Twenty-Six",
  casual:  "July eleventh, two thousand twenty-six",
  british: "Eleventh day of July, Two Thousand and Twenty-Six",
};

function isSupportedFormat(s: string): s is SupportedFormat {
  return (SUPPORTED_FORMATS as readonly string[]).includes(s);
}

/** POST /api/v1/tools/date-to-word/bulk */
dateToWord.post("/bulk", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return err(c, 400, "Invalid JSON body", "invalid_json");
  }
  const dates = Array.isArray(body?.dates) ? body.dates : null;
  const format: string = typeof body?.format === "string" ? body.format : "legal";
  if (!dates) {
    return err(c, 400, "dates array required", "invalid_dates");
  }
  if (dates.length === 0) {
    return err(c, 400, "dates array must not be empty", "empty_dates");
  }
  if (dates.length > 100) {
    return err(c, 400, "max 100 dates per request", "too_many_dates");
  }
  if (!isSupportedFormat(format)) {
    return err(c, 400, `format must be one of: ${SUPPORTED_FORMATS.join(", ")}`, "invalid_format");
  }
  const results: { date: string; words: string; format: string; error?: string }[] = [];
  for (const dateStr of dates) {
    if (typeof dateStr !== "string") {
      results.push({ date: String(dateStr), words: "", format, error: "date must be string" });
      continue;
    }
    try {
      const out = convertDateToWords({ dateString: dateStr, format });
      results.push({ date: out.dateString, words: out[format as keyof typeof out] as string, format });
    } catch (e: any) {
      results.push({ date: dateStr, words: "", format, error: e?.message || "conversion_failed" });
    }
  }
  // Log to captures for analytics (fire-and-forget — don't block response)
  const now = Math.floor(Date.now() / 1000);
  c.executionCtx?.waitUntil(
    c.env.DB.prepare(
      `INSERT INTO captures (type, payload, tool, created_at) VALUES (?1, ?2, ?3, ?4)`,
    ).bind("bulk_convert", JSON.stringify({ count: dates.length, format }), "date-to-word", now).run()
  );
  return ok(c, {
    count: results.length,
    successCount: results.filter(r => !r.error).length,
    format,
    results,
  });
});

/** GET /api/v1/tools/date-to-word/translate */
dateToWord.get("/translate", async (c) => {
  const date = c.req.query("date");
  const format = c.req.query("format") || "legal";
  const lang = c.req.query("lang") || "fr";
  if (!date) {
    return err(c, 400, "date query param required (YYYY-MM-DD)", "invalid_date");
  }
  if (!isSupportedFormat(format)) {
    return err(c, 400, `format must be one of: ${SUPPORTED_FORMATS.join(", ")}`, "invalid_format");
  }
  // Compute the English version so the user sees what they asked for
  let englishWords = "";
  try {
    const out = convertDateToWords({ dateString: date, format: format as SupportedFormat });
    englishWords = out[format as SupportedFormat];
  } catch (e: any) {
    return err(c, 400, e?.message || "conversion_failed", "invalid_date");
  }
  // Log the translation interest (fire-and-forget)
  const now = Math.floor(Date.now() / 1000);
  c.executionCtx?.waitUntil(
    c.env.DB.prepare(
      `INSERT INTO captures (type, payload, tool, created_at) VALUES (?1, ?2, ?3, ?4)`,
    ).bind("translate", JSON.stringify({ date, format, lang }), "date-to-word", now).run()
  );
  return ok(c, {
    status: "not_available",
    available: ["en"],
    requested: { date, format, lang },
    english: englishWords,
    message: `Translation to "${lang}" is not yet available. We're rolling out languages based on waitlist demand.`,
    joinWaitlist: `/feedback?type=suggestion&tool=date-words&interest=locale&locale=${encodeURIComponent(lang)}`,
  });
});

/** GET /api/v1/tools/date-to-word/formats */
dateToWord.get("/formats", (c) => {
  return ok(c, {
    formats: SUPPORTED_FORMATS,
    examples: FORMAT_EXAMPLES,
    default: "legal",
  });
});

/** GET /api/v1/tools/date-to-word/preview?date=2026-07-11 */
dateToWord.get("/preview", (c) => {
  const date = c.req.query("date");
  if (!date) {
    return err(c, 400, "date query param required (YYYY-MM-DD)", "invalid_date");
  }
  try {
    const all = getAllFormats(date);
    return ok(c, { date, formats: all });
  } catch (e: any) {
    return err(c, 400, e?.message || "conversion_failed", "invalid_date");
  }
});

export { dateToWord as dateToWordRouter };
