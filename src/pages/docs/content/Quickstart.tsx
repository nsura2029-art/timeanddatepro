// src/pages/docs/content/Quickstart.tsx
// /docs/getting-started/quickstart — the install + first call flow.

import React from "react";
import CodeTabs from "../../../components/docs/CodeTabs";

export default function Quickstart() {
  return (
    <article className="max-w-none">
      <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900">
        Quickstart
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        Up and running in three steps. No signup needed for the free tier.
      </p>

      <ol className="mt-8 space-y-8">
        <li>
          <div className="flex items-baseline gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[13px]">1</span>
            <h2 className="text-[20px] font-bold text-slate-900">Install the Node.js SDK</h2>
          </div>
          <p className="mt-3 ml-10 text-[15px] text-slate-700">
            The Node.js client is zero-dependency. You'll need Node.js 18+ (for the native <code className="font-mono">fetch</code>).
          </p>
          <div className="mt-3 ml-10">
            <CodeTabs
              samples={[
                { lang: "node", label: "npm", code: `npm install @timeanddatepro/sdk` },
                { lang: "node", label: "pnpm", code: `pnpm add @timeanddatepro/sdk` },
                { lang: "node", label: "yarn", code: `yarn add @timeanddatepro/sdk` },
              ]}
            />
          </div>
          <p className="mt-3 ml-10 text-[13px] text-slate-500">
            Prefer raw HTTP? The cURL examples on every endpoint work without any client library — see
            <a className="ml-1 font-bold text-indigo-600 hover:underline" href="/docs/sdks/curl">cURL reference</a>.
          </p>
        </li>

        <li>
          <div className="flex items-baseline gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[13px]">2</span>
            <h2 className="text-[20px] font-bold text-slate-900">Create a client</h2>
          </div>
          <div className="mt-3 ml-10">
            <CodeTabs
              samples={[
                {
                  lang: "node",
                  label: "Node.js",
                  code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

// Free tier — generous rate limits, no signup.
const client = new TimeAndDatePro();

// Override the base URL for local dev or self-hosting.
const devClient = new TimeAndDatePro({
  baseUrl: "http://localhost:3000",
});

// Pro tier — pass an API key (rollout coming Q3 2026).
const pro = new TimeAndDatePro({
  apiKey: process.env.TDP_API_KEY,
});`,
                },
                {
                  lang: "curl",
                  label: "cURL",
                  code: `# No client needed — just hit the API directly.
curl https://timeanddatepro.com/api/v1/health`,
                },
              ]}
            />
          </div>
        </li>

        <li>
          <div className="flex items-baseline gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[13px]">3</span>
            <h2 className="text-[20px] font-bold text-slate-900">Make your first call</h2>
          </div>
          <p className="mt-3 ml-10 text-[15px] text-slate-700">
            Convert 15:00 New York to Tokyo on July 8, 2026 and inspect the result.
          </p>
          <div className="mt-3 ml-10">
            <CodeTabs
              samples={[
                {
                  lang: "node",
                  label: "Node.js",
                  code: `import { TimeAndDatePro } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

const result = await client.time.convert({
  from: "NYC",
  to: "TYO",
  time: "15:00",
  date: "2026-07-08",
});

console.log(\`\${result.from.time} \${result.from.city} → \${result.to.time} \${result.to.city}\`);
console.log(\`UTC anchor: \${result.sourceUTC}\`);
console.log(\`Hour difference: \${result.differenceHours}\`);`,
                },
                {
                  lang: "curl",
                  label: "cURL",
                  code: `curl "https://timeanddatepro.com/api/v1/time/convert?from=NYC&to=TYO&time=15%3A00&date=2026-07-08"`,
                },
              ]}
            />
          </div>
          <p className="mt-3 ml-10 text-[13px] text-slate-600">
            Expected output: <code className="font-mono">15:00:00 New York → 04:00:00 Tokyo</code>, hour difference 13.
          </p>
        </li>
      </ol>

      <section className="mt-14">
        <h2 className="text-[22px] font-bold text-slate-900">What's next?</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <a className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300" href="/docs/api-reference/overview">
            <div className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600">Browse the API reference →</div>
            <div className="mt-1 text-[13px] text-slate-600">All 15 endpoints with full request/response.</div>
          </a>
          <a className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300" href="/docs/integrations/time-zone-converter">
            <div className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600">See it in production →</div>
            <div className="mt-1 text-[13px] text-slate-600">Per-tool integration guides + live SDK demos.</div>
          </a>
          <a className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300" href="/docs/getting-started/authentication">
            <div className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600">Authentication →</div>
            <div className="mt-1 text-[13px] text-slate-600">Rate limits, key tiers, and how Pro works.</div>
          </a>
          <a className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300" href="/docs/getting-started/errors">
            <div className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600">Errors →</div>
            <div className="mt-1 text-[13px] text-slate-600">Status codes, error envelope, retry semantics.</div>
          </a>
        </div>
      </section>
    </article>
  );
}
