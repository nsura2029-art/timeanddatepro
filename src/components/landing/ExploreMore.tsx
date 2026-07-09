// src/components/landing/ExploreMore.tsx
// Six tool/quick-link hooks as NotebookLM-style colored gradient cards.
// Each tool gets a specific color from the 9-color palette (see
// src/styles/notebooklm-palette.css) so the grid matches the reference
// design exactly:
//
//   indigo   Time Zone Converter   (same as Audio Overview)
//   emerald  Meeting Finder        (same as Video Overview)
//   amber    Holidays & Hours      (same as Slide Deck)
//   cyan     World Clock           (same as Quiz)
//   purple   12-Month Calendar     (same as Infographic)
//   blue     API Docs              (same as Data Table)
//
// One component = one purpose: surface the most-clicked destinations
// in a 3-col responsive grid with hover lift + arrow nudge.

import React from "react";
import {
  ArrowRightLeft,
  Users,
  Calendar,
  Globe,
  CalendarRange,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import "../../styles/notebooklm-palette.css";

type PaletteKey = "indigo" | "emerald" | "amber" | "cyan" | "purple" | "blue";

interface Hook {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** NotebookLM palette key (see notebooklm-palette.css) */
  palette: PaletteKey;
  /** Short hook line — 6-9 words max, render on top of label */
  tagline: string;
}

const HOOKS: Hook[] = [
  {
    label: "Time Zone Converter",
    href: "/en/time-zone-converter",
    icon: <ArrowRightLeft size={18} />,
    palette: "indigo",
    tagline: "Find the perfect overlap",
  },
  {
    label: "Meeting Finder",
    href: "/en/meeting-finder",
    icon: <Users size={18} />,
    palette: "emerald",
    tagline: "Best slots across time zones",
  },
  {
    label: "Holidays & Hours",
    href: "/en/holidays",
    icon: <Calendar size={18} />,
    palette: "amber",
    tagline: "Local observance calendar",
  },
  {
    label: "World Clock",
    href: "/en/worldclock",
    icon: <Globe size={18} />,
    palette: "cyan",
    tagline: "Live ticking world cities",
  },
  {
    label: "12-Month Calendar",
    href: "/en/calendar",
    icon: <CalendarRange size={18} />,
    palette: "purple",
    tagline: "Year at a glance",
  },
  {
    label: "API Docs",
    href: "/docs/getting-started/quickstart",
    icon: <BookOpen size={18} />,
    palette: "blue",
    tagline: "Integrate in minutes",
  },
];

export function ExploreMore() {
  return (
    <section className="tdp-section" aria-label="Explore more tools">
      <div className="tdp-section-label">
        <span className="tag">⌥</span>
        Explore more
        <span className="meta">6 tools · always one click away</span>
      </div>
      <div className="tdp-hooks tdp-hooks--colored">
        {HOOKS.map((h) => (
          <a
            key={h.href}
            href={h.href}
            className={`tdp-hook nlm-card-${h.palette}`}
            onClick={(e) => {
              if (typeof window === "undefined") return;
              e.preventDefault();
              window.history.pushState(null, "", h.href);
              window.dispatchEvent(new Event("tdp:navigate"));
            }}
          >
            <div className="tdp-hook-icon nlm-icon-chip" aria-hidden>{h.icon}</div>
            <div className="tdp-hook-body">
              <div className="tdp-hook-tagline">{h.tagline}</div>
              <div className="tdp-hook-label">{h.label}</div>
            </div>
            <ArrowUpRight size={14} className="tdp-hook-arrow" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}