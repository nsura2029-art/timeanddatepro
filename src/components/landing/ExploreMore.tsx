// src/components/landing/ExploreMore.tsx
// Six tool/quick-link hooks. One component = one purpose: surface the
// most-clicked destinations in a 6-up grid (collapses to 3 / 2 on smaller
// screens). All hrefs use the same pushState + tdp:navigate pattern as
// the chrome so the SPA navigation stays consistent.

import React from "react";
import {
  ArrowRightLeft,
  Users,
  Calendar,
  Globe,
  CalendarRange,
  BookOpen,
} from "lucide-react";

interface Hook {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const HOOKS: Hook[] = [
  { label: "Time Zone Converter", href: "/en/time-zone-converter", icon: <ArrowRightLeft size={14} /> },
  { label: "Meeting Finder",       href: "/en/meeting-finder",      icon: <Users size={14} /> },
  { label: "Holidays & Hours",     href: "/en/holidays",            icon: <Calendar size={14} /> },
  { label: "World Clock",          href: "/en/worldclock",          icon: <Globe size={14} /> },
  { label: "12-Month Calendar",    href: "/en/calendar",            icon: <CalendarRange size={14} /> },
  { label: "API Docs",             href: "/docs/getting-started/quickstart", icon: <BookOpen size={14} /> },
];

export function ExploreMore() {
  return (
    <section className="tdp-section" aria-label="Explore more tools">
      <div className="tdp-section-label">
        <span className="tag">⌥</span>
        Explore more
        <span className="meta">6 tools · always one click away</span>
      </div>
      <div className="tdp-hooks">
        {HOOKS.map((h) => (
          <a
            key={h.href}
            href={h.href}
            className="tdp-hook"
            onClick={(e) => {
              if (typeof window === "undefined") return;
              e.preventDefault();
              window.history.pushState(null, "", h.href);
              window.dispatchEvent(new Event("tdp:navigate"));
            }}
          >
            <span className="ico">{h.icon}</span>
            <span>{h.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}