// src/components/landing/HeroExploreMore.tsx
// Full-width "Explore more" section rendered at the bottom of the
// landing page (replaces the old <ExploreMore />). 6 tools in a
// 2-row x 3-column grid. Each card has a colored background, an
// icon, an uppercase eyebrow, a bold tool name, and a top-right
// arrow that rotates on hover.
//
// Replaces the old compact 6-card tool grid with a more prominent
// notebook-style section. Each card is a clickable link routing
// to the existing tool routes; routes that don't exist yet (e.g.
// 12-Month Calendar) link to # as a placeholder.

import {
  ArrowUpRight,
  CalendarDays,
  Globe2,
  PartyPopper,
  Clock,
  Calendar,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Tool {
  /** URL to navigate to when the card is clicked */
  href: string;
  /** Short uppercase eyebrow shown above the tool name */
  eyebrow: string;
  /** Bold tool name */
  name: string;
  /** Color variant for the background */
  variant: "lavender" | "mint" | "amber" | "sky";
  /** Icon component for the small square in the top-left */
  Icon: LucideIcon;
}

const TOOLS: Tool[] = [
  {
    href: "/time-zone-converter",
    eyebrow: "Find the perfect overlap",
    name: "Time Zone Converter",
    variant: "lavender",
    Icon: Globe2,
  },
  {
    href: "/meeting-finder",
    eyebrow: "Best slots across time zones",
    name: "Meeting Finder",
    variant: "mint",
    Icon: CalendarDays,
  },
  {
    href: "/holidays",
    eyebrow: "Local observance calendar",
    name: "Holidays & Hours",
    variant: "amber",
    Icon: PartyPopper,
  },
  {
    href: "/world-clock",
    eyebrow: "Live ticking world cities",
    name: "World Clock",
    variant: "sky",
    Icon: Clock,
  },
  {
    href: "#", // 12-Month Calendar — route doesn't exist yet
    eyebrow: "Year at a glance",
    name: "12-Month Calendar",
    variant: "lavender",
    Icon: Calendar,
  },
  {
    href: "/api-docs",
    eyebrow: "Integrate in minutes",
    name: "API Docs",
    variant: "sky",
    Icon: BookOpen,
  },
];

export function HeroExploreMore() {
  return (
    <section
      className="tdp-explore-more"
      aria-label="Explore more TimeAndDatePro tools"
      data-testid="explore-more"
    >
      <header className="tdp-explore-more-header">
        <h2 className="tdp-explore-more-title">Explore more</h2>
        <span className="tdp-explore-more-meta">6 tools · always one click away</span>
      </header>

      <div className="tdp-explore-more-grid" data-testid="explore-more-grid">
        {TOOLS.map(({ href, eyebrow, name, variant, Icon }, idx) => (
          <a
            key={href + idx}
            href={href}
            className={`tdp-explore-more-card tdp-explore-more-card--${variant}`}
            data-testid={`explore-more-card-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          >
            <span
              className="tdp-explore-more-icon"
              aria-hidden
            >
              <Icon size={20} strokeWidth={2.2} />
            </span>
            <span className="tdp-explore-more-text">
              <span className="tdp-explore-more-eyebrow">{eyebrow}</span>
              <span className="tdp-explore-more-name">{name}</span>
            </span>
            <span className="tdp-explore-more-arrow" aria-hidden>
              <ArrowUpRight size={20} />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
