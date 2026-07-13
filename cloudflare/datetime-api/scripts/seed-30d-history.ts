// scripts/seed-30d-history.ts
// One-shot script to seed 30 days of daily rates for all 33×32 ECB pairs
// into D1's currency_rates_history table. Unblocks the A3 chart gap
// (sparkline data for the /currency page pair detail view).
//
// Run: npx wrangler d1 execute timeanddatepro-full --env dev --remote --file=db/seed/0005_history_30d_seed.sql
// Or: npx tsx scripts/seed-30d-history.ts | wrangler d1 execute ... --command="$(cat)"
//
// Frankfurter's /v1/{start}..{end}?base=USD endpoint returns all quotes
// for a date range in one call. We loop over 33 base currencies.

import { writeFileSync } from "node:fs";

const FRANKFURTER = "https://api.frankfurter.dev/v1";
const DAYS = 30;

const CODES = [
  "USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "CNY", "HKD", "NZD",
  "SEK", "KRW", "SGD", "NOK", "MXN", "INR", "BRL", "ZAR", "TRY", "PLN",
  "DKK", "THB", "IDR", "HUF", "CZK", "ILS", "CLP", "PHP", "AED", "COP",
  "SAR", "MYR", "RON"
];

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const end = new Date();
  const start = new Date(end.getTime() - DAYS * 24 * 3600 * 1000);
  const startStr = fmtDate(start);
  const endStr = fmtDate(end);

  const now = Math.floor(Date.now() / 1000);
  const lines: string[] = [];
  lines.push(`-- Generated 30-day history for all 33×32 ECB pairs`);
  lines.push(`-- Date range: ${startStr} to ${endStr}`);
  lines.push(`-- Generated at: ${new Date(now * 1000).toISOString()}`);
  lines.push("");

  let totalRows = 0;
  let successBases = 0;
  let failedBases: string[] = [];

  for (const base of CODES) {
    const url = `${FRANKFURTER}/${startStr}..${endStr}?base=${base}`;
    process.stdout.write(`Fetching ${base} ... `);
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) {
        console.log(`HTTP ${r.status} — skipping`);
        failedBases.push(base);
        continue;
      }
      const j: any = await r.json();
      const rates = j.rates || {};
      let baseRows = 0;
      // Self-rate (1.0)
      lines.push(`INSERT OR REPLACE INTO currency_rates_history (base, quote, date, rate, source, fetched_at) VALUES ('${base}','${base}','${endStr}',1,'frankfurter',${now});`);
      baseRows++;
      // All quotes per date
      for (const [date, quotes] of Object.entries(rates)) {
        // Self-rate for the date
        lines.push(`INSERT OR REPLACE INTO currency_rates_history (base, quote, date, rate, source, fetched_at) VALUES ('${base}','${base}','${date}',1,'frankfurter',${now});`);
        baseRows++;
        for (const [quote, rate] of Object.entries(quotes as Record<string, number>)) {
          if (quote === base) continue;
          lines.push(`INSERT OR REPLACE INTO currency_rates_history (base, quote, date, rate, source, fetched_at) VALUES ('${base}','${quote}','${date}',${rate},'frankfurter',${now});`);
          baseRows++;
        }
      }
      totalRows += baseRows;
      successBases++;
      console.log(`${baseRows} rows`);
    } catch (e: any) {
      console.log(`error: ${e.message || "fetch failed"}`);
      failedBases.push(base);
    }
  }

  // Write the SQL file
  const outPath = "db/seed/0005_history_30d_seed.sql";
  writeFileSync(outPath, lines.join("\n") + "\n");
  console.log("");
  console.log(`✓ Wrote ${totalRows} rows to ${outPath}`);
  console.log(`  Success: ${successBases}/${CODES.length} base currencies`);
  if (failedBases.length > 0) {
    console.log(`  Failed: ${failedBases.join(", ")}`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
