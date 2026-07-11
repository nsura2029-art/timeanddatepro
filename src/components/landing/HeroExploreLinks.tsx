// src/components/landing/HeroExploreLinks.tsx
// 4x3 grid of pastel-colored tool cards rendered inside the hero,
// just below the clock sync block. NotebookLM-style aesthetic:
// each card has its own soft pastel background, rounded corners,
// subtle shadow, and a slight lift on hover. Icons sit in a
// white-glass square overlay on top of the colored background.

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

type Variant = "lavender" | "mint" | "amber" | "sky";

interface Tool {
  href: string;
  name: string;
  Icon: LucideIcon;
  variant: Variant;
}

const TOOLS: Tool[] = [
  { href: "/time-zone-converter", name: "Time Zone Converter", Icon: Globe2,         variant: "lavender" },
  { href: "/meeting-finder",      name: "Meeting Finder",      Icon: CalendarDays,  variant: "mint"     },
  { href: "/holidays",            name: "Holidays & Hours",    Icon: PartyPopper,   variant: "amber"    },
  { href: "/world-clock",         name: "World Clock",         Icon: Clock,         variant: "sky"      },
  { href: "#",                    name: "12-Month Calendar",   Icon: Calendar,      variant: "lavender" },
  { href: "/api-docs",            name: "API Docs",            Icon: BookOpen,      variant: "sky"      },
  { href: "#",                    name: "Countdown Timer",     Icon: Hourglass,     variant: "mint"     },
  { href: "#",                    name: "Date Difference",     Icon: CalendarRange, variant: "amber"    },
  { href: "#",                    name: "Sunrise & Sunset",    Icon: Sun,           variant: "sky"      },
  { href: "#",                    name: "Daylight Saving",     Icon: CalendarClock, variant: "lavender" },
  { href: "#",                    name: "Stopwatch",           Icon: Timer,         variant: "mint"     },
  { href: "#",                    name: "Unix Timestamp",      Icon: Hash,          variant: "amber"    },
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
        {TOOLS.map(({ href, name, Icon, variant }) => (
          <li
            key={name}
            className="tdp-hero-explore-links-item"
            data-testid={`hero-explore-link-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            data-variant={variant}
          >
            <a
              href={href}
              className={`tdp-hero-explore-links-link tdp-hero-explore-links-link--${variant}`}
            >
              <span className="tdp-hero-explore-links-icon" aria-hidden>
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="tdp-hero-explore-links-text">{name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
