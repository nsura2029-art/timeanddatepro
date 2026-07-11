// src/components/landing/HeroExploreCards.tsx
// 4 featured tool cards in 2 rows of 2, rendered directly below the
// hero clock. Compact CTAs (icon + category + title + description + arrow)
// that link to the existing tools (Meeting Finder, TimeZone Converter,
// World Clock, Holidays).
//
// Why 2 rows: the user explicitly asked for "explore section in 2 rows"
// below the time. We use 4 cards × 2 rows (2 per row on desktop,
// stacked on mobile).

import { CalendarDays, Globe2, Clock, PartyPopper, ArrowUpRight } from "lucide-react";

interface ToolCard {
  href: string;
  category: string;
  title: string;
  description: string;
  Icon: typeof CalendarDays;
  variant: "lavender" | "mint" | "amber" | "sky";
}

const CARDS: ToolCard[] = [
  {
    href: "/meeting-finder",
    category: "TOOL",
    title: "Find a meeting time",
    description: "Compare your saved cities instantly.",
    Icon: CalendarDays,
    variant: "lavender",
  },
  {
    href: "/time-zone-converter",
    category: "TOOL",
    title: "Convert time zones",
    description: "Convert any city, time, or UTC offset.",
    Icon: Globe2,
    variant: "mint",
  },
  {
    href: "/world-clock",
    category: "TOOL",
    title: "World clock",
    description: "See all your cities on a single timeline.",
    Icon: Clock,
    variant: "sky",
  },
  {
    href: "/holidays",
    category: "TOOL",
    title: "Holidays & hours",
    description: "Working hours, weekends, and public holidays.",
    Icon: PartyPopper,
    variant: "amber",
  },
];

export function HeroExploreCards() {
  return (
    <div className="tdp-hero-explore" aria-label="Explore TimeAndDatePro tools">
      {CARDS.map(({ href, category, title, description, Icon, variant }) => (
        <a
          key={href}
          href={href}
          className={`tdp-hero-explore-card tdp-hero-explore-card--${variant}`}
          data-testid={`explore-card-${href.replace(/\//g, "")}`}
        >
          <span className="tdp-hero-explore-icon-wrap" aria-hidden>
            <Icon size={18} strokeWidth={2.2} />
          </span>
          <span className="tdp-hero-explore-text">
            <span className="tdp-hero-explore-category">{category}</span>
            <span className="tdp-hero-explore-title">{title}</span>
            <span className="tdp-hero-explore-desc">{description}</span>
          </span>
          <span className="tdp-hero-explore-arrow" aria-hidden>
            <ArrowUpRight size={16} />
          </span>
        </a>
      ))}
    </div>
  );
}
