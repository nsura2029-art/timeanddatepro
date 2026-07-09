// src/pages/docs/content/Introduction.tsx
// /docs/getting-started/introduction — the front door of the docs site.

import React from "react";
import CodeTabs from "../../../components/docs/CodeTabs";

export default function Introduction() {
  return (
    <article className="prose-doc max-w-none">
      <header>
        <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          v1.0 · Stable
        </span>
        <h1 className="mt-3 text-[36px] font-extrabold leading-tight tracking-tight text-slate-900">
          TimeAndDatePro API documentation
        </h1>
        <p className="mt-3 text-[18px] leading-relaxed text-slate-600">
          15 REST endpoints and a zero-dependency Node.js SDK for everything we do on the
          time-and-date workspace — timezone conversion, meeting planning, holiday calendars,
          and date arithmetic.
        </p>
      </header>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <a href="/docs/getting-started/quickstart" className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm.75 4.5a.75.75 0 0 0-1.5 0v3.5l-2.5 2.5a.75.75 0 0 0 1.06 1.06l2.72-2.72A.75.75 0 0 0 10.75 10V6.5z"/></svg>
          </div>
          <h3 className="mt-3 text-[16px] font-bold text-slate-900 group-hover:text-indigo-600">
            Quickstart →
          </h3>
          <p className="mt-1 text-[13px] text-slate-600">
            Install the SDK and make your first call in under 2 minutes.
          </p>
        </a>
        <a href="/docs/api-reference/overview" className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M4 4h12v3H4zM4 9h12v3H4zm0 5h8v3H4z"/></svg>
          </div>
          <h3 className="mt-3 text-[16px] font-bold text-slate-900 group-hover:text-indigo-600">
            API Reference →
          </h3>
          <p className="mt-1 text-[13px] text-slate-600">
            Every endpoint documented with request, params, response.
          </p>
        </a>
        <a href="/docs/sdks/nodejs" className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 2 2.5 5v6L10 14l7.5-3V5L10 2zm0 9.5L4 9V6.5l6 2.5 6-2.5V9l-6 2.5z"/></svg>
          </div>
          <h3 className="mt-3 text-[16px] font-bold text-slate-900 group-hover:text-indigo-600">
            Node.js SDK →
          </h3>
          <p className="mt-1 text-[13px] text-slate-600">
            Zero-dependency client, full TypeScript, native fetch.
          </p>
        </a>
      </section>

      <section className="mt-12">
        <h2 className="text-[22px] font-bold text-slate-900">What you can build</h2>
        <p className="mt-2 text-[15px] text-slate-700">
          The same engine that runs every tool on timeanddatepro.com — exposed as a stateless HTTP service.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { t: "Time-zone converters", d: "15:00 NYC → 04:00 TYO, today, with DST honored." },
            { t: "Meeting planners",     d: "Top overlap slots across NYC, LDN, TYO with score." },
            { t: "Holiday calendars",    d: "US/GB/FR/DE/JP/... federal + observances by year." },
            { t: "Working-day calculator", d: "Business-day diff or add/sub, holiday-aware." },
            { t: "Unix / ISO tools",     d: "Bidirectional epoch conversion + 6 ISO formats." },
            { t: "Programmatic SEO",     d: "/<from>-to-<to> pages powered by /api/v1/pairs." },
          ].map((x) => (
            <li key={x.t} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-[14px] font-bold text-slate-900">{x.t}</div>
              <div className="mt-1 text-[13px] text-slate-600">{x.d}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-[22px] font-bold text-slate-900">Hello world</h2>
        <p className="mt-2 text-[15px] text-slate-700">
          The simplest thing you can do with the API — return the current time in Tokyo.
          See <a href="/docs/getting-started/quickstart" className="font-bold text-indigo-600 hover:underline">Quickstart</a> for a step-by-step walk-through.
        </p>
        <div className="mt-4">
          <CodeTabs
            samples={[
              {
                lang: "node",
                label: "Node.js",
                code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const tokyo = await client.time.now({ city: "TYO" });
console.log(\`It is \${tokyo.time} (\${tokyo.utcOffset}) in \${tokyo.tz}.\`);
// → "It is 12:14:09 (+09:00) in Asia/Tokyo."`,
              },
              {
                lang: "curl",
                label: "cURL",
                code: `curl https://timeanddatepro.com/api/v1/time/now?city=TYO`,
              },
            ]}
          />
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">
        <h2 className="text-[20px] font-bold text-slate-900">Base URL</h2>
        <p className="mt-2 text-[14px] text-slate-700">
          Every endpoint lives under:
        </p>
        <code className="mt-3 inline-block rounded-md bg-white px-3 py-2 font-mono text-[14px] font-bold text-indigo-700 border border-indigo-100">
          https://timeanddatepro.com/api/v1/&lt;resource&gt;
        </code>
        <p className="mt-3 text-[13px] text-slate-600">
          Local development? Use <code className="font-mono">http://localhost:3000/api/v1/</code> while the dev server is running.
        </p>
      </section>
    </article>
  );
}
