// src/components/landing/HeroExploreLinks.tsx
// Compact 4x3 grid of tool links rendered inside the hero,
// just below the clock sync block. Simple text links (not the
// colorful gradient cards from the old bottom-of-page section)
// with a small icon + name, left-aligned.
//
// Replaces the old <HeroExploreMore /> at the bottom of the page
// — explore content now lives inside the hero as a peer of the
// clock, not a separate section below the fold.

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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Tool {
  href: string;
  name: string;
  Icon: LucideIcon;
}

const TOOLS: Tool[] = [
  { href: "/time-zone-converter", name: "Time Zone Converter", Icon: Globe2 },
  { href: "/meeting-finder", name: "Meeting Finder", Icon: CalendarDays },
  { href: "/holidays", name: "Holidays & Hours", Icon: PartyPopper },
  { href: "/world-clock", name: "World Clock", Icon: Clock },
  { href: "#", name: "12-Month Calendar", Icon: Calendar },
  { href: "/api-docs", name: "API Docs", Icon: BookOpen },
  { href: "#", name: "Countdown Timer", Icon: Hourglass },
  { href: "#", name: "Date Difference", Icon: CalendarRange },
  { href: "#", name: "Sunrise & Sunset", Icon: Sun },
  { href: "#", name: "Daylight Saving", Icon: CalendarClock },
  { href: "#", name: "Stopwatch", Icon: Timer },
  { href: "#", name: "Unix Timestamp", Icon: Hash },
];

export function HeroExploreLinks() {
  return (
    <section
      className="tdp-hero-explore-links"
      aria-label="Explore more TimeAndDatePro tools"
      data-testid="hero-explore-links"
    >
      <header className="tdp-hero-explore-links-header">
        <h3 className="tdp-hero-explore-links-eyebrow">Explore more</h3>
        <span className="tdp-hero-explore-links-meta">12 tools</span>
      </header>

      <ul
        className="tdp-hero-explore-links-grid"
        data-testid="hero-explore-links-grid"
      >
        {TOOLS.map(({ href, name, Icon }) => (
          <li key={name} className="tdp-hero-explore-links-item">
            <a
              href={href}
              className="tdp-hero-explore-links-link"
              data-testid={`hero-explore-link-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            >
              <span className="tdp-hero-explore-links-icon" aria-hidden>
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="tdp-hero-explore-links-text">{name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
