// src/components/docs/DocLayout.tsx
// Wraps every docs page with sidebar + breadcrumbs + main content column.
// Sticky on desktop so the navigation never scrolls out of view while reading
// long endpoint references. Header suppresses the global Navbar inside /docs
// by rendering a minimal docs-only top bar so the reading column has full width.

import React, { useEffect, useState } from "react";
import DocSidebar from "./DocSidebar";
import Breadcrumbs from "./Breadcrumbs";
import { crumbsFor, parseDocsPath, DOC_SECTIONS } from "../../utils/docRoutes";

export interface DocLayoutProps {
  children: React.ReactNode;
  /** Optional override — defaults to reading from window.location.pathname. */
  pathname?: string;
}

export default function DocLayout({ children, pathname }: DocLayoutProps) {
  const [path, setPath] = useState<string>(() => pathname || (typeof window !== "undefined" ? window.location.pathname : "/docs/getting-started/introduction"));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Re-resolve on back/forward
  useEffect(() => {
    if (pathname) return; // SSR — skip
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pathname]);

  const active = parseDocsPath(path);
  const crumbs = active ? crumbsFor(active) : [{ label: "Docs", href: "/docs/getting-started/introduction" }, { label: "Introduction", href: "/docs/getting-started/introduction" }];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fafbff] to-[#f7f8fc] text-slate-900">
      {/* Docs top bar (replaces the global marketing header inside /docs) */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-5">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md border border-slate-300 px-2 py-1 text-[12px] font-bold text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Open navigation"
          >
            ☰ Menu
          </button>
          <a href="/" className="flex items-center gap-2 text-[14px] font-bold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold">T</span>
            <span>TimeAndDatePro</span>
          </a>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            API Docs
          </span>
          <nav className="ml-auto hidden items-center gap-4 md:flex">
            <a href="/" className="text-[12px] font-semibold text-slate-600 hover:text-indigo-600">App</a>
            <a href="/docs/getting-started/introduction" className="text-[12px] font-semibold text-indigo-600">Documentation</a>
            <a href="/docs/api-reference/overview" className="text-[12px] font-semibold text-slate-600 hover:text-indigo-600">API Reference</a>
            <a href="/docs/sdk/nodejs" className="text-[12px] font-semibold text-slate-600 hover:text-indigo-600">SDKs</a>
            <a
              href="https://github.com/nsura2029-art/timeanddatepro"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-slate-700"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1280px] gap-10 px-5 pb-24 pt-8 lg:px-10">
        {/* Sidebar (sticky on desktop, drawer on mobile) */}
        <DocSidebar active={active} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* Main column */}
        <main className="min-w-0 flex-1">
          <Breadcrumbs crumbs={crumbs} />
          {children}
          {active && (
            <DocFooterNav sectionId={active.sectionId} fullSlug={active.fullSlug} />
          )}
        </main>

        {/* Right rail (TOC placeholder) */}
        <aside className="hidden w-44 shrink-0 xl:block">
          <div className="sticky top-32">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">On this page</div>
            <ul className="mt-3 space-y-1.5 text-[13px] text-slate-600">
              <li><a href="#overview" className="hover:text-indigo-600">Overview</a></li>
              {active?.page.badge !== "soon" && (
                <>
                  <li><a href="#request" className="hover:text-indigo-600">Request</a></li>
                  <li><a href="#response" className="hover:text-indigo-600">Response</a></li>
                </>
              )}
            </ul>
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-3 text-[12px] text-slate-600 shadow-sm">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Need help?</div>
              <a href="/docs/resources/support" className="font-semibold text-indigo-600 hover:underline">Open a ticket →</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** "Previous / Next" cross-link between pages in the same section. */
function DocFooterNav({ sectionId, fullSlug }: { sectionId: string; fullSlug: string }) {
  const section = DOC_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;
  const idx = section.pages.findIndex((p) => p.slug === fullSlug);
  if (idx < 0) return null;
  const prev = idx > 0 ? section.pages[idx - 1] : null;
  const next = idx < section.pages.length - 1 ? section.pages[idx + 1] : null;
  if (!prev && !next) return null;
  return (
    <nav aria-label="Page navigation" className="mt-16 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
      {prev ? (
        <a href={`/docs/${sectionId}/${prev.slug}`} className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">← Previous</div>
          <div className="mt-1 text-[14px] font-semibold text-slate-800 group-hover:text-indigo-600">{prev.title}</div>
        </a>
      ) : <div />}
      {next ? (
        <a href={`/docs/${sectionId}/${next.slug}`} className="group rounded-lg border border-slate-200 bg-white p-4 text-right hover:border-indigo-300">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Next →</div>
          <div className="mt-1 text-[14px] font-semibold text-slate-800 group-hover:text-indigo-600">{next.title}</div>
        </a>
      ) : <div />}
    </nav>
  );
}
