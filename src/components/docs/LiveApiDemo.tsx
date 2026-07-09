// src/components/docs/LiveApiDemo.tsx
// Interactive "Try it" widget — fills simple key/value params and calls the API
// in-browser. Renders the JSON response. Designed to be embedded inside an
// integrations page without bringing in a 100kB HTTP client — uses fetch.

import React, { useState } from "react";

export interface LiveApiDemoParam {
  name: string;
  label: string;
  /** Default value */
  defaultValue?: string;
  /** Pre-described options for a select input. */
  options?: string[];
}

export interface LiveApiDemoProps {
  /** HTTP path appended to the API base, e.g. "/api/v1/time/convert". */
  endpoint: string;
  /** Build URLSearchParams from a record. */
  params: LiveApiDemoParam[];
  /** Title shown above the form. */
  title?: string;
  /** Optional fields to highlight in the response (dotted paths). */
  highlightFields?: string[];
}

const API_BASE = (typeof window !== "undefined" && window.location.hostname === "localhost")
  ? "http://localhost:3000"
  : "";

function get(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

export default function LiveApiDemo({ endpoint, params, title = "Try it", highlightFields = [] }: LiveApiDemoProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    params.forEach((p) => { init[p.name] = p.defaultValue ?? ""; });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ ok: boolean; body: any; status: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      params.forEach((p) => {
        const v = values[p.name];
        if (v) qs.set(p.name, v);
      });
      const url = `${API_BASE}${endpoint}${qs.toString() ? "?" + qs.toString() : ""}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const body = await res.json().catch(() => ({}));
      setResponse({ ok: res.ok, body, status: res.status });
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/40 shadow-sm">
      <div className="flex items-center justify-between border-b border-indigo-100 bg-white/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold">▶</span>
          <h4 className="text-[14px] font-bold text-slate-900">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={loading}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Running…" : "Run request →"}
        </button>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          {params.map((p) => (
            <div key={p.name}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {p.label}
              </label>
              {p.options ? (
                <select
                  value={values[p.name]}
                  onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[13px] text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  {p.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={values[p.name]}
                  onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[13px] text-slate-800 focus:border-indigo-500 focus:outline-none font-mono"
                />
              )}
            </div>
          ))}
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Response {response && (
              <span className={
                "ml-2 inline-block rounded-md border px-1.5 py-0.5 font-mono " +
                (response.ok
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700")
              }>{response.status}</span>
            )}
          </label>
          {error ? (
            <div className="mt-1 rounded-md border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
              {error}
            </div>
          ) : response ? (
            <div className="mt-1 max-h-72 overflow-auto rounded-md border border-slate-200 bg-slate-900 p-3 font-mono text-[12px] leading-relaxed text-slate-100">
              <pre>{JSON.stringify(response.body, null, 2)}</pre>
              {highlightFields.length > 0 && response.ok && (
                <div className="mt-3 border-t border-slate-700 pt-2 text-slate-300">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highlighted fields</div>
                  {highlightFields.map((f) => {
                    const val = get(response.body, f);
                    return val === undefined ? null : (
                      <div key={f} className="mt-1">
                        <span className="text-amber-300">{f}</span>: <span className="text-emerald-300">{JSON.stringify(val)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-1 rounded-md border border-dashed border-slate-300 bg-white p-4 text-[12px] text-slate-500">
              Click <strong>Run request</strong> to see the response.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
