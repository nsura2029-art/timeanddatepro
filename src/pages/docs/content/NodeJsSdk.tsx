// src/pages/docs/content/NodeJsSdk.tsx
// /docs/sdks/nodejs — full SDK reference.

import React from "react";
import CodeTabs from "../../../components/docs/CodeTabs";

export default function NodeJsSdk() {
  return (
    <article className="max-w-none">
      <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        NEW in v0.1.0
      </span>
      <h1 className="mt-3 text-[34px] font-extrabold tracking-tight text-slate-900">
        Node.js SDK
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        <code className="font-mono">@timeanddatepro/sdk</code> is the official Node.js client.
        Zero dependencies, native <code className="font-mono">fetch</code>, TypeScript-first.
      </p>

      <section className="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5">
        <h2 className="text-[18px] font-bold text-slate-900">At a glance</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3 text-[13px] text-slate-700">
          <li className="rounded-lg bg-white p-3 border border-slate-200">
            <div className="font-bold text-slate-900">Zero deps</div>
            <div>Built on <code className="font-mono">fetch</code> only</div>
          </li>
          <li className="rounded-lg bg-white p-3 border border-slate-200">
            <div className="font-bold text-slate-900">Strict TypeScript</div>
            <div>Full <code className="font-mono">.d.ts</code> exports</div>
          </li>
          <li className="rounded-lg bg-white p-3 border border-slate-200">
            <div className="font-bold text-slate-900">Node 18+</div>
            <div>Native <code className="font-mono">AbortController</code> timeouts</div>
          </li>
        </ul>
      </section>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Install</h2>
      <div className="mt-3">
        <CodeTabs
          samples={[
            { lang: "node", label: "npm",   code: `npm install @timeanddatepro/sdk` },
            { lang: "node", label: "pnpm",  code: `pnpm add @timeanddatepro/sdk` },
            { lang: "node", label: "yarn",  code: `yarn add @timeanddatepro/sdk` },
          ]}
        />
      </div>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Construct a client</h2>
      <div className="mt-3">
        <CodeTabs
          samples={[
            {
              lang: "node",
              label: "Node.js",
              code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

// Default — hits https://timeanddatepro.com
const client = new TimeAndDatePro();

// Local dev
const dev = new TimeAndDatePro({ baseUrl: "http://localhost:3000" });

// Pro tier (Q3 2026) — uses Bearer auth internally
const pro = new TimeAndDatePro({ apiKey: process.env.TDP_API_KEY });

// Tune timeouts / proxies / custom fetch (testing)
const testing = new TimeAndDatePro({
  timeout: 5_000,
  fetch: globalThis.fetch,
  headers: { "X-Trace-Id": traceId },
});`,
            },
          ]}
        />
      </div>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Namespaces</h2>
      <p className="mt-2 text-[14px] text-slate-700">
        Every method maps 1-to-1 to a REST endpoint. Browse the full surface:
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          {
            ns: "time",
            desc: "Time & date math.",
            methods: ["now", "convert", "diff", "add", "unix", "iso", "words"],
            href: "/docs/api-reference/time/now",
          },
          {
            ns: "cities",
            desc: "City registry + live clocks.",
            methods: ["list", "get"],
            href: "/docs/api-reference/cities",
          },
          {
            ns: "countries",
            desc: "Country data, holidays, working hours.",
            methods: ["list", "get", "holidays", "workingHours"],
            href: "/docs/api-reference/countries",
          },
          {
            ns: "pairs",
            desc: "City-pair snapshots (programmatic SEO backbone).",
            methods: ["get(from, to)"],
            href: "/docs/api-reference/pairs/:from/:to",
          },
          {
            ns: "meeting",
            desc: "Best-overlap across multiple cities.",
            methods: ["best"],
            href: "/docs/api-reference/meeting/best",
          },
        ].map((n) => (
          <a key={n.ns} href={n.href} className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300">
            <div className="flex items-baseline justify-between">
              <code className="font-mono text-[14px] font-bold text-indigo-700">client.{n.ns}.*</code>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600">→</span>
            </div>
            <p className="mt-1 text-[13px] text-slate-600">{n.desc}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {n.methods.map((m) => (
                <code key={m} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">{m}</code>
              ))}
            </div>
          </a>
        ))}
      </div>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">A complete example</h2>
      <div className="mt-3">
        <CodeTabs
          samples={[
            {
              lang: "node",
              label: "Node.js",
              code: `import { TimeAndDatePro, ApiClientError } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

// 1) Live time anywhere
const tokyo = await client.time.now({ city: "TYO" });

// 2) Convert between zones (DST-aware)
const slot = await client.time.convert({
  from: "NYC",
  to: "TYO",
  time: "15:00",
  date: "2026-07-08",
});

// 3) Business-day math
const eta = await client.time.add({
  date: "2026-07-08",
  days: 14,
  business: true,
  country: "US",
});

// 4) Best meeting slot across 3 cities
const meeting = await client.meeting.best({
  cities: ["NYC", "LDN", "TYO"],
  start: 9,
  end: 17,
});
meeting.topSlots.slice(0, 3).forEach((s) => {
  console.log(\`\${s.utcHour}:00Z → score \${s.score.toFixed(2)}\`);
});`,
            },
          ]}
        />
      </div>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Error reference</h2>
      <p className="mt-2 text-[14px] text-slate-700">
        All non-success responses throw <code className="font-mono">ApiClientError</code>.
        See <a className="font-bold text-indigo-600 hover:underline" href="/docs/getting-started/errors">Errors</a> for the full status / code matrix.
      </p>
      <div className="mt-3">
        <CodeTabs
          samples={[
            {
              lang: "node",
              label: "Node.js",
              code: `import { TimeAndDatePro, ApiClientError } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro({ timeout: 5_000 });

try {
  const data = await client.time.now({ city: "FOOBAR" });
} catch (err) {
  if (err instanceof ApiClientError) {
    console.error(\`[api \${err.status} \${err.code}] \${err.message}\`);
  } else {
    throw err;
  }
}`,
            },
          ]}
        />
      </div>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Source &amp; types</h2>
      <p className="mt-2 text-[14px] text-slate-700">
        The package is tiny — one file, ~260 lines, fully readable. Browse or vendor the source:
      </p>
      <ul className="mt-3 list-disc pl-5 text-[14px] text-slate-700 space-y-1">
        <li><a className="font-bold text-indigo-600 hover:underline" href="https://github.com/nsura2029-art/timeanddatepro/tree/develop/sdk/node" target="_blank" rel="noopener noreferrer">Source on GitHub →</a></li>
        <li><a className="font-bold text-indigo-600 hover:underline" href="https://www.npmjs.com/package/@timeanddatepro/sdk" target="_blank" rel="noopener noreferrer">npm package →</a></li>
        <li>Types: <code className="font-mono">import type {`{ TimeSnapshot, ConvertResult, ... }`} from "@timeanddatepro/sdk"</code></li>
      </ul>
    </article>
  );
}
