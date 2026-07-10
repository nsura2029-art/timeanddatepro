// src/pages/legal/PrivacyPolicy.tsx
// Privacy Policy — AdSense + GDPR + CCPA compliance.
// Single component = one purpose: render the policy with table-of-contents
// anchors, contact email, and a last-updated timestamp.
//
// Plain prose (no marketing language), broken into 11 sections that map
// 1:1 to the disclosures required by:
//   - Google AdSense Program Policies (https://support.google.com/adsense/answer/9878)
//   - GDPR Articles 13/14 (right to be informed)
//   - CCPA / CPRA (right to know + right to opt out)
//
// Last-updated date is rendered at the top so users always know they're
// reading the current version.

import React from "react";
import { ArrowLeft, Mail } from "lucide-react";

const LAST_UPDATED = "2026-07-10";
const CONTACT_EMAIL = "privacy@timeanddatepro.com";
const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";
const EFFECTIVE_DATE = "2026-07-15";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: "summary",
    title: "1. Summary",
    body: (
      <>
        <p>
          {SITE_NAME} is a free public service for looking up current time,
          time zone conversions, and meeting planning. We do not require an
          account. We do not sell personal data. We do display advertising
          on some pages through Google AdSense.
        </p>
        <p>
          This page explains, in plain language, what data we collect, why
          we collect it, who we share it with, and what choices you have.
          If anything is unclear, email us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="pp-link">
            {CONTACT_EMAIL}
          </a>{" "}
          and a real person will answer within five business days.
        </p>
      </>
    ),
  },
  {
    id: "data-collected",
    title: "2. What data we collect",
    body: (
      <>
        <p>We collect the minimum data needed to run the service:</p>
        <ul>
          <li>
            <strong>Your browser timezone</strong> — inferred via the
            standard JavaScript <code>Intl.DateTimeFormat</code> API at page
            load, used to show your "home" city. Not stored.
          </li>
          <li>
            <strong>Your IP address</strong> — used by our edge network to
            route your request to the nearest server. Not logged with your
            session. We retain raw IP for 24 hours for abuse detection, then
            it is hashed and retained for 30 days for the same purpose.
          </li>
          <li>
            <strong>Your selected cities and 12h/24h preference</strong> —
            stored in your browser's <code>localStorage</code> under the
            keys <code>global_time_workspace_prefs</code>,{" "}
            <code>tdp_user_cities</code>, and <code>tdp_hour12</code>.
            Cleared when you clear your browser data. Not transmitted to us.
          </li>
          <li>
            <strong>Anonymous usage analytics</strong> — if you accept the
            cookie banner, we use a privacy-friendly analytics tool
            (Plausible or Umami) to count page views, scroll depth, and
            which tools are used. No personal identifiers, no cross-site
            tracking, no fingerprinting.
          </li>
        </ul>
        <p>We do <strong>not</strong> collect:</p>
        <ul>
          <li>Your name, email, or phone number (unless you email us first).</li>
          <li>Your precise GPS location. Browser timezone is country-level accuracy at best.</li>
          <li>Biometric, financial, or health data of any kind.</li>
          <li>Data from children under 13. This service is not directed at children.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "3. Cookies and similar technologies",
    body: (
      <>
        <p>
          We use one first-party cookie to remember whether you have
          accepted or rejected the cookie banner. That cookie is set only
          after you click "Accept" or "Reject", and contains no personal
          data — just a yes/no flag.
        </p>
        <p>
          If you accept, third-party cookies may be set by:
        </p>
        <ul>
          <li>
            <strong>Google AdSense</strong> — sets cookies to deliver ads
            that are relevant to you, to cap ad frequency, and to measure
            ad performance. Learn more at{" "}
            <a className="pp-link" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer noopener">
              Google's advertising policy
            </a>.
          </li>
          <li>
            <strong>Our analytics tool</strong> — sets a single first-party
            cookie for session deduplication. Does not track you across
            other sites.
          </li>
        </ul>
        <p>
          You can withdraw consent at any time by clearing your browser
          data or by clicking the "Cookie settings" link in the footer.
        </p>
      </>
    ),
  },
  {
    id: "ads",
    title: "4. Advertising and AdSense",
    body: (
      <>
        <p>
          {SITE_NAME} displays ads provided by Google AdSense, a third-party
          advertising platform. Google uses cookies to serve ads based on
          your prior visits to our site or other sites.
        </p>
        <p>Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.</p>
        <p>You may opt out of personalized advertising by visiting <a className="pp-link" href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer noopener">Google Ads Settings</a> (requires a Google account) or by visiting <a className="pp-link" href="https://www.aboutads.info" target="_blank" rel="noreferrer noopener">aboutads.info</a>.</p>
        <p>
          We do not endorse, guarantee, or assume liability for any product
          or service advertised on {SITE_NAME}. If you have a complaint
          about a specific ad, please use the "Ad choices" icon next to
          the ad, or contact us at{" "}
          <a className="pp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "5. Who we share data with",
    body: (
      <>
        <p>We share data only with the following parties, and only the minimum needed to provide the service:</p>
        <ul>
          <li><strong>Google (AdSense + Analytics)</strong> — see section 4. Google acts as our data processor under a Data Processing Agreement.</li>
          <li><strong>Hosting providers</strong> — Cloudflare (CDN + edge compute) and the underlying VPS / data center provider. They process requests on our behalf under standard cloud-provider DPAs.</li>
          <li><strong>Law enforcement</strong> — only if compelled by a valid subpoena, court order, or applicable law. We will challenge overly broad requests and notify users when legally permitted.</li>
        </ul>
        <p>We do <strong>not</strong> sell, rent, lease, or trade your data with anyone. "Sale" under CCPA does not apply because we do not collect personal information in the first place.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "6. Data retention",
    body: (
      <>
        <ul>
          <li><strong>Server access logs</strong> (containing hashed IP + request URL): 30 days.</li>
          <li><strong>Analytics events</strong> (anonymous, no personal data): 24 months in aggregate form.</li>
          <li><strong>First-party cookies</strong>: 12 months, then automatically expire.</li>
          <li><strong>localStorage preferences</strong>: until you clear your browser data, or until the relevant feature ships a "reset" button (currently: top-favorite cities, 12h/24h toggle, custom user-added cities).</li>
        </ul>
        <p>After these periods, data is deleted or fully anonymized.</p>
      </>
    ),
  },
  {
    id: "rights",
    title: "7. Your rights (GDPR + CCPA)",
    body: (
      <>
        <p>Depending on where you live, you have some or all of the following rights:</p>
        <ul>
          <li><strong>Right to know</strong> — what data we hold (we hold almost none; see section 2).</li>
          <li><strong>Right to delete</strong> — clear your browser's localStorage and cookies, and your data is gone. We have no server-side copy to delete.</li>
          <li><strong>Right to opt out of sale</strong> — we do not sell data, so this right is moot. You can still opt out of personalized ads via Google Ads Settings.</li>
          <li><strong>Right to portability</strong> — your localStorage data is yours in JSON form; you can export it via browser dev tools.</li>
          <li><strong>Right to lodge a complaint</strong> with your local data protection authority (EU users) or the California Attorney General (CA users).</li>
        </ul>
        <p>To exercise any of these rights, email <a className="pp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We respond within 30 days; usually within 5.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "8. Security",
    body: (
      <>
        <p>We take reasonable steps to protect the little data we hold:</p>
        <ul>
          <li>HTTPS-only via Cloudflare with TLS 1.3 and HSTS.</li>
          <li>Server-side rate limiting on all public API endpoints.</li>
          <li>No storage of unhashed IP addresses beyond 24 hours.</li>
          <li>Quarterly dependency audit via GitHub Dependabot.</li>
        </ul>
        <p>No system is 100% secure. If you discover a vulnerability, please email <a className="pp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> — we will acknowledge within 24 hours and credit you in the fix announcement if you wish.</p>
      </>
    ),
  },
  {
    id: "children",
    title: "9. Children's privacy",
    body: (
      <p>{SITE_NAME} is not directed at children under 13. We do not knowingly collect any data from children. If you believe a child has used this service and you would like their preferences cleared, email <a className="pp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the relevant details.</p>
    ),
  },
  {
    id: "changes",
    title: "10. Changes to this policy",
    body: (
      <p>We may update this policy from time to time. Material changes will be highlighted in the changelog and announced on the homepage for at least 14 days before they take effect. The "last updated" date at the top of this page reflects the current version.</p>
    ),
  },
  {
    id: "contact",
    title: "11. Contact",
    body: (
      <>
        <p>Questions? Complaints? Fan mail? Reach us:</p>
        <ul>
          <li>Email: <a className="pp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
          <li>Response time: 5 business days, usually less.</li>
        </ul>
        <p style={{ marginTop: 32, fontSize: "0.85em", color: "var(--text-muted)" }}>
          This policy is effective {EFFECTIVE_DATE}. Last updated {LAST_UPDATED}.
        </p>
      </>
    ),
  },
];

export function PrivacyPolicy() {
  const navigateToHome = () => {
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new Event("tdp:navigate"));
  };

  return (
    <div className="pp">
      <header className="pp-header">
        <a
          className="pp-back"
          href="/"
          onClick={(e) => { e.preventDefault(); navigateToHome(); }}
        >
          <ArrowLeft size={14} />
          <span>Back to home</span>
        </a>
      </header>

      <article className="pp-doc">
        <header className="pp-doc__head">
          <div className="pp-eyebrow">Legal</div>
          <h1 className="pp-title">Privacy Policy</h1>
          <p className="pp-meta">Last updated: {LAST_UPDATED}</p>
        </header>

        <nav className="pp-toc" aria-label="Table of contents">
          <div className="pp-toc__label">On this page</div>
          <ol>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="pp-section">
            <h2>{s.title}</h2>
            <div className="pp-section__body">{s.body}</div>
          </section>
        ))}

        <footer className="pp-doc__foot">
          <p>
            <Mail size={14} aria-hidden style={{ verticalAlign: "middle" }} />{" "}
            Email us at{" "}
            <a className="pp-link" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </footer>
      </article>
    </div>
  );
}

export default PrivacyPolicy;
