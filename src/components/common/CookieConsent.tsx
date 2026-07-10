// src/components/common/CookieConsent.tsx
// Cookie consent banner — GDPR + CCPA + AdSense policy compliance.
//
// On first visit, shows a sticky bottom banner with three options:
//   - Accept: sets localStorage flag, enables AdSense script load
//   - Reject: sets localStorage flag, no AdSense (non-personalized)
//   - Settings: opens a small modal with detailed options
//
// After choice, the banner is dismissed permanently. "Cookie settings"
// link in the footer re-opens it (and the user can change their mind).
//
// Reads/writes localStorage key: tdp_cookie_consent
// Values: "accepted" | "rejected" | "essential-only"
//
// Side effects on accept:
//   - Dynamically inserts the AdSense <script> tag into <head>
//   - Dispatches "tdp:consent-changed" event for any other components
//     that need to react (analytics, etc.)

import React, { useEffect, useState } from "react";
import { Cookie, X, Settings, Check } from "lucide-react";
import "./CookieConsent.css";

const CONSENT_KEY = "tdp_cookie_consent";
const ADSENSE_PUB_ID =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_ADSENSE_PUB_ID) ||
  "ca-pub-XXXXXXXXXXXXXXXX";

type ConsentValue = "accepted" | "rejected" | "essential-only";

const ADSENSE_SCRIPT_ID = "adsense-loader-script";

function injectAdSenseScript() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = ADSENSE_SCRIPT_ID;
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
  document.head.appendChild(s);
}

function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "rejected" || v === "essential-only") return v;
  } catch {/* noop */}
  return null;
}

function writeConsent(value: ConsentValue) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {/* noop */}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tdp:consent-changed", { detail: { value } }));
  }
}

