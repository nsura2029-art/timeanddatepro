// src/components/docs/ParamTable.tsx
// Renders the parameter list for a docs endpoint. Path params and query params
// are passed separately so we can show them in the right place in EndpointRef.

import React from "react";
import type { ParamDef } from "../../data/docs/endpointCatalog";

export interface ParamTableProps {
  params: ParamDef[];
  kindLabel: string;            // "Path" | "Query"
}

function kindBadge(type: ParamDef["type"], values?: string[]): string {
  if (type === "boolean") return "boolean";
  if (type === "int") return "integer";
  if (type === "iso-date") return "ISO date";
  if (type === "city-list") return "csv list";
  if (type === "enum") return values ? values.map((v) => `"${v}"`).join(" | ") : "enum";
  return "string";
}

export default function ParamTable({ params, kindLabel }: ParamTableProps) {
  if (!params.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-[12px] text-slate-500">
        No {kindLabel.toLowerCase()} parameters — this endpoint reads the URL path only.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="grid grid-cols-[18%_1fr_18%] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <div>Name</div>
        <div>Description</div>
        <div className="text-right">Type</div>
      </div>
      {params.map((p, i) => (
        <div
          key={p.name}
          className={
            "grid grid-cols-[18%_1fr_18%] gap-2 px-3 py-2.5 " +
            (i % 2 === 1 ? "bg-slate-50/40" : "bg-white")
          }
        >
          <div className="font-mono text-[12px] text-indigo-700 break-all">
            {p.name}
            {p.required && <span className="ml-1 text-rose-500" title="required">*</span>}
          </div>
          <div className="text-[12px] text-slate-700">
            {p.desc}
            {p.default && (
              <span className="ml-1 text-slate-500">default: <code className="rounded bg-slate-100 px-1">{p.default}</code></span>
            )}
          </div>
          <div className="text-right">
            <span className="inline-block max-w-full rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
              {kindBadge(p.type, p.values)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
