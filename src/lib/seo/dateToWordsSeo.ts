// src/lib/seo/dateToWordsSeo.ts
// SEO config builder for the Date to Words tool. Centralizes the
// title, description, hreflang map, and JSON-LD schemas so they stay
// in sync across the main tool page and the programmatic year/day
// pages.

import type { SeoConfig } from "./useDocumentSeo";

const BASE_URL = "https://dateandtime.live";
const OG_IMAGE = `${BASE_URL}/og/date-to-word.png`;

const TOOL_PATH = "date-to-words";

const hreflangFor = (lang: string): string =>
  `${BASE_URL}/${lang}/${TOOL_PATH}`;

export const DATE_TO_WORDS_HREFLANGS: Record<string, string> = {
  en: hreflangFor("en"),
  fr: hreflangFor("fr"),
  zh: hreflangFor("zh"),
  ja: hreflangFor("ja"),
  "x-default": hreflangFor("en"),
};

/** Base SEO config used by the main /en/date-words page */
export function buildDateToWordsSeo(lang: string = "en"): SeoConfig {
  const canonicalUrl = hreflangFor(lang);
  return {
    title: "Date to Words Converter — Free Online Tool | TimeAndDatePro",
    description:
      "Convert any date (1-9999) to written words for legal documents, cheques, passports, and contracts. Five formats: formal, legal, banking, casual, British. Free, no signup.",
    canonicalUrl,
    ogImageUrl: OG_IMAGE,
    ogType: "website",
    hreflang: DATE_TO_WORDS_HREFLANGS,
    siteName: "TimeAndDatePro",
  };
}

/** Build the FAQ schema with N questions */
export function buildDateToWordsFaqSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** HowTo schema (3 steps) */
export function buildDateToWordsHowToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to write a date in formal words",
    description:
      "Convert any calendar date to written words in three simple steps.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Enter your date",
        text: "Type or paste a date in any common format: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, or written out (e.g. '11 July 2026'). The parser auto-detects the format.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Pick a format",
        text: "Choose from five formats: Formal, Legal, Banking, Casual, or British. Each is suited to a different document type — cheques need Banking, contracts need Legal, invitations need Casual.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Copy the result",
        text: "Click Copy, download as .txt or .md, or share a link. The result is also available in the API response as JSON for developers.",
      },
    ],
    totalTime: "PT5S",
  };
}

