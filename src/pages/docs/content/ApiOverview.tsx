// src/pages/docs/content/ApiOverview.tsx
// /docs/api-reference/overview — endpoints index.

import React from "react";
import { ENDPOINT_CATALOG } from "../../../data/docs/endpointCatalog";

export default function ApiOverview() {
  const byKind: Record<string, typeof ENDPOINT_CATALOG> = {
    "Time API": ENDPOINT_CATALOG.filter((e) => e.apiPath.includes("/time/") || e.apiPath === "/api/v1"),
    "Cities":   ENDPOINT_CATALOG.filter((e) => e.apiPath.startsWith("/api/v1/cities") || e.slug === "cities"),
    "Countries": ENDPOINT_CATALOG.filter((e) => e.apiPath.startsWith("/api/v1/countries") || e.slug === "countries"),
    "Pairs / Meeting": ENDPOINT_CATALOG.filter((e) => e.apiPath.startsWith("/api/v1/pairs") || e.apiPath.startsWith("/api/v1/meeting")),
  };

  return (
    <article className="max-w-none">
      <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900">
        API Reference
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        Every endpoint documented the same way: method + path, summary, intro, request, params, response. Node.js + cURL examples on each. Hit the live API by clicking <strong>Try it</strong> on any endpoint page.
      </p>

      {Object.entries(byKind).map(([group, eps]) => (
        <section key={group} className="mt-10">
          <h2 className="text-[20px] font-bold text-slate-900">{group}</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 w-[14%]">Method</th>
                  <th className="px-3 py-2 w-[36%]">Endpoint</th>
                  <th className="px-3 py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eps.map((e) => (
                  <tr key={e.slug} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2">
                      <span className={
                        "rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-bold " +
                        (e.method === "GET"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-sky-50 border-sky-200 text-sky-700")
                      }>{e.method}</span>
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={`/docs/api-reference/${e.slug}`}
                        className="font-mono text-[12.5px] font-bold text-indigo-700 hover:underline break-all"
                      >
                        {e.apiPath}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{e.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="mt-12 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-[16px] font-bold text-slate-900">Conventions used across the reference</h3>
        <ul className="mt-3 space-y-2 text-[13px] text-slate-700 list-disc pl-5">
          <li>All paths are prefixed with <code className="font-mono">/api/v1</code>.</li>
          <li>All responses are <code className="font-mono">application/json; charset=utf-8</code>.</li>
          <li>Cities accept IATA aliases (<code className="font-mono">TYO</code>, <code className="font-mono">JFK</code>, <code className="font-mono">SFO</code>, …) or full IANA names (<code className="font-mono">Asia/Tokyo</code>).</li>
          <li>Country codes are ISO 3166-1 alpha-2 (<code className="font-mono">US</code>, <code className="font-mono">GB</code>, <code className="font-mono">JP</code>).</li>
          <li>Dates are always ISO format <code className="font-mono">YYYY-MM-DD</code>; times are 24-hour <code className="font-mono">HH:MM</code>.</li>
          <li>Cache-Control headers are set per endpoint — see the pill on each page.</li>
        </ul>
      </section>
    </article>
  );
}
