// src/components/docs/EndpointRef.tsx
// Renders a single endpoint reference page from the catalog. CloudConvert style:
// big method+path, summary, intro, code samples (Node.js + cURL), param tables,
// response example. Each section is anchored so you can deep-link via #section.

import React from "react";
import type { EndpointDoc } from "../../data/docs/endpointCatalog";
import CodeTabs from "./CodeTabs";
import ParamTable from "./ParamTable";
import ResponseBlock from "./ResponseBlock";

export interface EndpointRefProps {
  endpoint: EndpointDoc;
}

function methodColor(method: EndpointDoc["method"]): string {
  switch (method) {
    case "GET": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "POST": return "bg-sky-50 text-sky-700 border-sky-200";
    case "PUT": return "bg-amber-50 text-amber-700 border-amber-200";
    case "DELETE": return "bg-rose-50 text-rose-700 border-rose-200";
  }
}

export default function EndpointRef({ endpoint }: EndpointRefProps) {
  return (
    <article className="prose-doc max-w-none">
      <header id="overview" className="scroll-mt-32">
        <div className="flex flex-wrap items-center gap-3">
          <span className={"rounded-md border px-2.5 py-1 font-mono text-[12px] font-bold " + methodColor(endpoint.method)}>
            {endpoint.method}
          </span>
          <code className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[14px] font-bold text-slate-800 break-all">
            {endpoint.apiPath}
          </code>
          {endpoint.cache && (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Cache {endpoint.cache}
            </span>
          )}
          {endpoint.rateLimited && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Rate-limited
            </span>
          )}
        </div>
        <h1 className="mt-4 text-[32px] font-extrabold leading-tight tracking-tight text-slate-900">
          {endpoint.title}
        </h1>
        <p className="mt-2 text-[16px] leading-relaxed text-slate-600">
          {endpoint.summary}
        </p>
      </header>

      {endpoint.intro.map((p, i) => (
        <p key={i} className="mt-4 text-[15px] leading-relaxed text-slate-700">
          {p}
        </p>
      ))}

      {endpoint.examples && endpoint.examples.length > 0 && (
        <section id="examples" className="mt-8 scroll-mt-32">
          <h2 className="text-[20px] font-bold text-slate-900">Examples</h2>
          <div className="mt-3 space-y-3">
            {endpoint.examples.map((ex, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                  {ex.title}
                </div>
                <pre className="overflow-x-auto rounded-md bg-slate-50 p-3 font-mono text-[12.5px] text-slate-800">
                  <code>{ex.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="request" className="mt-10 scroll-mt-32">
        <h2 className="text-[20px] font-bold text-slate-900">Request</h2>
        <p className="mt-2 text-[14px] text-slate-600">
          Build your request from the tabs below. Node.js ships today; cURL is included for quick testing.
        </p>
        <div className="mt-4">
          <CodeTabs samples={endpoint.samples} />
        </div>

        {endpoint.path && endpoint.path.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate-500">Path parameters</h3>
            <div className="mt-2">
              <ParamTable params={endpoint.path} kindLabel="Path" />
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-[14px] font-bold uppercase tracking-wider text-slate-500">Query parameters</h3>
          <div className="mt-2">
            <ParamTable params={endpoint.query ?? []} kindLabel="Query" />
          </div>
        </div>
      </section>

      <section id="response" className="mt-10 scroll-mt-32">
        <h2 className="text-[20px] font-bold text-slate-900">Response</h2>
        <p className="mt-2 text-[14px] text-slate-600">
          All responses share the standard envelope (success + data + meta). Errors return
          <code className="mx-1 rounded bg-slate-100 px-1 font-mono">success: false</code>
          with an <code className="rounded bg-slate-100 px-1 font-mono">error</code> block — see the
          <a href="/docs/getting-started/errors" className="ml-1 font-bold text-indigo-600 hover:underline">errors page</a>.
        </p>
        <div className="mt-4">
          <ResponseBlock data={endpoint.responseExample} success />
        </div>
      </section>
    </article>
  );
}
