// src/pages/legal/PrivacyPolicy.tsx
// Privacy Policy — AdSense + GDPR + CCPA compliance.
//
// Content guidelines (polish-7):
// - 3-4 min read target (was ~10 min)
// - 7 sections (was 11); merged Security/Retention/Children/Changes
//   into the relevant sections they belong to
// - Plain language, short sentences, no idioms
// - i18n-ready: no compound metaphors, no culture-specific references,
//   consistent present-tense, no contractions
// - Still emits all 7 legally-required disclosures for AdSense + GDPR

import React, { useEffect, useState } from "react";
import { Info, Mail, Printer, Globe } from "lucide-react";

const LAST_UPDATED = "2026-07-10";
const EFFECTIVE_DATE = "2026-07-15";
const CONTACT_EMAIL = "privacy@timeanddatepro.com";
const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: "summary",
    title: "Summary",
    body: (
      <>
        <p>
          {SITE_NAME} is a free public service for looking up the current
          time, converting between time zones, and scheduling meetings. We
          do not require an account. We do not sell personal data. We
          display ads through Google AdSense on some pages.
        </p>
        <p>
          This page explains what data we collect, why we collect it, who
          we share it with, and the choices you have. If anything is
          unclear, email us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="lp-link">
            {CONTACT_EMAIL}
          </a>{" "}
          and a person will reply within five business days.
        </p>
        <div className="lp-callout">
          <Info size={20} className="lp-callout__icon" aria-hidden />
          <p className="lp-callout__body">
            <strong>Short version:</strong> We collect almost nothing.
            Your preferences stay in your browser. We use one
            privacy-friendly analytics tool if you accept cookies.
            Google AdSense is the only third party that may see your
            visit. You can opt out at any time.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "data",
    title: "What we collect",
    body: (
      <>
        <p>We collect the minimum data needed to run the service:</p>
        <ul>
          <li>
            <strong>Browser timezone.</strong> Inferred from the standard
            JavaScript <code>Intl.DateTimeFormat</code> API at page load.
            Used to show your home city. Not stored.
          </li>
          <li>
            <strong>IP address.</strong> Used by our edge network to
            route your request to the nearest server. We retain the raw
            IP for 24 hours, then store a hashed version for 30 days for
            abuse detection.
          </li>
          <li>
            <strong>Local preferences.</strong> Your selected cities
            and the 12-hour or 24-hour toggle. Stored in your browser
            under <code>global_time_workspace_prefs</code>,{" "}
            <code>tdp_user_cities</code>, and <code>tdp_hour12</code>.
            Cleared when you clear your browser data. Not sent to us.
          </li>
          <li>
            <strong>Anonymous analytics.</strong> If you accept the
            cookie banner, we count page views and which tools you
            used. No personal identifiers. No cross-site tracking. No
            fingerprinting.
          </li>
        </ul>
        <p>
          We do not collect your name, email, phone number, precise
          location, or any data from children under 13.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and advertising",
    body: (
      <>
        <p>
          We use one first-party cookie to remember whether you accepted
          or rejected the cookie banner. The cookie is set only after you
          click a button. It contains no personal data.
        </p>
        <p>
          If you accept, Google AdSense may set cookies to show ads
          that match your interests, cap ad frequency, and measure ad
          performance. Learn more at{" "}
          <a className="lp-link" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer noopener">
            Google advertising policy
          </a>.
        </p>
        <p>
          You may opt out of personalized advertising at{" "}
          <a className="lp-link" href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer noopener">
            Google Ads Settings
          </a>{" "}
          or <a className="lp-link" href="https://www.aboutads.info" target="_blank" rel="noreferrer noopener">aboutads.info</a>.
        </p>
        <p>
          You can withdraw consent at any time by clearing your browser
          data or by clicking Cookie settings in the footer.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share with",
    body: (
      <>
        <p>We share data only with the parties below, and only the minimum needed:</p>
        <ul>
          <li>
            <strong>Google</strong> (AdSense and analytics). Google acts
            as our data processor under a Data Processing Agreement.
          </li>
          <li>
            <strong>Hosting providers</strong> (Cloudflare CDN, data
            center). They process requests on our behalf under standard
            cloud-provider agreements.
          </li>
          <li>
            <strong>Law enforcement</strong>, only if compelled by a
            valid subpoena or court order. We will challenge overly
            broad requests and notify users when legally permitted.
          </li>
        </ul>
        <p>
          We do not sell, rent, or trade your data. "Sale" under CCPA
          does not apply because we do not collect personal information.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Depending on where you live, you have some or all of these rights:</p>
        <ul>
          <li>
            <strong>Right to know</strong> what data we hold. We hold
            almost none.
          </li>
          <li>
            <strong>Right to delete.</strong> Clear your browser
            localStorage and cookies. Your data is gone. We have no
            server copy to delete.
          </li>
          <li>
            <strong>Right to opt out of sale.</strong> We do not sell
            data. You can still opt out of personalized ads through
            Google Ads Settings.
          </li>
          <li>
            <strong>Right to portability.</strong> Your localStorage
            data is yours in JSON form. Export it through browser
            developer tools.
          </li>
          <li>
            <strong>Right to complain</strong> to your local data
            protection authority (EU users) or the California Attorney
            General (CA users).
          </li>
        </ul>
        <p>
          To exercise any right, email{" "}
          <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          We respond within 30 days, usually within five.
        </p>
        <p>
          <strong>Security and retention:</strong> We use HTTPS only
          with TLS 1.3 and HSTS. We rate-limit all public API endpoints.
          Server logs expire after 30 days. Analytics aggregates expire
          after 24 months. We do not store unhashed IP addresses beyond
          24 hours.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        {SITE_NAME} is not directed at children under 13. We do not
        knowingly collect data from children. If you believe a child
        has used this service and you would like their preferences
        cleared, email{" "}
        <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
        with the relevant details.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and changes",
    body: (
      <>
        <p>
          For any question about this policy, email{" "}
          <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          We respond within five business days.
        </p>
        <p>
          We may update this policy. Material changes are announced on
          the homepage for at least 14 days before they take effect.
          The date at the top of this page reflects the current
          version. This policy is effective {EFFECTIVE_DATE}.
        </p>
      </>
    ),
  },
];

export function PrivacyPolicy() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id || "summary");

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
        <span className="lp-breadcrumb__current">Privacy Policy</span>
      </nav>

      <header className="lp-head">
        <div className="lp-eyebrow">Legal · Privacy</div>
        <h1 className="lp-title">Privacy Policy</h1>
        <div className="lp-meta__row">
          <span className="lp-meta__badge">Updated · {LAST_UPDATED}</span>
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

export default PrivacyPolicy;
