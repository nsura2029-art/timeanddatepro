// src/components/tools/shared/RelatedToolsGrid.tsx
// Pastel NotebookLM-style "related tools" grid. Single source of truth for
// both the hero's 12-tool grid AND every tool page's "you might also like"
// surface. Each card gets one of four pastel variants (lavender/mint/amber/
// sky) on a rotation so the rainbow is visible at a glance.
//
// Icons accept any ReactNode — emoji strings (used on tool pages) or Lucide
// components (used in the hero). This unifies the two surfaces under one
// component, one CSS class, and one variant rotation.

import React from "react";
import {
  Globe2,
  CalendarDays,
  PartyPopper,
  Clock,
  Calendar,
  BookOpen,
  Hourglass,
  CalendarRange,
  Sun,
  CalendarClock,
  Timer,
  Hash,
  Coins,
  Repeat,
} from "lucide-react";

export type PastelVariant = "lavender" | "mint" | "amber" | "sky";

export interface RelatedTool {
  /** Display label, e.g. "Word to Date" */
  label: string;
  /** URL or route, e.g. "/word-to-date" */
  href: string;
  /** Icon: emoji string, Lucide component instance, or any ReactNode */
  icon: React.ReactNode;
  /** Optional description shown on hover (tooltip-like) */
  description?: string;
  /** Override the auto-assigned variant */
  variant?: PastelVariant;
}

interface Props {
  /** Tool list, max 12 typically */
  tools: RelatedTool[];
  /** Eyebrow text, defaults to "Related tools" */
  eyebrow?: string;
  /** Meta text, defaults to "X more" */
  meta?: string;
}

const VARIANT_ROTATION: PastelVariant[] = ["lavender", "mint", "amber", "sky"];

function autoVariant(index: number): PastelVariant {
  return VARIANT_ROTATION[index % VARIANT_ROTATION.length];
}

export const RelatedToolsGrid: React.FC<Props> = ({
  tools,
  eyebrow = "Related tools",
  meta,
}) => {
  return (
    <section
      className="tdp-hero-explore-links"
      aria-label={eyebrow}
    >
      <header className="tdp-hero-explore-links-header">
        <h3 className="tdp-hero-explore-links-eyebrow">{eyebrow}</h3>
        <span className="tdp-hero-explore-links-meta">
          {meta ?? `${tools.length} more`}
        </span>
      </header>
      <ul className="tdp-hero-explore-links-grid">
        {tools.map((tool, index) => {
          const variant = tool.variant ?? autoVariant(index);
          return (
            <li key={tool.href} className="tdp-hero-explore-links-item">
              <a
                href={tool.href}
                className={`tdp-hero-explore-links-link tdp-hero-explore-links-link--${variant}`}
                title={tool.description}
              >
                <span className="tdp-hero-explore-links-icon" aria-hidden>
                  {tool.icon}
                </span>
                <span className="tdp-hero-explore-links-text">{tool.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

// ── Hero tools (14) — single source of truth, used by LandingHeroHorizon ──
// Variants cycle lavender → mint → amber → sky across the grid so all
// four pastels are visible at a glance. Same rotation RelatedToolsGrid
// applies automatically if you don't override `variant`.

export const HERO_TOOLS: RelatedTool[] = [
  { href: "/time-zone-converter",   label: "Time Zone Converter", icon: <Globe2 size={16} strokeWidth={2.2} />,        variant: "lavender", description: "Convert times between cities and zones" },
  { href: "/meeting-finder",        label: "Meeting Finder",      icon: <CalendarDays size={16} strokeWidth={2.2} />, variant: "mint",     description: "Find the best meeting time across time zones" },
  { href: "/holidays",              label: "Holidays & Hours",    icon: <PartyPopper size={16} strokeWidth={2.2} />,  variant: "amber",    description: "Public holidays and business hours worldwide" },
  { href: "/world-clock",           label: "World Clock",         icon: <Clock size={16} strokeWidth={2.2} />,          variant: "sky",      description: "Live clocks for major cities around the world" },
  { href: "/en/12-month-calendar",  label: "12-Month Calendar",   icon: <Calendar size={16} strokeWidth={2.2} />,      variant: "lavender", description: "Full-year calendar with holidays" },
  { href: "/api-docs",              label: "API Docs",            icon: <BookOpen size={16} strokeWidth={2.2} />,      variant: "sky",      description: "REST API for cities, time, dates, and more" },
  { href: "/en/countdown",          label: "Countdown Timer",     icon: <Hourglass size={16} strokeWidth={2.2} />,     variant: "mint",     description: "Count down to a date or event" },
  { href: "/en/date-diff",          label: "Date Difference",     icon: <CalendarRange size={16} strokeWidth={2.2} />, variant: "amber",    description: "Calculate the duration between two dates" },
  { href: "/en/sunrise-sunset",     label: "Sunrise & Sunset",    icon: <Sun size={16} strokeWidth={2.2} />,           variant: "sky",      description: "Daylight times for any location" },
  { href: "/en/daylight-saving",    label: "Daylight Saving",     icon: <CalendarClock size={16} strokeWidth={2.2} />, variant: "lavender", description: "DST transitions and clock changes" },
  { href: "/en/stopwatch",          label: "Stopwatch",           icon: <Timer size={16} strokeWidth={2.2} />,         variant: "mint",     description: "Online stopwatch with laps" },
  { href: "/en/unix",               label: "Unix Timestamp",      icon: <Hash size={16} strokeWidth={2.2} />,          variant: "amber",    description: "Convert between Unix time and human dates" },
  { href: "/en/currency-converter", label: "Currency Converter",  icon: <Coins size={16} strokeWidth={2.2} />,         variant: "sky",      description: "Live exchange rates across 160+ currencies" },
  { href: "/en/date-words",         label: "Date to Words",       icon: <Repeat size={16} strokeWidth={2.2} />,        variant: "lavender", description: "Write any date in formal, legal, or casual words" },
];

export default RelatedToolsGrid;
