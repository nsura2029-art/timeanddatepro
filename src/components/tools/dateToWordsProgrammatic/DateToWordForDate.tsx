// src/components/tools/dateToWordsProgrammatic/DateToWordForDate.tsx
// Programmatic SEO page: a specific date in formal words.
// Example URLs:
//   /en/date-words/2026-07-11   (full ISO date)
//   /en/date-words/july-11     (month-day, shows this day across recent years)

import React, { useMemo, useEffect } from "react";
import { useDocumentSeo } from "../../../lib/seo/useDocumentSeo";
import {
  buildDateToWordsFaqSchema,
  buildBreadcrumbSchema,
} from "../../../lib/seo/dateToWordsSeo";
import {
  convertDateToWords,
  DateToWordsError,
} from "../../../lib/dateToWords/converter";
import "./DateToWordProgrammatic.css";

interface Props {
  /** ISO date string: "2026-07-11" */
  dateString: string;
  /** Optional second dateString for "compare two dates" mode */
  compareWith?: string;
  /** Language code (en, fr, zh, ja) */
  lang?: string;
}

const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function formatPrettyDate(dateString: string): string {
  const [y, m, d] = dateString.split("-").map(Number);
  return `${MONTH_FULL[m - 1]} ${d}, ${y}`;
}

function getDayOfWeek(dateString: string): string {
  const [y, m, d] = dateString.split("-").map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
}

