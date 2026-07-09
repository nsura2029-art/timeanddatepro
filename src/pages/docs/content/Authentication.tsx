// src/pages/docs/content/Authentication.tsx
// /docs/getting-started/authentication — auth tiers, rate limits, key delivery.

import React from "react";
import CodeTabs from "../../../components/docs/CodeTabs";

export default function Authentication() {
  return (
    <article className="max-w-none">
      <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900">
        Authentication
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        TimeAndDatePro v1 ships open by default. API keys arrive with the Pro tier in Q3 2026.
      </p>

      <section className="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Current state</div>
        <h2 className="mt-1 text-[18px] font-bold text-slate-900">No auth required — and that's intentional</h2>
        <p className="mt-2 text-[14px] text-slate-700">
          Every endpoint is reachable anonymously today. The free tier is rate-limited per IP and per key fingerprint to keep abuse out; Pro tier keys unlock higher limits and private endpoints (webhooks, batch conversion, scheduled jobs) when they ship.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[20px] font-bold text-slate-900">Rate limits (free tier)</h2>
        <p className="mt-2 text-[14px] text-slate-700">
          Limits are sliding-window per IP and are generous for typical app usage.
        </p>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr><th className="px-3 py-2">Endpoint family</th><th className="px-3 py-2">Limit</th><th className="px-3 py-2">Burst</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { e: "Time API (now / convert / unix / iso / words)", l: "120 req/min", b: "10 req/sec" },
                { e: "Time API (diff / add)", l: "60 req/min", b: "5 req/sec" },
                { e: "Cities & Countries (list / get)", l: "300 req/min", b: "— (cached)" },
                { e: "Pairs / Meeting / Working-hours", l: "60 req/min", b: "5 req/sec" },
              ].map((row) => (
                <tr key={row.e}>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.e}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{row.l}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-slate-500">
          Over-limit responses return <code className="font-mono">429 Too Many Requests</code> with a <code className="font-mono">Retry-After</code> header (in seconds).
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[20px] font-bold text-slate-900">Pro tier (coming Q3 2026)</h2>
        <p className="mt-3 text-[14px] text-slate-700">
          When Pro lands, you'll be able to instantiate the SDK with an API key. Same method signatures — no breakage:
        </p>
        <div className="mt-3">
          <CodeTabs
            samples={[
              {
                lang: "node",
                label: "Node.js",
                code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

// Pro — pass via env. The SDK uses Bearer auth transparently.
const pro = new TimeAndDatePro({
  apiKey: process.env.TDP_API_KEY,
});`,
              },
              {
                lang: "curl",
                label: "cURL",
                code: `curl https://timeanddatepro.com/api/v1/time/now?city=TYO \\
  -H "Authorization: Bearer $TDP_API_KEY"`,
              },
            ]}
          />
        </div>
        <ul className="mt-4 space-y-1 text-[14px] text-slate-700 list-disc pl-5">
          <li>10x the rate limits (1,200 req/min, 100 req/sec bursts).</li>
          <li>Private endpoints: webhook delivery, batch conversion (up to 100 files), scheduled jobs.</li>
          <li>SLAs and support tier — see <a className="font-bold text-indigo-600 hover:underline" href="/pricing">Pricing</a>.</li>
        </ul>
      </section>
    </article>
  );
}
