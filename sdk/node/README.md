# @timeanddatepro/sdk

Official Node.js client for the [TimeAndDatePro](https://timeanddatepro.com) REST API.
Time-zone conversion, meeting planning, holidays, working hours, date arithmetic — all in
one tiny **zero-dependency** package.

> **Zero dependencies.** Built on the native `fetch` API (Node 18+). No axios, no got, no node-fetch.

---

## Installation

```bash
npm install @timeanddatepro/sdk
# or
pnpm add @timeanddatepro/sdk
yarn add @timeanddatepro/sdk
```

Requires Node.js 18.0.0 or later.

---

## Quick start

```ts
import { TimeAndDatePro } from "@timeanddatepro/sdk";

// Free tier — no signup, generous rate limits
const client = new TimeAndDatePro();

// Pro tier — higher rate limits + private endpoints (coming soon)
const pro = new TimeAndDatePro({ apiKey: process.env.TDP_API_KEY });
```

---

## Tools

The client mirrors the API namespaces. One method per tool.

### `client.time.*` — time and date math

```ts
// Live clock in any timezone (by IANA or city alias)
await client.time.now({ city: "TYO" });
// → { tz: "Asia/Tokyo", date: "2026-07-09", time: "08:00:00", utcOffset: "+09:00", ... }

// Convert wall-clock time between zones
await client.time.convert({ from: "NYC", to: "TYO", time: "15:00", date: "2026-07-08" });
// → { from: { time: "15:00:00", ... }, to: { time: "04:00:00", date: "2026-07-09", ... },
//     differenceHours: 13 }

// Days between two dates (calendar or business)
await client.time.diff({ from: "2026-01-01", to: "2026-12-31", mode: "business", country: "US" });
// → { calendarDays: 364, businessDays: 251, ... }

// Add/subtract days, with optional business-day mode
await client.time.add({ date: "2026-07-08", days: 30, business: true, country: "US" });
// → { input: "2026-07-08", output: "2026-08-19", business: true }

// Epoch <-> ISO
await client.time.unix({ value: 1717891200, direction: "to_date" });
// → { iso: "2024-06-09T00:00:00.000Z", utc: "Sun, 09 Jun 2024 00:00:00 GMT", ... }

// Format a date in 6 standard ways
await client.time.iso({ date: "2026-07-08", format: "rfc3339", tz: "America/New_York" });
// → { format: "RFC 3339", output: "2026-07-08T00:00:00-04:00" }

// Localized natural language
await client.time.words({ date: "2026-07-08", lang: "zh" });
// → { output: "2026年七月8日 星期三", ... }
```

### `client.meeting.*` — global meeting planner

```ts
const result = await client.meeting.best({
  cities: ["NYC", "LDN", "TYO"],
  workingStart: 9,
  workingEnd: 17,
});

for (const slot of result.topSlots) {
  console.log(`UTC ${slot.utcHour}:00 — score ${(slot.score * 100).toFixed(0)}%`);
  for (const c of slot.perCity) console.log(`  ${c.city}: ${c.localTime}`);
}
```

### `client.countries.*` — holidays and working hours

```ts
// All holidays for a country in a year
await client.countries.holidays("US", 2026);
// → { country: "US", year: 2026, holidays: [{ name: "New Year's Day", date: "2026-01-01", ... }, ...] }

// Working-day stats
await client.countries.workingHours("FR", { year: 2026, hoursPerDay: 8 });
// → { country: "FR", workingDays: 252, totalHours: 2016, holidays: 11 }
```

### `client.cities.*` — city directory

```ts
await client.cities.list();
// → [{ timezone, name, country, code }, ...]

await client.cities.get("tokyo");
// → { timezone: "Asia/Tokyo", name: "Tokyo", country: "Japan", code: "TYO",
//     currentTime: { date: "2026-07-09", time: "08:00:00", ... } }
```

### `client.pairs.*` — city pair (programmatic SEO backbone)

```ts
await client.pairs.get("est", "ist");
// → { from: { city, tz, time, ... }, to: { city, tz, time, ... },
//     differenceHours: 9.5, bestTimeToCall: { ... } }
```

---

## Configuration

```ts
new TimeAndDatePro({
  baseUrl: "http://localhost:3000",       // default: https://timeanddatepro.com
  apiKey: "tdp_live_xxx",                  // optional, for higher rate limits
  timeout: 5000,                           // ms, default 10s
  headers: { "X-Caller": "my-app/1.0" },   // extra headers
  fetch: customFetch,                      // override for testing / proxies
});
```

---

## Error handling

All errors thrown by the SDK extend `ApiClientError`:

```ts
import { TimeAndDatePro, ApiClientError } from "@timeanddatepro/sdk";

try {
  await client.time.now({ city: "atlantis" });
} catch (e) {
  if (e instanceof ApiClientError) {
    console.error(`${e.status} ${e.code}: ${e.message}`);
    // → 404 UNKNOWN_CITY: No timezone/city matches "atlantis".
  }
}
```

| HTTP status | code              | meaning                          |
|-------------|-------------------|----------------------------------|
| 400         | `BAD_*`           | Invalid parameter format         |
| 404         | `UNKNOWN_CITY`    | City/alias not in our registry   |
| 404         | `UNKNOWN_COUNTRY` | Country code not supported       |
| 408         | `TIMEOUT`         | Request exceeded `timeout` ms    |
| 0           | `NETWORK`         | Connection failed / DNS / etc.   |

---

## TypeScript

The package ships full TypeScript declarations. All public types are exported:

```ts
import type {
  TimeSnapshot, ConvertResult, DiffResult, AddResult,
  UnixResult, IsoResult, WordsResult,
  City, Country, Holiday,
  MeetingSlot, MeetingResult, PairResult,
} from "@timeanddatepro/sdk";
```

---

## Endpoints

| SDK method                          | REST endpoint                              |
|-------------------------------------|--------------------------------------------|
| `client.time.now(p)`                | `GET /api/v1/time/now`                     |
| `client.time.convert(p)`            | `GET /api/v1/time/convert`                 |
| `client.time.diff(p)`               | `GET /api/v1/time/diff`                    |
| `client.time.add(p)`                | `GET /api/v1/time/add`                     |
| `client.time.unix(p)`               | `GET /api/v1/time/unix`                    |
| `client.time.iso(p)`                | `GET /api/v1/time/iso`                     |
| `client.time.words(p)`              | `GET /api/v1/time/words`                   |
| `client.cities.list()`              | `GET /api/v1/cities`                       |
| `client.cities.get(slug)`           | `GET /api/v1/cities/:slug`                 |
| `client.countries.list()`           | `GET /api/v1/countries`                    |
| `client.countries.get(code)`        | `GET /api/v1/countries/:code`              |
| `client.countries.holidays(code,y)` | `GET /api/v1/countries/:code/holidays`     |
| `client.countries.workingHours(c)`  | `GET /api/v1/countries/:code/working-hours`|
| `client.pairs.get(a,b)`             | `GET /api/v1/pairs/:from/:to`              |
| `client.meeting.best(p)`            | `GET /api/v1/meeting/best`                 |

---

## License

MIT (c) TimeAndDatePro