export const DateToWordForDate: React.FC<Props> = ({ dateString, lang = "en" }) => {
  const baseUrl = `https://dateandtime.live/${lang}/date-words`;
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  const canonicalUrl = isValid ? `${baseUrl}/${dateString}` : baseUrl;
  const prettyDate = isValid ? formatPrettyDate(dateString) : dateString;

  // Compute the conversion (legal format is the default)
  const conversion = useMemo(() => {
    if (!isValid) return null;
    try {
      return convertDateToWords({ dateString, locale: "en-US" });
    } catch {
      return null;
    }
  }, [dateString, isValid]);

  const [year, month, day] = isValid ? dateString.split("-").map(Number) : [0, 0, 0];
  const monthName = MONTH_FULL[month - 1] ?? "";
  const dayOfWeek = isValid ? getDayOfWeek(dateString) : "";

  // Mount SEO
  useDocumentSeo({
    title: isValid
      ? `${prettyDate} in words — "${conversion?.legal ?? ""}" | Date to Words`
      : "Date in words — Date to Words Converter",
    description: isValid
      ? `${prettyDate} (${dayOfWeek}) written in formal words: "${conversion?.legal ?? ""}". See all 5 formats — formal, legal, banking, casual, British.`
      : "Convert any date to formal written words for legal documents.",
    canonicalUrl,
    ogImageUrl: "https://dateandtime.live/og/date-to-word.png",
    ogType: "article",
    siteName: "TimeAndDatePro",
    hreflang: {
      en: canonicalUrl,
      "x-default": canonicalUrl,
    },
    schemas: [
      buildBreadcrumbSchema([
        { name: "Home", url: "https://dateandtime.live/" },
        { name: "Tools", url: `https://dateandtime.live/${lang}/tools` },
        { name: "Date to Words", url: baseUrl },
        ...(isValid ? [{ name: String(year), url: `${baseUrl}/${year}` }] : []),
        ...(isValid ? [{ name: prettyDate, url: canonicalUrl }] : []),
      ]),
      buildDateToWordsFaqSchema(
        isValid
          ? [
              {
                question: `How do you write ${prettyDate} in words?`,
                answer: `${prettyDate} in legal format is "${conversion?.legal ?? ""}". In banking format it would be "${conversion?.banking ?? ""}", and in casual format "${conversion?.casual ?? ""}".`,
              },
              {
                question: `What day of the week was ${prettyDate}?`,
                answer: `${prettyDate} fell on a ${dayOfWeek}.`,
              },
            ]
          : []
      ),
    ],
  });

  if (!isValid || !conversion) {
    return (
      <div className="dtw-page">
        <div className="dtw-prog-wrap">
          <h1>Invalid date</h1>
          <p>
            "{dateString}" is not a valid date. Try the{" "}
            <a href={`/${lang}/date-words`}>Date to Words converter</a> instead.
          </p>
        </div>
      </div>
    );
  }

  // Generate same-day-different-year links (recent past and future)
  const sameDayOtherYears = useMemo(() => {
    const years: number[] = [];
    for (let y = year - 5; y <= year + 5; y++) {
      if (y === year) continue;
      if (y < 1 || y > 9999) continue;
      years.push(y);
    }
    return years;
  }, [year]);

  return (
    <div className="dtw-page">
      <div className="dtw-prog-wrap">
        {/* Hero */}
        <header className="dtw-prog-head">
          <nav className="dtw-prog-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span aria-hidden>·</span>
            <a href={`/${lang}/tools`}>Tools</a>
            <span aria-hidden>·</span>
            <a href={`/${lang}/date-words`}>Date to Words</a>
            <span aria-hidden>·</span>
            <a href={`/${lang}/date-words/${year}`}>{year}</a>
            <span aria-hidden>·</span>
            <span aria-current="page">{prettyDate}</span>
          </nav>
          <div className="dtw-prog-eyebrow">{dayOfWeek} · {monthName} {day}, {year}</div>
          <h1 className="dtw-prog-h1">{prettyDate} in words</h1>
          <p className="dtw-prog-h1-result">{conversion.legal}</p>
        </header>

        {/* All 5 formats */}
        <section className="dtw-prog-formats">
          <h2>All five formats for {prettyDate}</h2>
          <div className="dtw-prog-format-list">
            <div className="dtw-prog-format-row">
              <span className="dtw-prog-format-label">Legal</span>
              <span className="dtw-prog-format-text">{conversion.legal}</span>
            </div>
            <div className="dtw-prog-format-row">
              <span className="dtw-prog-format-label">Formal</span>
              <span className="dtw-prog-format-text">{conversion.formal}</span>
            </div>
            <div className="dtw-prog-format-row">
              <span className="dtw-prog-format-label">Banking</span>
              <span className="dtw-prog-format-text">{conversion.banking}</span>
            </div>
            <div className="dtw-prog-format-row">
              <span className="dtw-prog-format-label">Casual</span>
              <span className="dtw-prog-format-text">{conversion.casual}</span>
            </div>
            <div className="dtw-prog-format-row">
              <span className="dtw-prog-format-label">British</span>
              <span className="dtw-prog-format-text">{conversion.british}</span>
            </div>
          </div>
        </section>

        {/* SEO content */}
        <section className="dtw-prog-content">
          <h2>About {prettyDate}</h2>
          <p>
            {prettyDate} fell on a {dayOfWeek}. In legal format — used on
            contracts, cheques, and notarized documents — the date is
            written as "{conversion.legal}". The year {year} in full words
            is "{conversion.legal.split(", ").pop()}".
          </p>
          <h2>When to use the legal format</h2>
          <p>
            The legal format ("{conversion.legal}") is required for any
            document where the date must be unambiguous and tamper-resistant:
            contracts, deeds, wills, affidavits, court filings, and
            government forms. Banks specifically require the banking format
            ("{conversion.banking}") on cheques.
          </p>
        </section>

        {/* Same day, different years */}
        <section className="dtw-prog-content">
          <h2>{monthName} {day} in other years</h2>
          <p>
            The same calendar date (month and day) in nearby years:
          </p>
          <div className="dtw-prog-year-grid">
            {sameDayOtherYears.map((y) => {
              const ds = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              return (
                <a key={y} href={`/${lang}/date-words/${ds}`} className="dtw-prog-year-link">
                  {monthName} {day}, {y}
                </a>
              );
            })}
          </div>
        </section>

        {/* All dates in this year */}
        <section className="dtw-prog-content">
          <h2>All dates in {year}</h2>
          <p>
            See the complete list of every date in {year} written in
            formal words:{" "}
            <a href={`/${lang}/date-words/${year}`} className="dtw-prog-year-link">
              {year} dates
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default DateToWordForDate;
