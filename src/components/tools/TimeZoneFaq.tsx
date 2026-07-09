// src/components/tools/TimeZoneFaq.tsx
// FAQ section for the dedicated /time-zone-converter page.
// Renders a FAQPage JSON-LD schema (for Google's "People Also Ask" real estate)
// plus a visible Q&A list. Both share the same data source.

import React from "react";

export interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How do I convert EST to IST?",
    a: "EST (UTC-5) and IST (UTC+5:30) are 10 hours 30 minutes apart. 10:00 AM EST is 8:30 PM IST the same day, and 10:00 PM EST is 9:30 AM IST the next day. Use the converter above for any specific time, or pin both cities to the live clocks strip for an at-a-glance reference.",
  },
  {
    q: "What is the best time to schedule a meeting between New York and London?",
    a: "The best overlap is 9:00 AM – 12:00 PM New York (2:00 PM – 5:00 PM London). For a 1-hour meeting, 10:00 AM ET / 3:00 PM GMT is the sweet spot — both cities are deep in working hours. During summer DST (March–October) the gap narrows from 5h to 4h, so 9:00 AM – 1:00 PM ET is then the overlap window.",
  },
  {
    q: "What time is it in Tokyo right now?",
    a: "Tokyo is on JST (UTC+9) year-round — no DST. The live clock above shows the current Tokyo time, ticking every second. The hero strip computes the time difference from your browser timezone in real time.",
  },
  {
    q: "When does daylight saving time end in 2026 in the US?",
    a: "DST in the United States ends on Sunday, November 1, 2026 at 2:00 AM local time — clocks fall back to 1:00 AM standard time. The converter above automatically accounts for DST, so the displayed Tokyo time remains correct year-round even as US clocks shift.",
  },
  {
    q: "How many business days are between two dates?",
    a: "Use the Date Difference tool with mode=business and country=US (or any supported country). The business-day count excludes weekends and federal holidays for the selected country. A 14-calendar-day span typically yields 10 business days, but the count varies by country and by which holidays fall in the range.",
  },
  {
    q: "Is this time zone converter free?",
    a: "Yes — completely free, no signup required. The same engine powers the public REST API at /api/v1/time/convert, so you can call it from your own apps without rate limits for typical use.",
  },
];

export interface TimeZoneFaqProps {
  /** Override copy per language; default is English copy. */
  items?: FaqItem[];
  lang?: string;
}

export default function TimeZoneFaq({ items = FAQS, lang = "en" }: TimeZoneFaqProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "inLanguage": lang,
    "mainEntity": items.map((x) => ({
      "@type": "Question",
      "name": x.q,
      "acceptedAnswer": { "@type": "Answer", "text": x.a },
    })),
  };

  return (
    <section className="space-y-5" aria-labelledby="tz-faq-heading">
      <header>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">FAQ</span>
        <h2 id="tz-faq-heading" className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Frequently asked questions
        </h2>
      </header>
      <dl className="grid gap-3 md:grid-cols-2">
        {items.map((x, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <dt className="text-[14px] font-bold text-slate-900">{x.q}</dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-slate-600">{x.a}</dd>
          </div>
        ))}
      </dl>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  );
}
