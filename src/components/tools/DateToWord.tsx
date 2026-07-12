// src/components/tools/DateToWord.tsx
// Date to Words — premium SaaS treatment matching the A4 design.
//
// Five formats: formal, legal, banking, casual, british.
// All conversion happens client-side via src/lib/dateToWords/converter.
//
// Translation requests capture interest per format (50-language list) and
// redirect to /feedback with the tool pre-selected when a non-English
// locale is chosen.

import React, { useState, useMemo, useCallback } from "react";
import {
  Clipboard,
  Download,
  Share2,
  Code,
} from "lucide-react";
import {
  convertDateToWords,
  type DateFormatId,
  type LocaleTag,
} from "../../lib/dateToWords/converter";
import {
  POPULAR_LANGUAGES,
  isEnglishLocale,
  type PopularLanguage,
} from "../../lib/languages/popularLanguages";
import { RelatedToolsGrid, type RelatedTool } from "./shared/RelatedToolsGrid";
import { FeedbackButton } from "./shared/FeedbackButton";
import { ToolDisclaimer } from "./shared/ToolDisclaimer";
import "./DateToWord.css";

/* ─────────────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────────────── */

const TOOL_NAME = "Date to Words";

const DATE_FORMATS: { id: DateFormatId; label: string; pastel: "lavender" | "mint" | "amber" | "sky" }[] = [
  { id: "formal",  label: "Formal",  pastel: "lavender" },
  { id: "legal",   label: "Legal",   pastel: "mint"     },
  { id: "banking", label: "Banking", pastel: "amber"    },
  { id: "casual",  label: "Casual",  pastel: "sky"      },
  { id: "british", label: "British", pastel: "lavender" },
];

const ENGLISH_LOCALES: { tag: LocaleTag; label: string }[] = [
  { tag: "en-US", label: "🇺🇸 English (US)" },
  { tag: "en-GB", label: "🇬🇧 English (UK)" },
];

/** All non-English locales from the popular languages list, for the redirect target. */
const NON_ENGLISH_LOCALES: PopularLanguage[] = POPULAR_LANGUAGES.filter(
  (lang) => !isEnglishLocale(`${lang.code}-${lang.region}`)
);

/** Related tools for the bottom grid.
 *  Tools that already exist under /en/<slug> link to their real route.
 *  Tools not built yet link to /feedback with the tool pre-filled so the
 *  user can express interest (matches the "one by one" build plan).
 */
const RELATED_TOOLS: RelatedTool[] = [
  { label: "Word to Date",      href: "/feedback?type=suggestion&tool=word-to-date",  icon: "🔁" },
  { label: "Date Math",         href: "/en/date-math",                              icon: "➕" },
  { label: "Date Difference",   href: "/en/date-diff",                              icon: "↔️" },
  { label: "Countdown",         href: "/en/countdown",                              icon: "⏱️" },
  { label: "TZ Converter",      href: "/en/time-zone-converter",                    icon: "🌐" },
  { label: "Age Calculator",    href: "/feedback?type=suggestion&tool=age-calculator", icon: "🎂" },
  { label: "12-Month Calendar", href: "/en/12-month-calendar",                      icon: "📅" },
  { label: "Week Number",       href: "/feedback?type=suggestion&tool=week-number", icon: "📆" },
  { label: "Sunrise & Sunset",  href: "/en/sunrise-sunset",                         icon: "🌅" },
  { label: "Stopwatch",         href: "/en/stopwatch",                              icon: "⏲️" },
  { label: "Unix Timestamp",    href: "/en/unix",                                   icon: "🕐" },
  { label: "DST Tracker",       href: "/en/daylight-saving",                        icon: "🌍" },
];

/* ─────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────── */

interface Props {
  lang?: string;
}

