// src/components/docs/DocSidebar.tsx
// Left navigation for /docs/*. Auto-generated from DOC_SECTIONS.
// Active section auto-expands; other sections collapsed by default. Mobile: a
// backdrop + slide-over triggered from a search-style header toggle.

import React, { useState } from "react";
import { DOC_SECTIONS, type DocSectionId, type ParsedDocPath } from "../../utils/docRoutes";

export interface DocSidebarProps {
  active: ParsedDocPath | null;
  /** When true (mobile drawer), renders an overlay + close button. */
  open?: boolean;
  onClose?: () => void;
}

function badgeStyle(badge?: string): string {
  if (badge === "new") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (badge === "beta") return "bg-amber-100 text-amber-700 border-amber-200";
  if (badge === "soon") return "bg-slate-100 text-slate-500 border-slate-200";
  return "";
}

function badgeLabel(badge?: string): string {
  if (badge === "new") return "NEW";
  if (badge === "beta") return "BETA";
  if (badge === "soon") return "SOON";
  return "";
}

export default function DocSidebar({ active, open, onClose }: DocSidebarProps) {
  const activeSection = active?.sectionId;
  // All sections default-collapsed except the active one
  const [openSections, setOpenSections] = useState<Record<DocSectionId, boolean>>(() => {
    const init: Partial<Record<DocSectionId, boolean>> = {};
    DOC_SECTIONS.forEach((s) => { init[s.id] = s.id === (activeSection ?? "getting-started"); });
    return init as Record<DocSectionId, boolean>;
  });

  const toggle = (id: DocSectionId) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      {/* backdrop (mobile) */}
      <div
        className={
          "fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={
          // layout — fixed on mobile, sticky on desktop
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-xl transition-transform lg:sticky lg:top-[112px] lg:z-0 lg:block lg:h-[calc(100vh-112px)] lg:w-64 lg:translate-x-0 lg:bg-transparent lg:p-0 lg:shadow-none " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
        aria-label="Documentation navigation"
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-[14px] font-bold text-slate-900">Documentation</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <nav className="space-y-5">
          {DOC_SECTIONS.map((section) => {
            const isOpen = openSections[section.id];
            const isActiveSection = activeSection === section.id;
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  aria-expanded={isOpen}
                  className={
                    "flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider transition " +
                    (isActiveSection ? "text-indigo-600" : "text-slate-500 hover:text-slate-700")
                  }
                >
                  <span>{section.title}</span>
                  <svg
                    viewBox="0 0 12 12"
                    className={"h-3 w-3 transition-transform " + (isOpen ? "rotate-90" : "")}
                    aria-hidden="true"
                  >
                    <path d="M4 2.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <ul className="mt-1.5 space-y-0.5 border-l border-slate-200 pl-3">
                    {section.pages.map((page) => {
                      const isActive = isActiveSection && active?.fullSlug === page.slug;
                      const href = `/docs/${section.id}/${page.slug}`;
                      return (
                        <li key={page.slug} className="relative">
                          {isActive && (
                            <span className="absolute -left-[13px] top-1.5 h-5 w-0.5 rounded-full bg-indigo-600" aria-hidden="true" />
                          )}
                          <a
                            href={href}
                            className={
                              "block rounded-md px-2 py-1.5 text-[13px] transition " +
                              (isActive
                                ? "bg-indigo-50 font-semibold text-indigo-700"
                                : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600")
                            }
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate">{page.title}</span>
                              {page.badge && (
                                <span className={"shrink-0 rounded border px-1.5 py-0 text-[9px] font-bold tracking-wider " + badgeStyle(page.badge)}>
                                  {badgeLabel(page.badge)}
                                </span>
                              )}
                            </span>
                            {page.description && (
                              <span className="block truncate text-[11px] font-normal text-slate-500">{page.description}</span>
                            )}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 text-[11px] text-slate-400">
          <a href="/docs/sdk/nodejs" className="font-bold text-indigo-600 hover:underline">
            Install the Node.js SDK →
          </a>
        </div>
      </aside>
    </>
  );
}
