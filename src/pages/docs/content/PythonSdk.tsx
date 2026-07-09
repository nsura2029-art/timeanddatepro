// src/pages/docs/content/PythonSdk.tsx
// /docs/sdks/python — coming soon.

import React from "react";

export default function PythonSdk() {
  return (
    <article className="max-w-none">
      <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Coming soon
      </span>
      <h1 className="mt-3 text-[34px] font-extrabold tracking-tight text-slate-900">
        Python SDK
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        We're porting the Node.js client to Python with the same namespace layout, snake_case naming, and
        full <code className="font-mono">mypy</code>-compatible type stubs. <code className="font-mono">requests</code>-based — no extra deps beyond what you already have.
      </p>

      <section className="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5">
        <h2 className="text-[18px] font-bold text-slate-900">Planned shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-[12.5px] leading-relaxed text-slate-100">
{`from timeanddatepro import Client

client = Client()  # free tier

tokyo = client.time.now(city="TYO")
print(tokyo.time)

slot = client.time.convert(from_="NYC", to="TYO", time="15:00")
print(slot.to.time)`}
        </pre>
        <p className="mt-3 text-[13px] text-slate-600">
          Open an issue on GitHub if you'd like to beta-test, or if you'd want a different language first
          (Go, Ruby, PHP, .NET — all on the table).
        </p>
      </section>
    </article>
  );
}
