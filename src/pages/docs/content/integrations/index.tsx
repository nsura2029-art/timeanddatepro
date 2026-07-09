// src/pages/docs/content/integrations/index.tsx
// Per-tool integration pages. Each exports a default component that combines
// (a) one-paragraph intro about the corresponding web tool,
// (b) the exact JSX the user can drop into their app to reproduce it,
// (c) a LiveApiDemo widget that calls the endpoint from the browser.
//
// Adding a new tool = one entry below. The DocsPage router picks them up
// automatically via the integrations map.

import React from "react";
import CodeTabs from "../../../../components/docs/CodeTabs";
import LiveApiDemo from "../../../../components/docs/LiveApiDemo";

// Reuse the same shell for every integration so the docs feel cohesive.
export interface IntegrationShellProps {
  tool: string;             // "Time Zone Converter"
  apiEndpoint: string;      // "/api/v1/time/convert"
  apiSummary: string;       // one-paragraph abstract about the API
  sdkSnippet: string;       // Node.js client invocation
  cUrlSnippet: string;
  demoParams: { name: string; label: string; defaultValue?: string; options?: string[] }[];
  demoHighlights?: string[];  // dotted paths to highlight
  renderToolUi?: () => React.ReactNode; // optional mock UI snippet
}

export function IntegrationShell({
  tool, apiEndpoint, apiSummary, sdkSnippet, cUrlSnippet,
  demoParams, demoHighlights, renderToolUi,
}: IntegrationShellProps) {
  return (
    <article className="max-w-none">
      <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        Integration
      </span>
      <h1 className="mt-3 text-[34px] font-extrabold tracking-tight text-slate-900">
        {tool}
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        {apiSummary}
      </p>

      <section className="mt-8">
        <h2 className="text-[20px] font-bold text-slate-900">Live request</h2>
        <p className="mt-2 text-[14px] text-slate-700">
          Adjust the inputs and click <strong>Run request</strong> — the response is the same JSON your app would receive.
        </p>
        <div className="mt-4">
          <LiveApiDemo endpoint={apiEndpoint} params={demoParams} highlightFields={demoHighlights} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[20px] font-bold text-slate-900">Node.js SDK</h2>
        <div className="mt-3">
          <CodeTabs
            samples={[
              { lang: "node", label: "Node.js", code: sdkSnippet },
              { lang: "curl", label: "cURL", code: cUrlSnippet },
            ]}
          />
        </div>
      </section>

      {renderToolUi && (
        <section className="mt-10">
          <h2 className="text-[20px] font-bold text-slate-900">Render the same UI on timeanddatepro.com</h2>
          <p className="mt-2 text-[14px] text-slate-700">
            The web tool on our site consumes the same endpoint. Drop the snippet below into your own app to render an identical experience:
          </p>
          <div className="mt-4">{renderToolUi()}</div>
        </section>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Per-tool integrations
// ─────────────────────────────────────────────────────────────────────────

function TimeZoneConverter() {
  return (
    <IntegrationShell
      tool="Time Zone Converter"
      apiEndpoint="/api/v1/time/convert"
      apiSummary="Power the time-zone converter widget on your site with the same endpoint we use on timeanddatepro.com. Convert a wall-clock time between two zones — DST-aware, with IATA aliases."
      sdkSnippet={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// 15:00 New York → Tokyo on July 8, 2026
const result = await client.time.convert({
  from: "NYC",
  to: "TYO",
  time: "15:00",
  date: "2026-07-08",
});

console.log(\`\${result.from.time} \${result.from.city} → \${result.to.time} \${result.to.city}\`);
// → "15:00:00 New York → 04:00:00 Tokyo"
console.log(\`Hour difference: \${result.differenceHours}\`);`}
      cUrlSnippet={`curl "https://timeanddatepro.com/api/v1/time/convert?from=NYC&to=TYO&time=15%3A00&date=2026-07-08"`}
      demoParams={[
        { name: "from", label: "From city", defaultValue: "NYC" },
        { name: "to", label: "To city", defaultValue: "TYO" },
        { name: "time", label: "Time (HH:MM)", defaultValue: "15:00" },
        { name: "date", label: "Date (YYYY-MM-DD)", defaultValue: "2026-07-08" },
      ]}
      demoHighlights={["data.from.time", "data.to.time", "data.differenceHours"]}
    />
  );
}

function MeetingFinder() {
  return (
    <IntegrationShell
      tool="Meeting Finder"
      apiEndpoint="/api/v1/meeting/best"
      apiSummary="Our meeting-overlap engine: 24 candidate hours ranked by how many cities fall inside working hours. Used on the home page and the meeting-finder widget."
      sdkSnippet={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const result = await client.meeting.best({
  cities: ["NYC", "LDN", "TYO"],
  start: 9,        // working-hours start (per-city local)
  end: 17,         // working-hours end
  duration: 60,    // slot length in minutes
});

// Top 3 slots
result.topSlots.slice(0, 3).forEach((s) => {
  console.log(\`\${s.utcHour}:00Z → score \${s.score.toFixed(2)}\`);
});`}
      cUrlSnippet={`curl "https://timeanddatepro.com/api/v1/meeting/best?cities=NYC,LDN,TYO"`}
      demoParams={[
        { name: "cities", label: "Cities (comma-separated)", defaultValue: "NYC,LDN,TYO" },
        { name: "start", label: "Working-hours start", defaultValue: "9" },
        { name: "end", label: "Working-hours end", defaultValue: "17" },
      ]}
      demoHighlights={["data.workingHours", "data.topSlots"]}
    />
  );
}

function HolidayHours() {
  return (
    <IntegrationShell
      tool="Holiday & Hours"
      apiEndpoint="/api/v1/countries/US/holidays"
      apiSummary="Federal and observance holidays for the year, plus the working-day count and total hours."
      sdkSnippet={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// All US federal + observance holidays for 2026
const { holidays } = await client.countries.holidays("US", 2026);
holidays.forEach((h) => console.log(h.date, h.name, h.type));

// Working hours (8h/day default; override with hoursPerDay)
const hours = await client.countries.workingHours("US", { year: 2026, hoursPerDay: 8 });
console.log(\`\${hours.workingDays} working days → \${hours.totalHours} hours\`);`}
      cUrlSnippet={`curl "https://timeanddatepro.com/api/v1/countries/US/holidays?year=2026"
curl "https://timeanddatepro.com/api/v1/countries/US/working-hours?year=2026"`}
      demoParams={[
        { name: "year", label: "Year", defaultValue: "2026" },
      ]}
      demoHighlights={["data.holidays.length", "data.workingDays"]}
    />
  );
}

function UnixTimestamp() {
  return (
    <IntegrationShell
      tool="Unix Timestamp"
      apiEndpoint="/api/v1/time/unix"
      apiSummary="Bidirectional epoch ↔ ISO conversion. Auto-detects seconds vs milliseconds for the `to_date` direction."
      sdkSnippet={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// epoch → ISO
await client.time.unix({ value: "1718370000", direction: "to_date" });

// ISO → epoch
await client.time.unix({ value: "2026-07-08T15:00:00Z", direction: "to_unix" });`}
      cUrlSnippet={`curl "https://timeanddatepro.com/api/v1/time/unix?value=1718370000&direction=to_date"
curl "https://timeanddatepro.com/api/v1/time/unix?value=2026-07-08T15:00:00Z&direction=to_unix"`}
      demoParams={[
        { name: "value", label: "Value", defaultValue: "1718370000" },
        { name: "direction", label: "Direction", defaultValue: "to_date", options: ["to_date", "to_unix"] },
      ]}
      demoHighlights={["data.iso", "data.seconds"]}
    />
  );
}

function ISO8601Formatter() {
  return (
    <IntegrationShell
      tool="ISO 8601 Formatter"
      apiEndpoint="/api/v1/time/iso"
      apiSummary="Format any date as ISO 8601, RFC 3339, RFC 2822, ISO Week, ISO Ordinal Day, or ISO Basic. Optional timezone."
      sdkSnippet={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.time.iso({
  date: "2026-07-08",
  format: "rfc3339",
  tz: "America/New_York",
});
// → { input: "2026-07-08", format: "RFC 3339", output: "2026-07-07T20:00:00-04:00" }`}
      cUrlSnippet={`curl "https://timeanddatepro.com/api/v1/time/iso?date=2026-07-08&format=rfc3339&tz=America/New_York"`}
      demoParams={[
        { name: "date", label: "Date", defaultValue: "2026-07-08" },
        { name: "format", label: "Format", defaultValue: "rfc3339", options: ["8601", "rfc3339", "rfc2822", "week", "ordinal", "basic"] },
        { name: "tz", label: "Timezone", defaultValue: "America/New_York" },
      ]}
      demoHighlights={["data.output"]}
    />
  );
}

function DateMath() {
  return (
    <IntegrationShell
      tool="Date Math"
      apiEndpoint="/api/v1/time/add"
      apiSummary="Add or subtract years / months / weeks / days from a date. Business mode skips weekends + country holidays."
      sdkSnippet={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// 30 calendar days later
await client.time.add({ date: "2026-07-08", days: 30 });

// 14 business days later (skipping US holidays)
await client.time.add({
  date: "2026-07-08",
  days: 14,
  business: true,
  country: "US",
});`}
      cUrlSnippet={`curl "https://timeanddatepro.com/api/v1/time/add?date=2026-07-08&days=14&business=true&country=US"`}
      demoParams={[
        { name: "date", label: "Base date", defaultValue: "2026-07-08" },
        { name: "days", label: "Days (negative to subtract)", defaultValue: "14" },
        { name: "business", label: "Business mode", defaultValue: "true", options: ["true", "false"] },
        { name: "country", label: "Country", defaultValue: "US" },
      ]}
      demoHighlights={["data.output"]}
    />
  );
}

function DateDifference() {
  return (
    <IntegrationShell
      tool="Date Difference"
      apiEndpoint="/api/v1/time/diff"
      apiSummary="Days between two dates. Calendar mode returns years / months / days; business mode counts working days per country."
      sdkSnippet={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.time.diff({
  from: "2026-01-01",
  to: "2026-12-31",
  mode: "calendar",
});
// → { totalDays: 364, weeks: 52, remainingDays: 0, years: 0, months: 11, days: 30 }

await client.time.diff({
  from: "2026-01-01",
  to: "2026-12-31",
  mode: "business",
  country: "US",
});
// → { businessDays: 251 }`}
      cUrlSnippet={`curl "https://timeanddatepro.com/api/v1/time/diff?from=2026-01-01&to=2026-12-31&mode=business&country=US"`}
      demoParams={[
        { name: "from", label: "From date", defaultValue: "2026-01-01" },
        { name: "to", label: "To date", defaultValue: "2026-12-31" },
        { name: "mode", label: "Mode", defaultValue: "business", options: ["calendar", "business"] },
        { name: "country", label: "Country (business mode only)", defaultValue: "US" },
      ]}
      demoHighlights={["data.totalDays", "data.businessDays"]}
    />
  );
}

function DateToWords() {
  return (
    <IntegrationShell
      tool="Date to Words"
      apiEndpoint="/api/v1/time/words"
      apiSummary="Natural-language date strings in English, French, Chinese, and Japanese. Useful for emails, calendar invites, and accessibility."
      sdkSnippet={`import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

await client.time.words({ date: "2026-07-08", lang: "fr" });
// → { input: "2026-07-08", lang: "fr", output: "mercredi 8 juillet 2026", iso: "..." }`}
      cUrlSnippet={`curl "https://timeanddatepro.com/api/v1/time/words?date=2026-07-08&lang=fr"`}
      demoParams={[
        { name: "date", label: "Date", defaultValue: "2026-07-08" },
        { name: "lang", label: "Language", defaultValue: "fr", options: ["en", "fr", "zh", "ja"] },
      ]}
      demoHighlights={["data.output"]}
    />
  );
}

export const integrations: Record<string, React.ComponentType> = {
  "time-zone-converter": TimeZoneConverter,
  "meeting-finder":       MeetingFinder,
  "holiday-hours":        HolidayHours,
  "unix-timestamp":       UnixTimestamp,
  "iso8601-formatter":    ISO8601Formatter,
  "date-math":            DateMath,
  "date-difference":      DateDifference,
  "date-to-words":        DateToWords,
};
