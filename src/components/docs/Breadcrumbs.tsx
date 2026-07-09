// src/components/docs/Breadcrumbs.tsx
// Small breadcrumb trail used by DocLayout. Each crumb is a link, current page
// is rendered as plain text with aria-current="page" for screen readers.

import React from "react";
import type { Crumb } from "../../utils/docRoutes";

export interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export default function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-500">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <React.Fragment key={c.href + i}>
            {i > 0 && <span className="text-slate-300">/</span>}
            {last ? (
              <span aria-current="page" className="font-bold text-slate-700">{c.label}</span>
            ) : (
              <a href={c.href} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 hover:text-indigo-600">
                {c.label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