export function CookieConsent() {
  // null = not decided yet (show banner), otherwise the stored choice
  const [consent, setConsent] = useState<ConsentValue | null>(readConsent());
  const [showSettings, setShowSettings] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consent === null) {
      // Defer the banner slightly so it doesn't fight the initial paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    // Apply side effects of existing consent
    if (consent === "accepted") injectAdSenseScript();
    return undefined;
  }, [consent]);

  // Listen for the "Cookie settings" link in the footer to re-open
  useEffect(() => {
    function handleOpenSettings() { setShowSettings(true); setVisible(true); }
    window.addEventListener("tdp:open-cookie-settings", handleOpenSettings);
    return () => window.removeEventListener("tdp:open-cookie-settings", handleOpenSettings);
  }, []);

  const decide = (value: ConsentValue) => {
    writeConsent(value);
    setConsent(value);
    setVisible(false);
    setShowSettings(false);
    if (value === "accepted") injectAdSenseScript();
  };

  // Detect region for a smart default (EU/UK/CA → "rejected" by default)
  // NOTE: this is a courtesy; we ALWAYS show the banner regardless, the
  // default is just the "Reject" button pre-focused.
  const [regionDefault, setRegionDefault] = useState<"accept" | "reject">("accept");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
    const lang = (navigator.language || "en").toLowerCase();
    const eu = tz.startsWith("europe/") || /^(de|fr|es|it|nl|pl|pt|sv|fi|da|el|cs|hu|ro|bg|sk|hr|sl|et|lv|lt|mt|ga)/.test(lang.split("-")[0]);
    if (eu) setRegionDefault("reject");
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Bottom banner — only shown when no decision has been made yet */}
      {consent === null && !showSettings && (
        <div className="cc-banner" role="region" aria-label="Cookie consent">
          <div className="cc-banner__inner">
            <div className="cc-banner__icon"><Cookie size={20} aria-hidden /></div>
            <div className="cc-banner__text">
              <strong className="cc-banner__title">We value your privacy</strong>
              <p>
                We use cookies to deliver the service, remember your preferences
                (in your browser only), and — if you accept — show relevant ads via
                Google AdSense and count anonymous page views.{" "}
                <a href="/privacy" className="cc-link">Read the full policy</a>.
              </p>
            </div>
            <div className="cc-banner__actions">
              <button
                type="button"
                className="cc-btn cc-btn--ghost"
                onClick={() => setShowSettings(true)}
                aria-label="Customize cookie settings"
              >
                <Settings size={14} /> Settings
              </button>
              <button
                type="button"
                className={`cc-btn cc-btn--ghost ${regionDefault === "reject" ? "cc-btn--focus" : ""}`}
                onClick={() => decide("rejected")}
                autoFocus={regionDefault === "reject"}
              >
                Reject all
              </button>
              <button
                type="button"
                className={`cc-btn cc-btn--primary ${regionDefault === "accept" ? "cc-btn--focus" : ""}`}
                onClick={() => decide("accepted")}
                autoFocus={regionDefault === "accept"}
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal — opened from "Settings" or "Cookie settings" link */}
      {showSettings && (
        <div className="cc-modal" role="dialog" aria-modal="true" aria-label="Cookie settings">
          <div className="cc-modal__backdrop" onClick={() => { if (consent !== null) setShowSettings(false); }} />
          <div className="cc-modal__card">
            <button
              type="button"
              className="cc-modal__close"
              onClick={() => setShowSettings(false)}
              aria-label="Close cookie settings"
            >
              <X size={18} />
            </button>
            <h2 className="cc-modal__title">Cookie settings</h2>
            <p className="cc-modal__sub">
              Choose which categories of cookies you allow. You can change
              your mind any time from the footer.
            </p>

            <div className="cc-toggle">
              <div className="cc-toggle__info">
                <div className="cc-toggle__label">
                  <Check size={14} aria-hidden /> Essential
                </div>
                <div className="cc-toggle__desc">
                  Required to remember your preferences, run the app, and
                  remember this very choice. Always on.
                </div>
              </div>
              <div className="cc-toggle__switch cc-toggle__switch--on cc-toggle__switch--locked">
                On
              </div>
            </div>

            <div className="cc-toggle">
              <div className="cc-toggle__info">
                <div className="cc-toggle__label">Analytics</div>
                <div className="cc-toggle__desc">
                  Anonymous page-view counts (no personal data, no cross-site
                  tracking). Helps us know which tools are useful.
                </div>
              </div>
              <button
                type="button"
                className={`cc-toggle__switch ${consent === "accepted" ? "cc-toggle__switch--on" : ""}`}
                onClick={() => decide(consent === "accepted" ? "essential-only" : "accepted")}
                aria-pressed={consent === "accepted"}
              >
                {consent === "accepted" ? "On" : "Off"}
              </button>
            </div>

            <div className="cc-toggle">
              <div className="cc-toggle__info">
                <div className="cc-toggle__label">Advertising</div>
                <div className="cc-toggle__desc">
                  Google AdSense ads. When off, we show a placeholder box
                  instead. AdSense may still set essential cookies for
                  frequency capping.
                </div>
              </div>
              <button
                type="button"
                className={`cc-toggle__switch ${consent === "accepted" ? "cc-toggle__switch--on" : ""}`}
                onClick={() => decide(consent === "accepted" ? "essential-only" : "accepted")}
                aria-pressed={consent === "accepted"}
              >
                {consent === "accepted" ? "On" : "Off"}
              </button>
            </div>

            <div className="cc-modal__actions">
              <button
                type="button"
                className="cc-btn cc-btn--ghost"
                onClick={() => decide("rejected")}
              >
                Reject all
              </button>
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                onClick={() => decide(consent === "essential-only" ? "essential-only" : "accepted")}
              >
                Save preferences
              </button>
            </div>
            <p className="cc-modal__legal">
              <a className="cc-link" href="/privacy">Privacy Policy</a>
              {" · "}
              <a className="cc-link" href="/terms">Terms of Service</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default CookieConsent;
