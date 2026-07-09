// src/pages/docs/content/CurlSdk.tsx
// /docs/sdks/curl — quick reference for raw HTTP usage.

import React from "react";

const RECIPES: { title: string; cmd: string; desc: string }[] = [
  { title: "Live time in Tokyo", cmd: `curl "https://timeanddatepro.com/api/v1/time/now?city=TYO"`, desc: "Returns the current time + ISO string + UTC offset." },
  { title: "Convert 15:00 NYC → TYO", cmd: `curl "https://timeanddatepro.com/api/v1/time/convert?from=NYC&to=TYO&time=15%3A00&date=2026-07-08"`, desc: "Wall-clock 15:00 in NYC on July 8, 2026 → equivalent in Tokyo." },
  { title: "Business-day diff", cmd: `curl "https://timeanddatepro.com/api/v1/time/diff?from=2026-01-01&to=2026-12-31&mode=business&country=US"`, desc: "Working-day count minus US federal holidays." },
  { title: "Unix → ISO", cmd: `curl "https://timeanddatepro.com/api/v1/time/unix?value=1718370000&direction=to_date"`, desc: "Convert epoch to ISO 8601." },
  { title: "City list", cmd: `curl "https://timeanddatepro.com/api/v1/cities" | jq '.data | length"'`, desc: "Returns ~80 cities with timezone + IATA alias." },
  { title: "US holidays for 2026", cmd: `curl "https://timeanddatepro.com/api/v1/countries/US/holidays?year=2026"`, desc: "Federal + observance holidays." },
  { title: "Best meeting slot", cmd: `curl "https://timeanddatepro.com/api/v1/meeting/best?cities=NYC,LDN,TYO"`, desc: "Top overlap hours ranked by score." },
];

export default function CurlSdk() {
  return (
    <article className="max-w-none">
      <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900">
        cURL quick reference
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        Copy-paste snippets for every endpoint. Pipe through <code className="font-mono">jq</code> for pretty output.
        All endpoints are reachable as plain GETs — no auth, no SDK required.
      </p>

      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-[16px] font-bold text-slate-900">Base URL</h2>
        <code className="mt-2 inline-block rounded bg-white px-3 py-2 font-mono text-[13px] font-bold text-indigo-700 border border-slate-200">
          https://timeanddatepro.com/api/v1
        </code>
        <p className="mt-3 text-[13px] text-slate-600">
          Local dev override: <code className="font-mono">http://localhost:3000/api/v1</code>
        </p>
      </section>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Recipes</h2>
      <div className="mt-4 space-y-4">
        {RECIPES.map((r) => (
          <div key={r.title} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-[13px] font-bold uppercase tracking-wider text-indigo-600">{r.title}</div>
              <div className="mt-1 text-[13px] text-slate-600">{r.desc}</div>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-slate-800 bg-slate-50/40 rounded-b-xl">
              <code>{r.cmd}</code>
            </pre>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Pretty-printing tips</h2>
      <ul className="mt-3 list-disc pl-5 text-[14px] text-slate-700 space-y-1.5">
        <li>Pipe responses through <code className="font-mono">jq</code> to extract fields:</li>
      </ul>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-[12.5px] leading-relaxed text-slate-100">
{`# Just the time + city
curl -s "https://timeanddatepro.com/api/v1/cities/TYO" | jq '.data | {city: .name, time: .currentTime.time}'`}
      </pre>
    </article>
  );
}
