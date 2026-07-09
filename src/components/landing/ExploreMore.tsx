// src/components/landing/ExploreMore.tsx
// Six tool/quick-link hooks as colored gradient cards — NotebookLM-style.
// Each card uses a different theme color so the grid feels like a
// dashboard of capabilities, not a generic menu. One component = one
// purpose: surface the most-clicked destinations.

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

interface Hook {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** One of the .tdp-hook--* themed gradient classes */
  theme: "violet" | "amber" | "rose" | "sky" | "lime" | "indigo";
  /** Short hook line — 6-9 words max, render on top of label */
  tagline: string;
}

const HOOKS: Hook[] = [
  {
    label: "Time Zone Converter",
    href: "/en/time-zone-converter",
    icon: <ArrowRightLeft size={18} />,
    theme: "violet",
    tagline: "Find the perfect overlap",
  },
  {
    label: "Meeting Finder",
    href: "/en/meeting-finder",
    icon: <Users size={18} />,
    theme: "amber",
    tagline: "Best slots across time zones",
  },
  {
    label: "Holidays & Hours",
    href: "/en/holidays",
    icon: <Calendar size={18} />,
    theme: "rose",
    tagline: "Local observance calendar",
  },
  {
    label: "World Clock",
    href: "/en/worldclock",
    icon: <Globe size={18} />,
    theme: "sky",
    tagline: "Live ticking world cities",
  },
  {
    label: "12-Month Calendar",
    href: "/en/calendar",
    icon: <CalendarRange size={18} />,
    theme: "lime",
    tagline: "Year at a glance",
  },
  {
    label: "API Docs",
    href: "/docs/getting-started/quickstart",
    icon: <BookOpen size={18} />,
    theme: "indigo",
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
            className={`tdp-hook tdp-hook--${h.theme}`}
            onClick={(e) => {
              if (typeof window === "undefined") return;
              e.preventDefault();
              window.history.pushState(null, "", h.href);
              window.dispatchEvent(new Event("tdp:navigate"));
            }}
          >
            <div className="tdp-hook-icon" aria-hidden>{h.icon}</div>
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