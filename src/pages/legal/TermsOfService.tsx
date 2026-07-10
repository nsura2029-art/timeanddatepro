// src/pages/legal/TermsOfService.tsx
// Terms of Service — AdSense + standard SaaS disclaimers.
// Same visual style as PrivacyPolicy (uses the same CSS file).
//
// Plain prose, 11 sections, covers the disclaimers required by:
//   - Google AdSense Program Policies (publisher must have T&Cs)
//   - Standard limitation of liability / DMCA / governing law
//
// Last-updated date is rendered at the top.

import React from "react";
import { ArrowLeft, Mail } from "lucide-react";

const LAST_UPDATED = "2026-07-10";
const CONTACT_EMAIL = "legal@timeanddatepro.com";
const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";
const EFFECTIVE_DATE = "2026-07-15";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: "acceptance",
    title: "1. Acceptance of these terms",
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
    title: "2. What the Service is",
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
    title: "3. No account required",
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
    title: "4. Acceptable use",
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
    title: "5. Intellectual property",
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
          <a className="pp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "6. Third-party services and links",
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
          <a className="pp-link" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer noopener">Google's ad policies</a>{" "}
          and Google's privacy practices. We do not endorse or guarantee
          any advertised product or service.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "7. Disclaimers",
    body: (
      <p>
        The Service is provided "as is" and "as available" without
        warranties of any kind, express or implied, including but not
        limited to warranties of merchantability, fitness for a particular
        purpose, non-infringement, or accuracy. We do not warrant that
        the Service will be uninterrupted, secure, or error-free.
      </p>
    ),
  },
  {
    id: "liability",
    title: "8. Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, in no event shall {SITE_NAME}, its operators, contributors, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of data, revenue, profits, or business opportunity) arising out of or related to your use of the Service, even if advised of the possibility of such damages. Our total aggregate liability for any claim shall not exceed US$100.
      </p>
    ),
  },
  {
    id: "indemnification",
    title: "9. Indemnification",
    body: (
      <p>You agree to defend, indemnify, and hold harmless {SITE_NAME} from any claim, demand, loss, or expense (including reasonable attorneys' fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party right.</p>
    ),
  },
  {
    id: "termination",
    title: "10. Termination",
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
    title: "11. Miscellaneous",
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
        <p style={{ marginTop: 32, fontSize: "0.85em", color: "#64748b" }}>
          This document is effective {EFFECTIVE_DATE}. Last updated {LAST_UPDATED}.
        </p>
      </>
    ),
  },
];

export function TermsOfService() {
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
          <h1 className="pp-title">Terms of Service</h1>
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

export default TermsOfService;