/** BreadcrumbList schema */
export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** The 20 FAQ questions used on the main tool page */
export const DATE_TO_WORDS_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "How do I write a date in formal words?",
    answer:
      "Use the formal format: day + 'of' + month + ',' + year. Example: 'Eleventh of July, Two Thousand Twenty-Six'.",
  },
  {
    question: "How do I write a date on a cheque?",
    answer:
      "Use the banking format on the date line of a cheque: 'Eleventh July, Two Thousand Twenty-Six'. Write the day as an ordinal, the month by name, and the year spelled out in full. Many banks reject cheques with abbreviated years.",
  },
  {
    question: "What years does this support?",
    answer:
      "Any year from 1 to 9999. Year 1 becomes 'One', year 1985 becomes 'One Thousand Nine Hundred Eighty-Five', and year 9999 becomes 'Nine Thousand Nine Hundred Ninety-Nine'. Negative years (BCE) are not currently supported.",
  },
  {
    question: "What's the difference between 'Legal' and 'Formal' format?",
    answer:
      "Legal format includes the 'day of' connector: 'Eleventh day of July, Two Thousand Twenty-Six'. Formal format omits it: 'Eleventh of July, Two Thousand Twenty-Six'. Both are accepted on legal documents; Legal format is the more traditional American convention.",
  },
  {
    question: "Does it support non-English dates?",
    answer:
      "Currently English (US) and English (UK) are fully supported. The 'and' conjunction in the year (British) is the only UK-specific difference. French, German, Spanish, Italian, Portuguese, Japanese, Chinese, Arabic, and Hindi are planned for Phase 2.",
  },
  {
    question: "Is the conversion done on my device or a server?",
    answer:
      "The conversion runs entirely in your browser (client-side). Your dates are never sent to a server. This is faster, works offline once loaded, and keeps any sensitive dates (passport numbers, contract dates) private.",
  },
  {
    question: "Can I bulk-convert a list of dates?",
    answer:
      "Yes — sign in for free, then upload a CSV with up to 10,000 dates. The bulk endpoint returns all five formats per row and supports custom format selection per row. Free tier includes 1,000 conversions per month.",
  },
  {
    question: "Is there an API?",
    answer:
      "Yes. POST /api/v1/tools/date-to-word accepts JSON {date, locale, format} and returns all five variants with metadata. Free tier: 100 requests per day. No auth required. Rate-limit headers included. See API docs for full schema.",
  },
  {
    question: "How do I write the 1st of a month in words?",
    answer:
      "First. The first day of any month is written with the ordinal 'first' (not 'one'). For example: 'First day of January, Two Thousand Twenty-Six'.",
  },
  {
    question: "What format do banks use for cheque dates?",
    answer:
      "Banks expect the banking format: day as ordinal + month name + comma + year in full. Example: 'Eleventh July, Two Thousand Twenty-Six'. Abbreviating the year (e.g. '2026') or the month (e.g. 'Jul') is a common reason banks reject cheques.",
  },
  {
    question: "How do I write a date on a passport application?",
    answer:
      "Most passport applications use the formal or legal format. The legal format is preferred: 'Eleventh day of July, Two Thousand Twenty-Six'. Always match the format requested in the form's instructions.",
  },
  {
    question: "What is the legal date format for contracts?",
    answer:
      "Contracts traditionally use the legal format with the 'day of' connector: 'This Agreement is entered into on the Eleventh day of July, Two Thousand Twenty-Six'. The format is unambiguous and resistant to tampering after signing.",
  },
  {
    question: "How do you write the year 2000 in words on a cheque?",
    answer:
      "Two Thousand. For cheques specifically, write 'Two Thousand' (not 'Two Thousand and' — the British 'and' is not used in American cheque writing). For the full date January 1, 2000: 'First January, Two Thousand'.",
  },
  {
    question: "What is the difference between 'day of' and 'of' in date formats?",
    answer:
      "'Day of' (e.g. 'Eleventh day of July') is the traditional legal format used in contracts, deeds, and affidavits. 'Of' alone (e.g. 'Eleventh of July') is the formal format used in modern business correspondence. Both are correct — choose the one your document requires.",
  },
  {
    question: "Can I use this for notarized documents?",
    answer:
      "Yes. The legal format produced by this tool is the standard convention for notarized documents in the United States. However, always have a qualified notary or attorney verify the result before signing — the tool is a writing aid, not legal advice.",
  },
  {
    question: "How do I write a date in full words for an affidavit?",
    answer:
      "Use the legal format: 'Eleventh day of July, Two Thousand Twenty-Six'. Affidavits require the most formal date format possible. Never abbreviate the year or the month in an affidavit.",
  },
  {
    question: "How do you write the date on a will?",
    answer:
      "Wills use the legal format, typically: 'This Last Will and Testament, made this Eleventh day of July, Two Thousand Twenty-Six...'. The date appears at the top of the will and is critical for legal validity.",
  },
  {
    question: "What is the British date format?",
    answer:
      "British English uses the same ordinals as American English but inserts 'and' before the final word of the year. Example: 'Eleventh day of July, Two Thousand and Twenty-Six' (note the 'and'). American English omits the 'and'.",
  },
  {
    question: "How do I write dates in AP style?",
    answer:
      "Associated Press (AP) style uses the casual format: 'July eleventh, twenty twenty-six'. The month is capitalized, the day is a lowercase ordinal, and the year is lowercase words. Example: 'The meeting is on July eleventh, twenty twenty-six.'",
  },
  {
    question: "Is the date 'the' included in the British date format?",
    answer:
      "Yes — British English inserts the word 'and' before the final word of the year: 'Two Thousand and Twenty-Six'. American English omits the 'and': 'Two Thousand Twenty-Six'. This is the only meaningful difference between the two formats.",
  },
];
