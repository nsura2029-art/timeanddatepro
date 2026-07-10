// src/pages/about/AboutPage.tsx
// About — convertio.co/about style. Customer-centric story, not
// company-centric. 5 sections, 3-4 min read, plain language.
//
// Story arc (convertio framework):
//   1. Story — problem → solution → mission (the "why we exist")
//   2. What we built — concrete product description
//   3. Open source — credibility signal
//   4. Roadmap — what is shipped, what is next (concise timeline)
//   5. Contact — short, real-person sign-off
//
// Content guidelines (polish-7):
// - 3-4 min read
// - No Quick Facts card (was visual noise) — moved 4 facts into Story
// - No GitHub dark CTA card (was redundant with footer link)
// - Stat tiles reduced to one compact line (dropped redundant ones)
// - Credits in a single compact list (was 2-col grid)
// - Roadmap compact (was vertical timeline — too busy)
// - i18n-ready: short sentences, no idioms, no culture-specific jokes

import React, { useEffect, useState } from "react";
import { Mail, Printer, Globe, Github } from "lucide-react";
import "./AboutPage.css";

const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";
const CONTACT_EMAIL = "hello@timeanddatepro.com";
const SUPPORT_EMAIL = "support@timeanddatepro.com";
const PRIVACY_EMAIL = "privacy@timeanddatepro.com";
const GITHUB_URL = "https://github.com/nsura2029-art/timeanddatepro";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: "story",
    title: "Our story",
    body: (
      <>
        <p>
          Every existing time and date website is stuck in 2010. Tables
          of data, low-density information, ads everywhere. We asked:
          what would a time utility look like if it were designed in
          2026?
        </p>
        <p>
          We built {SITE_NAME} as the answer. A clean hero with a
          seven-segment clock. 39 cities visible at a glance. Full
          timezone conversion. Meeting planning. A public REST API that
          any developer can hit for free.
        </p>
        <p>
          Our mission is simple: <strong>make the world's time tools
          beautiful, fast, and open.</strong> No account. No tracking.
          No bloat. Just useful tools that load quickly and look good.
        </p>
        <p>
          We are a small team. We read every email. We respond within
          five business days.
        </p>
      </>
    ),
  },
  {
    id: "what",
    title: "What we built",
    body: (
      <>
        <p>{SITE_NAME} is a set of focused time tools:</p>
        <ul>
          <li>
            <strong>Live world clock</strong> with 39 major cities and
            a sub-second ticking hero clock.
          </li>
          <li>
            <strong>Time Zone Converter</strong> with wall-clock
            conversion and a meeting-time overlap grid.
          </li>
          <li>
            <strong>Meeting Finder</strong> that finds the best
            meeting time across multiple participants.
          </li>
          <li>
            <strong>12-Month Calendar</strong> and{" "}
            <strong>Holidays and Hours</strong> for planning.
          </li>
          <li>
            <strong>Timezone Map</strong> — a full-width interactive
            world map for visual browsing.
          </li>
          <li>
            <strong>World Cup 2026</strong> bracket predictor and
            schedule.
          </li>
          <li>
            <strong>Public REST API</strong> with 17 endpoints for
            developers.
          </li>
        </ul>
        <p>
          All preferences live in your browser. We do not store user
          data on our servers. Time conversions happen in your
          browser using the standard JavaScript{" "}
          <code>Intl.DateTimeFormat</code> API.
        </p>
      </>
    ),
  },
  {
    id: "open",
    title: "Open source",
    body: (
      <>
        <p>
          The whole project is open source on{" "}
          <a className="lp-link" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>{" "}
          under the MIT license. Read the source. File issues. Submit
          pull requests. We accept community contributions.
        </p>
        <p>
          We build on the work of others. Time zone data comes from the
          IANA Time Zone Database. Country reference data comes from
          public-domain government sources plus Wikipedia (CC BY-SA).
          Holiday data comes from official government calendars. We
          thank every maintainer who makes this project possible.
        </p>
        <p>
          We also use Lucide icons, the DSEG14 seven-segment font, the
          Inter and Sora and JetBrains Mono typography, and the
          NotebookLM palette as design inspiration.
        </p>
      </>
    ),
  },
  {
    id: "roadmap",
    title: "Roadmap",
    body: (
      <>
        <p>
          <strong>Shipped:</strong> Hero + 7 tools, World Cup 2026
          page, Timezone Map, Public REST API, Admin panel, full
          documentation site.
        </p>
        <p>
          <strong>Now:</strong> AdSense integration, 5,000+ SEO city
          pages (/time-in/[city]).
        </p>
        <p>
          <strong>Next:</strong> Time-zone conversion pair pages
          (/tz-from-X-to-Y), holiday calendar pages.
        </p>
        <p>
          <strong>Later:</strong> Embeddable clock widget for any
          site, public beta launch on Product Hunt and Hacker News.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>Pick the address that matches your question:</p>
        <ul>
          <li>
            <strong>General</strong> —{" "}
            <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </li>
          <li>
            <strong>Bug reports and feature requests</strong> —{" "}
            <a className="lp-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </li>
          <li>
            <strong>Privacy and data requests</strong> —{" "}
            <a className="lp-link" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
          </li>
        </ul>
        <p>
          We respond within five business days. We never spam. We never
          share your email. We never sell it.
        </p>
      </>
    ),
  },
];

export function AboutPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id || "story");

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
        <div
          className="lp-eyebrow"
          style={{ background: "rgba(168, 85, 247, 0.08)", color: "#7e22ce" }}
        >
          About
        </div>
        <h1 className="lp-title">About {SITE_NAME}</h1>
        <div className="lp-meta__row">
          <span
            className="lp-meta__badge"
            style={{ background: "rgba(168, 85, 247, 0.1)", color: "#7e22ce" }}
          >
            Public beta · 2026
          </span>
          <span className="lp-meta__sep">•</span>
          <span>~3 min read</span>
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
        </aside>

        <div className="lp-content">
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
                Privacy
              </a>
              <a className="lp-foot__btn" href="/terms" onClick={(e) => navigateToLegal("terms", e)}>
                Terms
              </a>
              <a className="lp-foot__btn" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                <Github size={13} /> Source
              </a>
              <button
                type="button"
                className="lp-foot__btn"
                onClick={() => { if (typeof window !== "undefined") window.print(); }}
              >
                <Printer size={13} /> Print
              </button>
              <a className="lp-foot__btn" href={SITE_URL}>
                <Globe size={13} /> {SITE_URL.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}

export default AboutPage;