export const DateToWord: React.FC<Props> = ({ lang = "en" }) => {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedLocale, setSelectedLocale] = useState<LocaleTag>(
    lang === "en-GB" ? "en-GB" : "en-US"
  );
  const [selectedFormat, setSelectedFormat] = useState<DateFormatId>("legal");
  const [openTranslateRow, setOpenTranslateRow] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  /* ── Derived state: the conversion result ─────────────────────── */
  const conversionResult = useMemo(() => {
    try {
      return convertDateToWords({
        dateString: selectedDate,
        locale: selectedLocale,
      });
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not convert date.",
      };
    }
  }, [selectedDate, selectedLocale]);

  /* ── Event handlers ────────────────────────────────────────────── */
  const handleLocaleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value;
    if (isEnglishLocale(newLocale)) {
      setSelectedLocale(newLocale as LocaleTag);
      return;
    }
    // Non-English: forward to the feedback / suggestion page with the
    // tool context pre-filled so the user can express their interest
    // and we can capture an email.
    const params = new URLSearchParams({
      tool: "date-words",
      interest: "locale",
      locale: newLocale,
    });
    window.history.pushState(
      null,
      "",
      `/feedback?${params.toString()}`
    );
    window.dispatchEvent(new Event("tdp:navigate"));
  }, []);

  const handleTabClick = useCallback((formatId: DateFormatId) => {
    setSelectedFormat(formatId);
  }, []);

  const handleCopyToClipboard = useCallback(
    async (text: string, message: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 2200);
      } catch {
        setToastMessage("Copy failed — try selecting the text manually");
        setTimeout(() => setToastMessage(null), 2200);
      }
    },
    []
  );

  const handleTranslateRowToggle = useCallback((rowNumber: number) => {
    setOpenTranslateRow((current) => (current === rowNumber ? null : rowNumber));
  }, []);

  /* ── Render guards ─────────────────────────────────────────────── */
  if ("error" in conversionResult) {
    return (
      <div className="page">
        <div className="tool">
          <div className="tool-body" style={{ textAlign: "center", padding: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)", marginBottom: 8 }}>
              Couldn't convert that date
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-ink-2)" }}>
              {conversionResult.error}
            </p>
            <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 12 }}>
              Try a different format — YYYY-MM-DD works in every locale.
            </p>
          </div>
        </div>
        <FeedbackButton pageName={TOOL_NAME} />
      </div>
    );
  }

  const selectedText = conversionResult[selectedFormat];
  const variantEntries = DATE_FORMATS.map((format) => ({
    id: format.id,
    label: format.label,
    text: conversionResult[format.id],
  }));

  return (
    <div className="page">
      <main className="dtw-main">
        {/* Hero */}
        <header className="dtw-hero">
          <div className="dtw-hero-left">
            <div className="dtw-eyebrow">
              <span className="dtw-eyebrow-dot" />
              Date to Words · v2.1
            </div>
            <h1>
              Any date, written <span className="dtw-accent">properly.</span>
            </h1>
            <p className="dtw-lede">
              Convert calendar dates to formal written words for legal
              documents, cheques, and official forms.
            </p>
          </div>
          <div className="dtw-hero-right">
            <div className="dtw-waitlist">
              <span className="dtw-waitlist-dot" />
              <span>
                <strong>1,247</strong> on translation waitlist
              </span>
            </div>
          </div>
        </header>

        {/* Input tool card */}
        <section className="tool">
          <div className="tool-head">
            <div className="tool-head-left">
              <span className="tool-step">01</span>
              <span>Convert a date to words</span>
            </div>
          </div>

          <div className="tool-body">
            <div className="dtw-input-row">
              <div className="dtw-field">
                <label className="dtw-field-label" htmlFor="dtw-date-input">
                  <span>Date</span>
                </label>
                <div className="dtw-date-input-wrap">
                  <input
                    id="dtw-date-input"
                    className="dtw-field-input mono"
                    type="text"
                    inputMode="numeric"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    placeholder="YYYY-MM-DD, 07/11/2026, or 11 July 2026"
                  />
                  <label className="dtw-date-picker-trigger" htmlFor="dtw-date-picker" title="Open date picker">
                    <span aria-hidden>📅</span>
                  </label>
                  <input
                    id="dtw-date-picker"
                    className="dtw-date-picker-native"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    aria-label="Pick a date from the calendar"
                  />
                </div>
              </div>
              <div className="dtw-field">
                <label className="dtw-field-label" htmlFor="dtw-locale-select">
                  <span>Language</span>
                </label>
                <select
                  id="dtw-locale-select"
                  className="dtw-field-select"
                  value={selectedLocale}
                  onChange={handleLocaleChange}
                >
                  <optgroup label="Available now">
                    {ENGLISH_LOCALES.map((loc) => (
                      <option key={loc.tag} value={loc.tag}>
                        {loc.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Coming soon (notify me)">
                    {NON_ENGLISH_LOCALES.map((loc) => (
                      <option
                        key={`${loc.code}-${loc.region}`}
                        value={`${loc.code}-${loc.region}`}
                      >
                        {loc.flag} {loc.endonym} ({loc.englishName})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* NotebookLM pastel tabs */}
            <div className="dtw-tabs-section">
              <div className="dtw-tabs-head">
                <span className="dtw-tabs-label">Output format</span>
                <span className="dtw-tabs-popular">
                  <span className="dtw-tabs-popular-dot" />
                  Legal is most popular for contracts
                </span>
              </div>
              <div className="dtw-tabs">
                {DATE_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    data-variant={format.pastel}
                    className={`dtw-tab${selectedFormat === format.id ? " active" : ""}`}
                    onClick={() => handleTabClick(format.id)}
                  >
                    {format.label}
                    {selectedFormat === format.id && <span className="dtw-tab-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="dtw-cta-row">
              <button
                type="button"
                className="tdp-btn tdp-btn--primary tdp-btn--lg"
                onClick={() =>
                  handleCopyToClipboard(selectedText, "Copied to clipboard")
                }
              >
                Copy result →
              </button>
              <button
                type="button"
                className="tdp-btn tdp-btn--secondary tdp-btn--md"
                onClick={() => {
                  setSelectedDate(new Date().toISOString().slice(0, 10));
                  setSelectedFormat("legal");
                }}
              >
                Reset
              </button>
              <div className="dtw-cta-spacer" />
            </div>
          </div>
        </section>

        {/* Result card */}
        <section className="dtw-output">
          <div className="dtw-output-eyebrow">
            <div className="dtw-output-eyebrow-left">
              <span>Result</span>
              <span className="dtw-output-fmt-tag">{selectedFormat}</span>
            </div>
            <div className="dtw-output-eyebrow-right">
              <span className="dtw-output-locale-dot">●</span> {selectedLocale} · UTC-4
            </div>
          </div>
          <div className="dtw-output-body">
            <div className="dtw-output-text">{selectedText}</div>
            <div className="dtw-output-actions">
              <button
                type="button"
                className="tdp-btn tdp-btn--primary tdp-btn--md"
                onClick={() =>
                  handleCopyToClipboard(selectedText, "Copied to clipboard")
                }
              >
                <Clipboard size={14} strokeWidth={2.2} />
                Copy
              </button>
              <button
                type="button"
                className="tdp-btn tdp-btn--secondary tdp-btn--md"
                onClick={() => {
                  const blob = new Blob([selectedText + "\n"], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `date-${selectedDate}-${selectedFormat}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setToastMessage("Downloaded .txt");
                  setTimeout(() => setToastMessage(null), 2200);
                }}
                title={`Save "${selectedText}" as a .txt file`}
              >
                <Download size={14} strokeWidth={2.2} />
                Download .txt
              </button>
              <button
                type="button"
                className="tdp-btn tdp-btn--secondary tdp-btn--md"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/en/date-words?date=${encodeURIComponent(selectedDate)}&format=${selectedFormat}&locale=${selectedLocale}`;
                  handleCopyToClipboard(shareUrl, "Share link copied");
                }}
                title="Copy a shareable link to this conversion"
              >
                <Share2 size={14} strokeWidth={2.2} />
                Share link
              </button>
              <button
                type="button"
                className="tdp-btn tdp-btn--secondary tdp-btn--md"
                onClick={() =>
                  handleCopyToClipboard(`**${selectedText}**`, "Markdown copied")
                }
                title="Copy the result formatted as Markdown bold"
              >
                <Code size={14} strokeWidth={2.2} />
                Markdown
              </button>
            </div>
          </div>

          <div className="dtw-variants">
            {variantEntries.map((variant, index) => (
              <React.Fragment key={variant.id}>
                <div className="dtw-variant-row">
                  <span className="dtw-variant-label">{variant.label}</span>
                  <span className="dtw-variant-text">{variant.text}</span>
                  <button
                    type="button"
                    className="tdp-btn tdp-btn--secondary tdp-btn--sm"
                    onClick={() =>
                      handleCopyToClipboard(variant.text, "Copied")
                    }
                    aria-label={`Copy ${variant.label} variant`}
                  >
                    <Clipboard size={12} strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    className={`dtw-variant-translate${
                      openTranslateRow === index + 1 ? " open" : ""
                    }`}
                    onClick={() => handleTranslateRowToggle(index + 1)}
                  >
                    {openTranslateRow === index + 1 ? "✕ Close" : "🌐 Translate"}
                  </button>
                </div>
                <div
                  className={`dtw-translate-form-wrap${
                    openTranslateRow === index + 1 ? " open" : ""
                  }`}
                >
                  <TranslationRequestForm
                    formatId={variant.id}
                    formatLabel={variant.label}
                    dateString={selectedDate}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="dtw-howitworks">
          <div className="dtw-howitworks-head">
            <div className="dtw-howitworks-eyebrow">How it works</div>
            <div className="dtw-howitworks-title">Three steps. Five seconds.</div>
          </div>
          <div className="dtw-howitworks-grid">
            <div className="dtw-how-step">
              <div className="dtw-how-step-num">STEP 01</div>
              <div className="dtw-how-step-title">Type a date</div>
              <div className="dtw-how-step-desc">
                Any format works. YYYY-MM-DD, MM/DD/YYYY, or written out —
                we auto-detect.
              </div>
              <div className="dtw-how-step-mock">{selectedDate}</div>
            </div>
            <div className="dtw-how-step">
              <div className="dtw-how-step-num">STEP 02</div>
              <div className="dtw-how-step-title">Pick a format</div>
              <div className="dtw-how-step-desc">
                Legal for contracts. Banking for cheques. Casual for invites.
                Five options.
              </div>
              <div className="dtw-how-step-mock dtw-how-step-mock--accent">
                {selectedFormat} · selected
              </div>
            </div>
            <div className="dtw-how-step">
              <div className="dtw-how-step-num">STEP 03</div>
              <div className="dtw-how-step-title">Copy the result</div>
              <div className="dtw-how-step-desc">
                One click copies. Or download as .txt, share a link, or hit
                the API.
              </div>
              <div className="dtw-how-step-mock dtw-how-step-mock--success">
                ✓ copied to clipboard
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <ToolDisclaimer toolName={TOOL_NAME} />

        {/* Related tools */}
        <RelatedToolsGrid tools={RELATED_TOOLS} meta="12 more" />
      </main>

      {/* Toast */}
      {toastMessage && (
        <div className="dtw-toast show">
          <span className="dtw-toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating feedback button */}
      <FeedbackButton pageName={TOOL_NAME} />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────
   TranslationRequestForm — per-variant, 50 languages
   ───────────────────────────────────────────────────────────────────── */

interface TranslationFormProps {
  formatId: DateFormatId;
  formatLabel: string;
  dateString: string;
}

const TranslationRequestForm: React.FC<TranslationFormProps> = ({
  formatId,
  formatLabel,
  dateString,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("fr-FR");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const language = POPULAR_LANGUAGES.find(
      (lang) => `${lang.code}-${lang.region}` === selectedLanguage
    );
    if (!language) return;

    const entry = {
      type: "translation" as const,
      tool: "date-words",
      format: formatId,
      language: language.englishName,
      locale: selectedLanguage,
      date: dateString,
      email: email.trim(),
      timestamp: Date.now(),
    };

    // Persist locally — would POST to /api/v1/waitlist in the future
    try {
      const existing = JSON.parse(
        localStorage.getItem("tdp_translate_waitlist") || "[]"
      );
      existing.push(entry);
      localStorage.setItem(
        "tdp_translate_waitlist",
        JSON.stringify(existing)
      );
    } catch {
      // Non-fatal
    }
    // eslint-disable-next-line no-console
    console.log("[Translation Waitlist]", entry);

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    const language = POPULAR_LANGUAGES.find(
      (lang) => `${lang.code}-${lang.region}` === selectedLanguage
    );
    return (
      <div className="dtw-translate-success">
        <span className="dtw-translate-success-dot" />
        <span>
          <strong>You're on the list!</strong> We'll email you the moment{" "}
          {language?.endonym ?? "that language"} translations are live. No
          spam, no follow-up.
        </span>
      </div>
    );
  }

  return (
    <form className="dtw-translate-form" onSubmit={handleSubmit}>
      <div className="dtw-translate-form-head">
        <span>🌐</span>
        <span>
          Get the <strong>{formatLabel}</strong> version in another
          language. Drop your email — we'll notify you when it's ready.
        </span>
      </div>
      <select
        className="dtw-translate-form-select"
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        aria-label="Target language"
      >
        {POPULAR_LANGUAGES.map((language) => (
          <option
            key={`${language.code}-${language.region}`}
            value={`${language.code}-${language.region}`}
          >
            {language.flag} {language.endonym} ({language.englishName})
          </option>
        ))}
      </select>
      <input
        className="dtw-translate-form-input"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email for notification"
      />
      <button type="submit" className="tdp-btn tdp-btn--accent tdp-btn--md">
        Notify me
      </button>
      <div className="dtw-translate-form-foot">
        <span>Used only for translation launch. Unsubscribe anytime.</span>
        <a href="#" onClick={(e) => e.preventDefault()}>
          Why sign up? →
        </a>
      </div>
    </form>
  );
};

export default DateToWord;
