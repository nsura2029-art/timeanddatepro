// src/pages/docs/content/Errors.tsx
// /docs/getting-started/errors — envelope on failure + status-code table.

import React from "react";
import CodeTabs from "../../../components/docs/CodeTabs";
import ResponseBlock from "../../../components/docs/ResponseBlock";

export default function Errors() {
  return (
    <article className="max-w-none">
      <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900">
        Errors
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-600">
        Every failed call returns the same envelope shape — just with <code className="font-mono">success: false</code> and an <code className="font-mono">error</code> block. Status code tells you what kind.
      </p>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Error envelope</h2>
      <div className="mt-3">
        <ResponseBlock
          data={{ /* intentionally absent */ }}
          success={false}
          label="Response 4xx / 5xx"
        />
      </div>
      <p className="mt-3 text-[13px] text-slate-500">
        <code className="font-mono">code</code> is a stable string (BAD_DATE, UNKNOWN_CITY, etc.) so you can branch on it; <code className="font-mono">message</code> is human-readable and may change.
      </p>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Status codes</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Meaning</th><th className="px-3 py-2">Example `error.code`</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {[
              { c: "400", m: "Bad request — validation failed.", ex: "BAD_DATE, BAD_TIME, BAD_VALUE, MISSING_PARAM, BAD_TIMEZONE" },
              { c: "404", m: "Not found — resource doesn't exist.", ex: "UNKNOWN_CITY, UNKNOWN_COUNTRY" },
              { c: "408", m: "Request timeout (SDK only).", ex: "TIMEOUT" },
              { c: "429", m: "Rate-limit exceeded. Check `Retry-After`.", ex: "RATE_LIMITED" },
              { c: "500", m: "Server error — please report with `meta.endpoint` + timestamp.", ex: "INTERNAL" },
              { c: "0",  m: "Network failure / fetch aborted (SDK only).", ex: "NETWORK" },
            ].map((r) => (
              <tr key={r.c}>
                <td className="px-3 py-2 font-mono font-bold text-slate-900">{r.c}</td>
                <td className="px-3 py-2">{r.m}</td>
                <td className="px-3 py-2 font-mono text-slate-700">{r.ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-[20px] font-bold text-slate-900">Handling in Node.js</h2>
      <p className="mt-2 text-[14px] text-slate-700">
        The SDK throws a typed <code className="font-mono">ApiClientError</code> with <code className="font-mono">status</code>, <code className="font-mono">code</code>, and <code className="font-mono">message</code>.
      </p>
      <div className="mt-3">
        <CodeTabs
          samples={[
            {
              lang: "node",
              label: "Node.js",
              code: `import { TimeAndDatePro, ApiClientError } from "@timeanddatepro/sdk";

const client = new TimeAndDatePro();

try {
  await client.time.now({ city: "FOOBAR" });
} catch (err) {
  if (err instanceof ApiClientError) {
    if (err.status === 404) {
      console.warn("Unknown city — falling back");
    } else if (err.status === 429) {
      const secs = Number(err.message.match(/\\d+/)?.[0] ?? 1);
      await new Promise((r) => setTimeout(r, secs * 1000));
    } else {
      // 5xx, network, etc — surface to your error tracker.
      Sentry.captureException(err);
    }
  } else {
    throw err;
  }
}`,
            },
          ]}
        />
      </div>
    </article>
  );
}
