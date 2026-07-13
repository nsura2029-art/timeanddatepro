// scripts/seed-all-pairs.ts
// One-shot script to seed all 33×33 = 1,089 ECB pair combinations into D1.
// Run via: npx wrangler d1 execute timeanddatepro-full --env dev --remote --file=db/seed/0004_all_pairs_seed.sql
// OR generate the SQL dynamically and pipe it.
//
// This script generates the SQL dynamically from Frankfurter data. It's
// run once for the initial seed; a cron Worker takes over afterwards.

import { writeFileSync } from "node:fs";

const FRANKFURTER = "https://api.frankfurter.dev/v1";
const CODES = [
  "USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "CNY", "HKD", "NZD",
  "SEK", "KRW", "SGD", "NOK", "MXN", "INR", "BRL", "ZAR", "TRY", "PLN",
  "DKK", "THB", "IDR", "HUF", "CZK", "ILS", "CLP", "PHP", "AED", "COP",
  "SAR", "MYR", "RON"
];

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const expires = now + 24 * 3600;
  const lines: string[] = [];
  lines.push(`-- Generated ${CODES.length}×${CODES.length} = ${CODES.length * CODES.length} pair rows`);
  lines.push(`-- At ${new Date(now * 1000).toISOString()}`);
  lines.push("");

  for (const base of CODES) {
    console.log(`Fetching rates for base=${base}...`);
    const r = await fetch(`${FRANKFURTER}/latest?base=${base}`);
    if (!r.ok) {
      console.error(`  HTTP ${r.status} — skipping ${base}`);
      continue;
    }
    const j: any = await r.json();
    const rates = j.rates || {};
    // Self-rate
    lines.push(`INSERT OR REPLACE INTO currency_rates_latest (base, quote, rate, source, fetched_at, expires_at) VALUES ('${base}','${base}',1,'frankfurter',${now},${expires});`);
    // All other rates
    for (const [quote, rate] of Object.entries(rates)) {
      lines.push(`INSERT OR REPLACE INTO currency_rates_latest (base, quote, rate, source, fetched_at, expires_at) VALUES ('${base}','${quote}',${rate},'frankfurter',${now},${expires});`);
    }
  }

  const out = lines.join("\n") + "\n";
  writeFileSync("db/seed/0004_all_pairs_seed.sql", out);
  console.log(`\nWrote db/seed/0004_all_pairs_seed.sql (${out.length} bytes, ${lines.length} statements)`);
  console.log(`\nApply with:`);
  console.log(`  npx wrangler d1 execute timeanddatepro-full --env dev --remote --file=db/seed/0004_all_pairs_seed.sql`);
}

main().catch((e) => { console.error(e); process.exit(1); });
