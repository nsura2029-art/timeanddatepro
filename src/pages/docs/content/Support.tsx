// src/pages/docs/content/Support.tsx
// /docs/resources/support — contact, status, FAQ.

import React from "react";

export default function Support() {
  return (
    <article className="max-w-none">
      <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900">Support</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        We're here when things go wrong.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <a className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300" href="https://github.com/nsura2029-art/timeanddatepro/issues" target="_blank" rel="noopener noreferrer">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bug reports & feature requests</div>
          <div className="mt-1 text-[18px] font-bold text-slate-900 group-hover:text-indigo-600">GitHub Issues →</div>
          <p className="mt-1 text-[13px] text-slate-600">
            Open-source repos. Drop a reproducer, screenshot, or curl command; we usually reply within a business day.
          </p>
        </a>
        <a className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300" href="mailto:support@timeanddatepro.com">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</div>
          <div className="mt-1 text-[18px] font-bold text-slate-900 group-hover:text-indigo-600">support@timeanddatepro.com →</div>
          <p className="mt-1 text-[13px] text-slate-600">
            For Pro tier customers and account/billing questions.
          </p>
        </a>
        <a className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300" href="/api/v1/health">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live status</div>
          <div className="mt-1 text-[18px] font-bold text-slate-900 group-hover:text-indigo-600">/api/v1/health →</div>
          <p className="mt-1 text-[13px] text-slate-600">
            Programmatic liveness check. Returns uptime + version.
          </p>
        </a>
        <a className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300" href="/docs/getting-started/errors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Self-debugging</div>
          <div className="mt-1 text-[18px] font-bold text-slate-900 group-hover:text-indigo-600">Errors reference →</div>
          <p className="mt-1 text-[13px] text-slate-600">
            Most issues are caught by the status code table. 4xx = your request. 5xx = us.
          </p>
        </a>
      </section>

      <section className="mt-12">
        <h2 className="text-[20px] font-bold text-slate-900">FAQ</h2>
        <div className="mt-4 space-y-3">
          {[
            {
              q: "What happens if I exceed my free-tier rate limit?",
              a: "Returns HTTP 429 with a Retry-After header. The SDK throws ApiClientError with code RATE_LIMITED. Implement exponential backoff.",
            },
            {
              q: "Can I self-host the API?",
              a: "Yes — clone the repo, `npm install`, `npm run dev`. The server is Node 18 + Express + the same timeApi.ts utilities. See the README for env flags.",
            },
            {
              q: "Do you support older Node versions?",
              a: "Node 18+ only — the SDK relies on the native fetch API and AbortController. Older versions can polyfill fetch globally and pass it via the `fetch:` config option.",
            },
            {
              q: "Will the API change in v2?",
              a: "Yes, but v1 will keep working for at least 12 months after v2 ships. Breaking changes will be announced 90 days in advance on this changelog.",
            },
          ].map((x) => (
            <details key={x.q} className="rounded-lg border border-slate-200 bg-white p-4 group">
              <summary className="cursor-pointer list-none flex items-center justify-between text-[15px] font-bold text-slate-900">
                {x.q}
                <span className="text-slate-400 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-2 text-[13px] text-slate-600">{x.a}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
