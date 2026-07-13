// src/components/tools/dateToWordsProgrammatic/DateToWordForYear.tsx
// Programmatic SEO page: all dates in a given year written in words.
// Example URL: /en/date-words/2026
//
// Renders a full-year grid (365 or 366 days depending on leap year)
// with each cell showing the date and a snippet of its legal-format
// written form. Each cell links to the specific date's dedicated page.

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
  /** ISO year, 1-9999 */
  year: number;
  /** Language code (en, fr, zh, ja) */
  lang?: string;
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatYMD(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function getDayOfWeek(year: number, month: number, day: number): string {
  // JS Date: month is 0-indexed
  const d = new Date(year, month - 1, day);
  return DAY_SHORT[d.getDay()];
}

export const DateToWordForYear: React.FC<Props> = ({ year, lang = "en" }) => {
  const days = daysInYear(year);
  const baseUrl = `https://dateandtime.live/${lang}/date-words`;

  // Mount SEO
  useDocumentSeo({
    title: `Dates in ${year} written in words — Date to Words Converter`,
    description: `All ${days} days of ${year} written in formal words. See how to spell out any date in ${year} for legal documents, cheques, and contracts.`,
    canonicalUrl: `${baseUrl}/${year}`,
    ogImageUrl: "https://dateandtime.live/og/date-to-word.png",
    ogType: "website",
    siteName: "TimeAndDatePro",
    hreflang: {
      en: `${baseUrl}/${year}`,
      "x-default": `${baseUrl}/${year}`,
    },
    schemas: [
      buildBreadcrumbSchema([
        { name: "Home", url: "https://dateandtime.live/" },
        { name: "Tools", url: `https://dateandtime.live/${lang}/tools` },
        { name: "Date to Words", url: baseUrl },
        { name: String(year), url: `${baseUrl}/${year}` },
      ]),
      buildDateToWordsFaqSchema([
        {
          question: `How do I write a date in ${year} in words?`,
          answer: `Use the legal format: 'Eleventh day of July, Two Thousand ${year > 2000 ? "Twenty-Six" : ""}' for example. The Date to Words converter handles all ${days} days of ${year} automatically.`,
        },
        {
          question: `Is ${year} a leap year?`,
          answer: year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
            ? `Yes, ${year} is a leap year with 366 days (February has 29 days).`
            : `No, ${year} is a common year with 365 days (February has 28 days).`,
        },
      ]),
    ],
  });

  // Pre-compute all days for the grid
  const dayList = useMemo(() => {
    const list: Array<{ ymd: string; month: number; day: number; weekday: string; words: string; monthShort: string }> = [];
    for (let m = 1; m <= 12; m++) {
      const monthDays = new Date(year, m, 0).getDate();
      for (let d = 1; d <= monthDays; d++) {
        const ymd = formatYMD(year, m, d);
        try {
          const out = convertDateToWords({ dateString: ymd, locale: "en-US" });
          list.push({
            ymd,
            month: m,
            day: d,
            weekday: getDayOfWeek(year, m, d),
            words: out.legal,
            monthShort: MONTH_SHORT[m - 1],
          });
        } catch {
          // skip invalid dates
        }
      }
    }
    return list;
  }, [year]);

  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

  // Group by month for the grid
  const byMonth = useMemo(() => {
    const map: Record<number, typeof dayList> = {};
    dayList.forEach((d) => {
      if (!map[d.month]) map[d.month] = [];
      map[d.month].push(d);
    });
    return map;
  }, [dayList]);

  // Year navigation (prev/next year)
  const prevYear = year - 1;
  const nextYear = year + 1;

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
            <span aria-current="page">{year}</span>
          </nav>
          <h1 className="dtw-prog-h1">
            All {days} dates in {year} written in words
          </h1>
          <p className="dtw-prog-lede">
            Every calendar date in {year}, converted to its formal written
            form. Click any date to see all five formats (formal, legal,
            banking, casual, British) and copy the result for your document.
            {isLeap && (
              <span className="dtw-prog-note"> {year} is a leap year — February has 29 days.</span>
            )}
          </p>
          <div className="dtw-prog-nav">
            {prevYear >= 1 && (
              <a href={`/${lang}/date-words/${prevYear}`} className="dtw-prog-nav-btn">
                ← {prevYear}
              </a>
            )}
            <a href={`/${lang}/date-words`} className="dtw-prog-nav-btn dtw-prog-nav-btn--accent">
              Try a different date
            </a>
            {nextYear <= 9999 && (
              <a href={`/${lang}/date-words/${nextYear}`} className="dtw-prog-nav-btn">
                {nextYear} →
              </a>
            )}
          </div>
        </header>

        {/* Month-by-month grid */}
        <section className="dtw-prog-months">
          {Object.keys(byMonth).map((monthKey) => {
            const monthNum = parseInt(monthKey, 10);
            return (
              <div key={monthNum} className="dtw-prog-month">
                <h2 className="dtw-prog-month-name">{MONTH_FULL[monthNum - 1]}</h2>
                <div className="dtw-prog-grid">
                  {byMonth[monthNum].map((d) => (
                    <a
                      key={d.ymd}
                      href={`/${lang}/date-words/${d.ymd}`}
                      className="dtw-prog-day"
                      title={`${d.words}`}
                    >
                      <div className="dtw-prog-day-num">{d.day}</div>
                      <div className="dtw-prog-day-words">
                        {d.words.replace(/,.*$/, "").slice(0, 22)}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* SEO content */}
        <section className="dtw-prog-content">
          <h2>About dates in {year}</h2>
          <p>
            {year} has {days} days{isLeap && ", with 29 days in February"}.
            The legal format for any date in {year} follows the same
            convention: ordinal day + "day of" + full month name + ", " +
            spelled-out year. For example, 4 July {year} in legal format
            is "Fourth day of July, Two Thousand {year < 2000 || year > 2029 ? year : (year - 2000 < 10 ? "0" + (year - 2000) : year - 2000)}".
          </p>
          <h2>Common uses for {year} dates in words</h2>
          <ul>
            <li>Legal contracts executed in {year}</li>
            <li>Cheques written in {year} (banking format)</li>
            <li>Affidavits and notarized documents from {year}</li>
            <li>Passport and visa applications for {year}</li>
            <li>Board resolutions and corporate minutes from {year}</li>
          </ul>
        </section>

        {/* Cross-link to other years */}
        <section className="dtw-prog-content">
          <h2>Other years</h2>
          <p>
            Browse dates in nearby years:{" "}
            {Array.from({ length: 5 }, (_, i) => {
              const y = year - 2 + i;
              if (y < 1 || y > 9999 || y === year) return null;
              return (
                <a key={y} href={`/${lang}/date-words/${y}`} className="dtw-prog-year-link">
                  {y}
                </a>
              );
            })}
            {nextYear <= 9999 && (
              <a href={`/${lang}/date-words/${nextYear}`} className="dtw-prog-year-link">
                {nextYear}
              </a>
            )}
          </p>
        </section>
      </div>
    </div>
  );
};

export default DateToWordForYear;
