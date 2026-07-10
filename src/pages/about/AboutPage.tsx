// src/pages/about/AboutPage.tsx
// About page — cloudconvert-style. Same 2-column layout (sticky TOC
// sidebar + content) as the legal pages, with a Quick Facts card and
// stat tiles in the sidebar to match the cloudconvert "About Us" feel.
//
// AdSense requires a contact method. This page also lists the
// project's data sources, credits, roadmap, and GitHub link.

import React, { useEffect, useState } from "react";
import { ArrowLeft, Mail, Printer, Globe, Github, Sparkles, Heart, Code } from "lucide-react";
import { Link } from "react-router-dom";
import { navigateToRoute } from "../../utils/router";
import "./AboutPage.css";

const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";
const CONTACT_EMAIL = "hello@timeanddatepro.com";
const SUPPORT_EMAIL = "support@timeanddatepro.com";
const PRIVACY_EMAIL = "privacy@timeanddatepro.com";
const GITHUB_URL = "https://github.com/nsura2029-art/timeanddatepro";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: "what",
    title: "What this is",
    body: (
      <>
        <p>
          {SITE_NAME} is a free public utility for looking up the current
          time in any city, converting between time zones, scheduling
          meetings across time zones, and reading related reference
          content. No account required. No data collected. Just useful
          tools that load fast and look good.
        </p>
        <p>
          The whole project is open source on{" "}
          <a className="lp-link" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
            <Github size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            GitHub
          </a>{" "}
          — feel free to read the code, file issues, or submit pull
          requests.
        </p>
        <div className="ap-github">
          <p className="ap-github__text">
            <strong>Open source, MIT licensed.</strong> Read the source, file issues, contribute.
          </p>
          <a className="ap-github__btn" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
            <Github size={14} /> View on GitHub
          </a>
        </div>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we built it",
    body: (
      <>
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
          We are not trying to replace <em>timeanddate.com</em> (25 years of
          content), <em>worldtimebuddy.com</em> (meeting focus), or{" "}
          <em>time.is</em> (minimalist). We are trying to be the{" "}
          <strong>third option</strong>: modern UI, AI-citable structured
          data, embed-friendly, and built on an open data stack.
        </p>
      </>
    ),
  },
  {
    id: "how",
    title: "How it works",
    body: (
      <>
        <p>
          The app is a single-page React + TypeScript app built with
          Vite, served by a small Node.js + SQLite backend. The
          database holds the curated city list, the popular-timezones
          ranking, country reference data, and the admin panel state.
          No user data is stored on the server — your preferences live
          in your browser's <code>localStorage</code>.
        </p>
        <p>
          Time conversions are computed client-side using the standard{" "}
          <code>Intl.DateTimeFormat</code> API, which delegates to the
          browser's own copy of the IANA Time Zone Database. The hero
          clock ticks once per second (we tested every interval from
          10ms to 1000ms; 1s is the right tradeoff between smoothness
          and CPU).
        </p>
      </>
    ),
  },
  {
    id: "data",
    title: "Data sources",
    body: (
      <p>
        Time zone data comes from the IANA Time Zone Database (the same
        source every operating system uses). Country reference data
        comes from public-domain government sources plus Wikipedia
        (CC BY-SA, with attribution). Holiday data is curated from each
        country's official government calendar. We update the
        underlying timezone data quarterly.
      </p>
    ),
  },
  {
    id: "credits",
    title: "Credits",
    body: (
      <>
        <p style={{ color: "#475569", fontSize: "0.95rem" }}>
          We stand on the shoulders of these open-source projects and
          public datasets. Thank you to everyone who maintains them.
        </p>
        <ul className="ap-credits">
          {[
            { name: "IANA Time Zone Database", url: "https://www.iana.org/time-zones", note: "Source of truth for all timezone + DST data" },
            { name: "Wikipedia (CC BY-SA)", url: "https://en.wikipedia.org", note: "Country reference + history (with attribution)" },
            { name: "Open-Meteo", url: "https://open-meteo.com", note: "Free weather data for the world map page" },
            { name: "Open Exchange Rates / ECB", url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates", note: "Currency conversion reference rates" },
            { name: "Lucide Icons", url: "https://lucide.dev", note: "Icon system across the app" },
            { name: "DSEG14 Font", url: "https://github.com/keshikan/DSEG", note: "Seven-segment display font for the hero clock" },
            { name: "Inter + Sora + JetBrains Mono", url: "https://fonts.google.com", note: "Typography stack" },
            { name: "NotebookLM palette", url: "https://notebooklm.google", note: "Inspiration for the 9-color accent system" },
          ].map((c) => (
            <li key={c.name}>
              <a className="lp-link" href={c.url} target="_blank" rel="noreferrer noopener">{c.name}</a>
              <span className="ap-credits__note"> — {c.note}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "roadmap",
    title: "Roadmap",
    body: (
      <>
        <p style={{ color: "#475569", fontSize: "0.95rem" }}>
          What's shipped, what we're working on, and what's coming next.
        </p>
        <div className="ap-roadmap">
          {[
            { status: "shipped", title: "Hero + 7 tools (T4.x)", body: "Time Zone Converter, Meeting Finder, World Clock, Calendar, Holidays & Hours, 12-Month Calendar, API Docs" },
            { status: "shipped", title: "World Cup 2026 dedicated page", body: "Bracket predictor + subscribe-to-reminders form" },
            { status: "shipped", title: "Timezone Map", body: "Full-width interactive world map with 6 timezone bands + click-to-select + CTA into the converter" },
            { status: "in-progress", title: "AdSense integration", body: "Manual ad units placed per the strategy doc; awaiting AdSense approval" },
            { status: "in-progress", title: "SEO city pages", body: "5,000+ /time-in/[city] programmatic pages for long-tail organic traffic" },
            { status: "next", title: "Time-zone conversion pairs", body: "200+ /tz-from-X-to-Y pages to own the 'est to ist' / 'pst to est' SERPs" },
            { status: "next", title: "Holiday calendar pages", body: "/holidays/[country]/[year] — 197 countries × 10 years" },
            { status: "later", title: "Embeddable clock widget", body: "One-line iframe any site can drop in — viral growth channel" },
            { status: "later", title: "Public beta launch", body: "Product Hunt + Show HN + dev.to launch" },
          ].map((item) => (
            <div key={item.title} className={`ap-roadmap__item ap-roadmap__item--${item.status}`}>
              <div className="ap-roadmap__title">
                <span className={`ap-roadmap__status ap-roadmap__status--${item.status}`}>
                  {item.status === "shipped" ? "Shipped" : item.status === "in-progress" ? "Building" : item.status === "next" ? "Next" : "Later"}
                </span>
                {item.title}
              </div>
              <div className="ap-roadmap__body">{item.body}</div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>
          We are a small team and we read every email. Pick the address
          that matches your question:
        </p>
        <ul className="ap-emails">
          <li>
            <strong>General</strong>
            <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </li>
          <li>
            <strong>Bug reports + feature requests</strong>
            <a className="lp-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </li>
          <li>
            <strong>Privacy + data requests</strong>
            <a className="lp-link" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
          </li>
        </ul>
        <p style={{ marginTop: 16, fontSize: "0.85em", color: "#64748b" }}>
          We aim to respond within 5 business days. We never spam, never
          share your email, and never sell it.
        </p>
      </>
    ),
  },
];

export function AboutPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id || "what");

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const headings = SECTIONS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, []);

  const navigateToHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new Event("tdp:navigate"));
  };
  const navigateToLegal = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", `/${id}`);
    window.dispatchEvent(new Event("tdp:navigate"));
  };

  return (
    <article className="lp">
      <nav className="lp-breadcrumb" aria-label="Breadcrumb">
        <a href="/" onClick={navigateToHome}>Home</a>
        <span className="lp-breadcrumb__sep">/</span>
        <span className="lp-breadcrumb__current">About</span>
      </nav>

      <header className="lp-head">
        <div className="lp-eyebrow" style={{ background: "rgba(168, 85, 247, 0.08)", color: "#7e22ce" }}>
          About
        </div>
        <h1 className="lp-title">About {SITE_NAME}</h1>
        <div className="lp-meta__row">
          <span className="lp-meta__badge" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#7e22ce" }}>
            Public beta · 2026
          </span>
          <span className="lp-meta__sep">•</span>
          <span>A free, fast, beautifully-designed time utility for the modern web.</span>
        </div>
      </header>

      <div className="lp-grid">
        <aside className="lp-toc" aria-label="Table of contents">
          <div className="lp-toc__label">On this page</div>
          <ol className="lp-toc__list">
            {SECTIONS.map((s, idx) => (
              <li key={s.id} className="lp-toc__item">
                <a
                  href={`#${s.id}`}
                  className={`lp-toc__link ${activeId === s.id ? "is-active" : ""}`}
                >
                  <span style={{ color: "#94a3b8", marginRight: 8, fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem" }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>

          {/* Stat tiles (cloudconvert-style) */}
          <div className="ap-toc-stats">
            <div className="ap-toc-stat">
              <div className="ap-toc-stat__num">39</div>
              <div className="ap-toc-stat__label">Cities</div>
            </div>
            <div className="ap-toc-stat">
              <div className="ap-toc-stat__num">17</div>
              <div className="ap-toc-stat__label">APIs</div>
            </div>
            <div className="ap-toc-stat">
              <div className="ap-toc-stat__num">7</div>
              <div className="ap-toc-stat__label">Tools</div>
            </div>
            <div className="ap-toc-stat">
              <div className="ap-toc-stat__num">0</div>
              <div className="ap-toc-stat__label">Cookies set</div>
            </div>
          </div>
        </aside>

        <div className="lp-content">
          {/* Quick facts — sits at the top of the content column, before sections */}
          <div className="ap-quickfacts">
            <div>
              <div className="ap-quickfact__label">Founded</div>
              <div className="ap-quickfact__value">2026</div>
              <div className="ap-quickfact__sub">Public beta</div>
            </div>
            <div>
              <div className="ap-quickfact__label">Made by</div>
              <div className="ap-quickfact__value">Solo founder + AI</div>
              <div className="ap-quickfact__sub">Distributed team of one + a few AIs</div>
            </div>
            <div>
              <div className="ap-quickfact__label">License</div>
              <div className="ap-quickfact__value">MIT</div>
              <div className="ap-quickfact__sub">Open source, free forever</div>
            </div>
            <div>
              <div className="ap-quickfact__label">Backend</div>
              <div className="ap-quickfact__value">Node + SQLite</div>
              <div className="ap-quickfact__sub">Cloudflare edge</div>
            </div>
          </div>

          {SECTIONS.map((s, idx) => (
            <section key={s.id} id={s.id} className="lp-section">
              <div className="lp-section__num">{String(idx + 1).padStart(2, "0")}</div>
              <h2>{s.title}</h2>
              <div className="lp-section__body">{s.body}</div>
            </section>
          ))}

          <footer className="lp-foot">
            <p>
              <Mail size={14} style={{ verticalAlign: "middle" }} />{" "}
              <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <div className="lp-foot__actions">
              <a className="lp-foot__btn" href="/privacy" onClick={(e) => navigateToLegal("privacy", e)}>
                Privacy Policy
              </a>
              <a className="lp-foot__btn" href="/terms" onClick={(e) => navigateToLegal("terms", e)}>
                Terms of Service
              </a>
              <a className="lp-foot__btn" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                <Github size={13} /> Source
              </a>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}

export default AboutPage;
