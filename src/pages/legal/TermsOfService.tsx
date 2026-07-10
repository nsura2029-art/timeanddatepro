// src/pages/legal/TermsOfService.tsx
// Terms of Service — AdSense + standard SaaS disclaimers.
// Cloudconvert-style 2-column layout: sticky TOC sidebar on the left,
// document content on the right. Renders INSIDE the standard app shell
// (topnav + footer) for visual consistency with the rest of the app.

import React, { useEffect, useState } from "react";
import { ArrowLeft, Mail, Printer, Globe, AlertTriangle } from "lucide-react";

const LAST_UPDATED = "2026-07-10";
const EFFECTIVE_DATE = "2026-07-15";
const CONTACT_EMAIL = "legal@timeanddatepro.com";
const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    body: (
      <p>
        By accessing or using {SITE_NAME} (the "Service") at {SITE_URL} or
        any subdomain thereof, you agree to be bound by these Terms of
        Service ("Terms"). If you do not agree, do not use the Service.
        Your continued use after we post changes constitutes acceptance of
        the updated Terms.
      </p>
    ),
  },
  {
    id: "service",
    title: "What the Service is",
    body: (
      <>
        <p>
          {SITE_NAME} is a free public utility for looking up current time,
          converting between time zones, scheduling meetings across time
          zones, and reading related reference content (calendars, holiday
          lists, daylight-saving time schedules, sports schedules, etc.).
        </p>
        <p>
          The Service is provided "as is". Time zone data is sourced from
          the IANA Time Zone Database and authoritative government /
          public sources. We work hard to keep it accurate but we do not
          guarantee 100% accuracy. For legal, financial, or medical
          scheduling, double-check with a qualified professional.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "No account required",
    body: (
      <p>
        {SITE_NAME} does not require an account. All preferences are stored
        locally in your browser via <code>localStorage</code>. If you clear
        your browser data, your preferences are lost — we have no server
        copy to restore them.
      </p>
    ),
  },
  {
    id: "user-conduct",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service to violate any applicable law or regulation.</li>
          <li>Scrape, crawl, or systematically download data at a rate that exceeds 1 request per second per IP. (Our public API has higher published limits; see the API docs.)</li>
          <li>Attempt to bypass rate limiting, security controls, or access controls.</li>
          <li>Use the Service to attack, disrupt, or interfere with our infrastructure or other users.</li>
          <li>Republish our content (including the IANA-derived time zone data) as if it were yours, without attribution.</li>
          <li>Use the Service in any way that would cause Google to disable our AdSense account (e.g., clicking your own ads, encouraging clicks, etc.).</li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <>
        <p>
          The {SITE_NAME} brand, design, code, and original content are
          owned by us and our contributors. Time zone data is provided
          under the IANA license; holiday data is sourced from
          government / public-domain references and is used with
          attribution.
        </p>
        <p>
          You may quote brief excerpts (under 200 words) from our
          reference content for non-commercial purposes with
          attribution. For longer quotes or commercial use, email{" "}
          <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Third-party services and links",
    body: (
      <>
        <p>
          The Service may contain links to third-party websites and embeds
          from third-party services (Google AdSense for ads, Wikipedia
          for reference content, etc.). We do not control and are not
          responsible for the content, policies, or practices of any
          third party. Your use of third-party services is at your own
          risk and subject to their terms.
        </p>
        <p>
          Specifically, advertising on {SITE_NAME} is provided by Google
          AdSense. Your interactions with ads are governed by{" "}
          <a className="lp-link" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer noopener">Google's ad policies</a>{" "}
          and Google's privacy practices. We do not endorse or guarantee
          any advertised product or service.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <div className="lp-callout">
        <AlertTriangle size={20} className="lp-callout__icon" aria-hidden />
        <p className="lp-callout__body">
          The Service is provided <strong>"as is" and "as available"</strong> without
          warranties of any kind, express or implied, including but not
          limited to warranties of merchantability, fitness for a
          particular purpose, non-infringement, or accuracy. We do not
          warrant that the Service will be uninterrupted, secure, or
          error-free.
        </p>
      </div>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, in no event shall {SITE_NAME}, its operators, contributors, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of data, revenue, profits, or business opportunity) arising out of or related to your use of the Service, even if advised of the possibility of such damages. Our total aggregate liability for any claim shall not exceed <strong>US$100</strong>.
      </p>
    ),
  },
  {
    id: "indemnification",
    title: "Indemnification",
    body: (
      <p>You agree to defend, indemnify, and hold harmless {SITE_NAME} from any claim, demand, loss, or expense (including reasonable attorneys' fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party right.</p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <p>
        We may suspend or terminate the Service at any time, with or
        without notice, for any reason or no reason. We may also block
        specific users or IP ranges that violate these Terms. Upon
        termination, your right to use the Service ceases. Sections
        5, 7, 8, 9, and 11 survive termination.
      </p>
    ),
  },
  {
    id: "misc",
    title: "Miscellaneous",
    body: (
      <>
        <p>
          <strong>Governing law:</strong> These Terms are governed by the
          laws of the State of Delaware, United States, without regard
          to its conflict-of-law principles.
        </p>
        <p>
          <strong>Dispute resolution:</strong> Any dispute arising from
          these Terms will be resolved by binding arbitration in
          Wilmington, Delaware, under the rules of the American
          Arbitration Association. You waive any right to participate in
          a class action.
        </p>
        <p>
          <strong>Severability:</strong> If any provision of these Terms
          is held invalid, the remaining provisions remain in full
          force and effect.
        </p>
        <p>
          <strong>Entire agreement:</strong> These Terms, together with
          the Privacy Policy, constitute the entire agreement between
          you and {SITE_NAME} regarding the Service.
        </p>
      </>
    ),
  },
];

export function TermsOfService() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id || "acceptance");

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

  return (
    <article className="lp">
      <nav className="lp-breadcrumb" aria-label="Breadcrumb">
        <a href="/" onClick={navigateToHome}>Home</a>
        <span className="lp-breadcrumb__sep">/</span>
        <span className="lp-breadcrumb__current">Terms of Service</span>
      </nav>

      <header className="lp-head">
        <div className="lp-eyebrow">Legal · Terms</div>
        <h1 className="lp-title">Terms of Service</h1>
        <div className="lp-meta__row">
          <span className="lp-meta__badge">Last updated · {LAST_UPDATED}</span>
          <span className="lp-meta__sep">•</span>
          <span>Effective {EFFECTIVE_DATE}</span>
          <span className="lp-meta__sep">•</span>
          <span>~10 min read</span>
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
              Questions? <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <div className="lp-foot__actions">
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

export default TermsOfService;
