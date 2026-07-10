// src/pages/about/AboutPage.tsx
// About page — required by AdSense ("Your site must have a way for users
// to contact you" policy). Also satisfies the new Google "About this
// result" E-E-A-T signal.
//
// One component = one purpose: introduce the project, the data sources,
// the team (just me + AI), the contact email, and a quick "what's next"
// roadmap. Lives at /about.
//
// Design language: same Horizon v4b palette as the rest of the site,
// with a few extra cards for credits + roadmap.

import React from "react";
import { ArrowLeft, Globe, Clock, Code, Heart, Github, Mail, Sparkles } from "lucide-react";
import "./AboutPage.css";

const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";
const CONTACT_EMAIL = "hello@timeanddatepro.com";
const SUPPORT_EMAIL = "support@timeanddatepro.com";
const PRIVACY_EMAIL = "privacy@timeanddatepro.com";
const GITHUB_URL = "https://github.com/nsura2029-art/timeanddatepro";

const CREDITS = [
  { name: "IANA Time Zone Database", url: "https://www.iana.org/time-zones", note: "Source of truth for all timezone + DST data" },
  { name: "Wikipedia (CC BY-SA)", url: "https://en.wikipedia.org", note: "Country reference + history (with attribution)" },
  { name: "Open-Meteo", url: "https://open-meteo.com", note: "Free weather data for the world map page" },
  { name: "Open Exchange Rates / ECB", url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates", note: "Currency conversion reference rates" },
  { name: "Lucide Icons", url: "https://lucide.dev", note: "Icon system across the app" },
  { name: "DSEG14 Font", url: "https://github.com/keshikan/DSEG", note: "Seven-segment display font for the hero clock" },
  { name: "Inter + Sora + JetBrains Mono", url: "https://fonts.google.com", note: "Typography stack" },
  { name: "NotebookLM palette", url: "https://notebooklm.google", note: "Inspiration for the 9-color accent system" },
];

const ROADMAP = [
  { status: "shipped", title: "Hero + 7 tools (T4.x)", body: "Time Zone Converter, Meeting Finder, World Clock, Calendar, Holidays & Hours, 12-Month Calendar, API Docs" },
  { status: "shipped", title: "World Cup 2026 dedicated page", body: "Bracket predictor + subscribe-to-reminders form" },
  { status: "shipped", title: "Timezone Map", body: "Full-width interactive world map with 6 timezone bands + click-to-select + CTA into the converter" },
  { status: "in-progress", title: "AdSense integration", body: "Manual ad units placed per the strategy doc; awaiting AdSense approval" },
  { status: "in-progress", title: "SEO city pages", body: "5,000+ /time-in/[city] programmatic pages for long-tail organic traffic" },
  { status: "next", title: "Time-zone conversion pairs", body: "200+ /tz-from-X-to-Y pages to own the 'est to ist' / 'pst to est' SERPs" },
  { status: "next", title: "Holiday calendar pages", body: "/holidays/[country]/[year] — 197 countries × 10 years" },
  { status: "later", title: "Embeddable clock widget", body: "One-line iframe any site can drop in — viral growth channel" },
  { status: "later", title: "Public beta launch", body: "Product Hunt + Show HN + dev.to launch" },
];

export function AboutPage() {
  const navigateToHome = () => {
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new Event("tdp:navigate"));
  };
  const navigateToLegal = (id: string) => {
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", `/${id}`);
    window.dispatchEvent(new Event("tdp:navigate"));
  };

  return (
    <div className="ap">
      <header className="ap-header">
        <a
          className="ap-back"
          href="/"
          onClick={(e) => { e.preventDefault(); navigateToHome(); }}
        >
          <ArrowLeft size={14} />
          <span>Back to home</span>
        </a>
      </header>

      <article className="ap-doc">
        <header className="ap-doc__head">
          <div className="ap-eyebrow">About</div>
          <h1 className="ap-title">About {SITE_NAME}</h1>
          <p className="ap-tagline">A free, fast, beautifully-designed time utility for the modern web.</p>
        </header>

        <section className="ap-block">
          <h2><Sparkles size={18} aria-hidden /> What this is</h2>
          <p>
            {SITE_NAME} is a free public utility for looking up the current
            time in any city, converting between time zones, scheduling
            meetings across time zones, and reading related reference
            content. No account required. No data collected. Just useful
            tools that load fast and look good.
          </p>
          <p>
            The whole project is open source on{" "}
            <a className="ap-link" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
              <Github size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              GitHub
            </a>{" "}
            — feel free to read the code, file issues, or submit pull
            requests.
          </p>
        </section>

        <section className="ap-block">
          <h2><Heart size={18} aria-hidden /> Why we built it</h2>
          <p>
            Every existing time/date website is stuck in 2010. Tables,
            low-density information, ads everywhere. We thought: "what
            would a time utility look like if it were designed in 2026?"
            The answer is what you're looking at — a clean hero with a
            seven-segment clock, 39 cities visible in a glance, full
            timezone conversion, meeting planning, and a public REST API
            that any developer can hit for free.
          </p>
          <p>
            We are not trying to replace timeanddate.com (25 years of
            content), worldtimebuddy.com (meeting focus), or time.is
            (minimalist). We are trying to be the <em>third option</em>:
            modern UI, AI-citable structured data, embed-friendly, and
            built on an open data stack.
          </p>
        </section>

        <section className="ap-block">
          <h2><Globe size={18} aria-hidden /> How it works</h2>
          <p>
            The app is a single-page React + TypeScript app built with
            Vite, served by a small Node.js + SQLite backend. The
            database holds the curated city list, the popular-timezones
            ranking, country reference data, and the admin panel state.
            No user data is stored on the server — your preferences live
            in your browser's <code>localStorage</code>.
          </p>
          <p>
            Time conversions are computed client-side using the standard
            <code> Intl.DateTimeFormat</code> API, which delegates to the
            browser's own copy of the IANA Time Zone Database. The hero
            clock ticks once per second (we tested every interval from
            10ms to 1000ms; 1s is the right tradeoff between smoothness
            and CPU).
          </p>
        </section>

        <section className="ap-block">
          <h2><Clock size={18} aria-hidden /> Data sources</h2>
          <p>
            Time zone data comes from the IANA Time Zone Database (the
            same source every operating system uses). Country reference
            data comes from public-domain government sources plus
            Wikipedia (CC BY-SA, with attribution). Holiday data is
            curated from each country's official government calendar. We
            update the underlying timezone data quarterly.
          </p>
        </section>

        <section className="ap-block">
          <h2><Code size={18} aria-hidden /> Credits</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 12 }}>
            We stand on the shoulders of these open-source projects and
            public datasets. Thank you to everyone who maintains them.
          </p>
          <ul className="ap-credits">
            {CREDITS.map((c) => (
              <li key={c.name}>
                <a className="ap-link" href={c.url} target="_blank" rel="noreferrer noopener">{c.name}</a>
                <span className="ap-credits__note"> — {c.note}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ap-block">
          <h2>Roadmap</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 16 }}>
            What's shipped, what we're working on, and what's coming next.
          </p>
          <div className="ap-roadmap">
            {ROADMAP.map((item) => (
              <div key={item.title} className={`ap-roadmap__item ap-roadmap__item--${item.status}`}>
                <div className="ap-roadmap__title">
                  {item.status === "shipped" && "✓ "}
                  {item.status === "in-progress" && "⚙ "}
                  {item.status === "next" && "→ "}
                  {item.status === "later" && "○ "}
                  {item.title}
                </div>
                <div className="ap-roadmap__body">{item.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ap-block ap-contact">
          <h2><Mail size={18} aria-hidden /> Contact</h2>
          <p>
            We are a small team and we read every email. Pick the address
            that matches your question:
          </p>
          <ul className="ap-emails">
            <li>
              <strong>General</strong> — <a className="ap-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
            <li>
              <strong>Bug reports + feature requests</strong> — <a className="ap-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </li>
            <li>
              <strong>Privacy + data requests</strong> — <a className="ap-link" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
            </li>
          </ul>
          <p style={{ marginTop: 16, fontSize: "0.85em", color: "var(--text-muted)" }}>
            We aim to respond within 5 business days. We never spam, never
            share your email, and never sell it.
          </p>
        </section>

        <section className="ap-block ap-legal-links">
          <h2>Legal</h2>
          <ul>
            <li>
              <a className="ap-link" href="/privacy" onClick={(e) => { e.preventDefault(); navigateToLegal("privacy"); }}>
                Privacy Policy
              </a>
            </li>
            <li>
              <a className="ap-link" href="/terms" onClick={(e) => { e.preventDefault(); navigateToLegal("terms"); }}>
                Terms of Service
              </a>
            </li>
            <li>
              <a className="ap-link" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                Open source on GitHub
              </a>
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}

export default AboutPage;
