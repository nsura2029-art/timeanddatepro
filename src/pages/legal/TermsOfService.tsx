// src/pages/legal/TermsOfService.tsx
// Terms of Service — AdSense + standard SaaS disclaimers.
//
// Content guidelines (polish-7):
// - 3-4 min read target
// - 7 sections (was 11); merged Acceptance/Accounts, IP/Third-party,
//   Disclaimers/Liability, Termination/Indemnification
// - Plain language, short sentences
// - i18n-ready: no idioms, consistent terminology, present tense

import React, { useEffect, useState } from "react";
import { AlertTriangle, Mail, Printer, Globe } from "lucide-react";

const LAST_UPDATED = "2026-07-10";
const EFFECTIVE_DATE = "2026-07-15";
const CONTACT_EMAIL = "legal@timeanddatepro.com";
const SITE_NAME = "TimeAndDatePro";
const SITE_URL = "https://timeanddatepro.com";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <>
        <p>
          By using {SITE_NAME} at {SITE_URL}, you agree to these Terms.
          If you do not agree, do not use the Service. Your continued
          use after we post changes means you accept the updated Terms.
        </p>
        <p>
          {SITE_NAME} does not require an account. All preferences live
          in your browser through <code>localStorage</code>. If you
          clear your browser data, your preferences are lost. We have
          no server copy.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "The service",
    body: (
      <>
        <p>
          {SITE_NAME} is a free public utility for current time lookups,
          time zone conversion, meeting scheduling, and related
          reference content.
        </p>
        <p>
          Time zone data comes from the IANA Time Zone Database. We work
          to keep it accurate but we do not guarantee 100% accuracy. For
          legal, financial, or medical scheduling, verify with a
          qualified professional.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "Your responsibilities",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service to violate any law or regulation.</li>
          <li>Scrape or systematically download data faster than 1 request per second per IP. (Our public API has higher published limits.)</li>
          <li>Attempt to bypass rate limits, security controls, or access controls.</li>
          <li>Attack, disrupt, or interfere with our infrastructure or other users.</li>
          <li>Republish our content as your own without attribution.</li>
          <li>Click your own ads or encourage others to click them. (This can disable our AdSense account.)</li>
        </ul>
      </>
    ),
  },
  {
    id: "content",
    title: "Our content and third parties",
    body: (
      <>
        <p>
          The {SITE_NAME} brand, design, code, and original content are
          owned by us. Time zone data is provided under the IANA
          license. Holiday data comes from public-domain government
          sources.
        </p>
        <p>
          You may quote brief excerpts (under 200 words) from our
          reference content for non-commercial purposes with
          attribution. For longer quotes or commercial use, email{" "}
          <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <p>
          The Service may link to or embed third-party content (Google
          AdSense, Wikipedia, and others). We do not control and are
          not responsible for third-party content or policies. Your
          use of any third-party service is at your own risk.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers and liability",
    body: (
      <div className="lp-callout">
        <AlertTriangle size={20} className="lp-callout__icon" aria-hidden />
        <p className="lp-callout__body">
          The Service is provided <strong>"as is" and "as available"</strong>
          without warranties of any kind, express or implied. This
          includes warranties of merchantability, fitness for a
          particular purpose, non-infringement, and accuracy. We do
          not warrant that the Service will be uninterrupted, secure,
          or error-free.
        </p>
      </div>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, {SITE_NAME} and its
        operators are not liable for any indirect, incidental, special,
        consequential, or punitive damages arising from your use of
        the Service. Our total liability for any claim is limited to{" "}
        <strong>US$100</strong>.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination, governing law, contact",
    body: (
      <>
        <p>
          We may suspend or terminate the Service at any time, with or
          without notice. We may also block specific users or IP
          ranges that violate these Terms. Sections about our
          disclaimers, liability, and governing law survive
          termination.
        </p>
        <p>
          <strong>Governing law:</strong> These Terms are governed by
          the laws of the State of Delaware, United States.
        </p>
        <p>
          <strong>Disputes:</strong> Any dispute will be resolved by
          binding arbitration in Wilmington, Delaware, under the rules
          of the American Arbitration Association. You waive any right
          to participate in a class action.
        </p>
        <p>
          <strong>Severability:</strong> If any provision of these
          Terms is held invalid, the remaining provisions remain in
          full force and effect.
        </p>
        <p>
          <strong>Entire agreement:</strong> These Terms and the Privacy
          Policy are the entire agreement between you and {SITE_NAME}.
        </p>
        <p>
          For any question, email{" "}
          <a className="lp-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          We respond within five business days.
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

export default TermsOfService;
