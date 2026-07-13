// src/lib/dateToWords/converter.ts
// Pure functions that convert a calendar date to its written-word form.
// Runs entirely in the browser — no API call. Output is deterministic.
//
// Five formats are supported, matching the A4 design:
//   - "formal"  : "Eleventh of July, Two Thousand Twenty-Six"
//   - "legal"   : "Eleventh day of July, Two Thousand Twenty-Six"
//   - "banking" : "Eleventh July, Two Thousand Twenty-Six"
//   - "casual"  : "July eleventh, twenty twenty-six"
//   - "british" : "Eleventh day of July, Two Thousand and Twenty-Six"
//
// Year range: 1 to 9999.

export type DateFormatId = "formal" | "legal" | "banking" | "casual" | "british";

export type LocaleTag = "en-US" | "en-GB";

export interface DateToWordsInput {
  /** ISO 8601 date string: "YYYY-MM-DD" */
  dateString: string;
  /** Locale — only "en-US" and "en-GB" supported by this engine */
  locale?: LocaleTag;
  /** Optional format; if omitted, the engine returns all five */
  format?: DateFormatId;
}

export interface DateToWordsOutput {
  dateString: string;
  year: number;
  month: number;
  day: number;
  locale: LocaleTag;
  formal: string;
  legal: string;
  banking: string;
  casual: string;
  british: string;
  /** The format the caller asked for (echoed for convenience) */
  selected: string;
}

export class DateToWordsError extends Error {
  constructor(
    public readonly code:
      | "INVALID_DATE_STRING"
      | "YEAR_OUT_OF_RANGE"
      | "INVALID_MONTH"
      | "INVALID_DAY"
      | "UNSUPPORTED_LOCALE",
    message: string
  ) {
    super(message);
    this.name = "DateToWordsError";
  }
}

/* ─────────────────────────────────────────────────────────────────────
   Public API
   ───────────────────────────────────────────────────────────────────── */

export function convertDateToWords(input: DateToWordsInput): DateToWordsOutput {
  const locale: LocaleTag = input.locale ?? "en-US";
  if (locale !== "en-US" && locale !== "en-GB") {
    throw new DateToWordsError(
      "UNSUPPORTED_LOCALE",
      `Locale "${locale}" is not supported yet. Try "en-US" or "en-GB".`
    );
  }

  const parsedDate = parseDateString(input.dateString);
  const { year, month, day } = parsedDate;

  if (year < 1 || year > 9999) {
    throw new DateToWordsError(
      "YEAR_OUT_OF_RANGE",
      `Year ${year} is out of range. Date to Words supports years 1 through 9999.`
    );
  }

  const monthName = MONTH_NAMES[month - 1];
  const dayOrdinal = numberToOrdinal(day);
  const dayCardinal = numberToCardinal(day);
  const yearWords = numberToYearWords(year);
  const yearWordsCasual = yearWords.toLowerCase();

  // British: "Two Thousand Twenty-Six" → "Two Thousand and Twenty-Six"
  const yearWordsBritish = insertBritishAnd(yearWords);

  const formalWords  = `${dayOrdinal} of ${monthName}, ${yearWords}`;
  const legalWords   = `${dayOrdinal} day of ${monthName}, ${yearWords}`;
  const bankingWords = `${dayOrdinal} ${monthName}, ${yearWords}`;
  const casualWords  = `${monthName} ${dayCardinal.toLowerCase()}, ${yearWordsCasual}`;
  const britishWords = `${dayOrdinal} day of ${monthName}, ${yearWordsBritish}`;

  const allFormats = {
    formal: formalWords,
    legal: legalWords,
    banking: bankingWords,
    casual: casualWords,
    british: britishWords,
  };

  const selected = input.format
    ? allFormats[input.format]
    : allFormats.legal;

  return {
    dateString: input.dateString,
    year,
    month,
    day,
    locale,
    selected,
    ...allFormats,
  };
}

/** Convenience: return all five formats as a labelled object */
export function getAllFormats(dateString: string, locale: LocaleTag = "en-US") {
  const out = convertDateToWords({ dateString, locale });
  return {
    formal: out.formal,
    legal: out.legal,
    banking: out.banking,
    casual: out.casual,
    british: out.british,
  };
}

/* ─────────────────────────────────────────────────────────────────────
   Parsing
   ───────────────────────────────────────────────────────────────────── */

function parseDateString(raw: string): { year: number; month: number; day: number } {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new DateToWordsError("INVALID_DATE_STRING", "Date is empty.");
  }

  // ISO 8601: YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10),
      day: parseInt(isoMatch[3], 10),
    };
  }

  // US: M/D/YYYY
  const usMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (usMatch) {
    return {
      month: parseInt(usMatch[1], 10),
      day: parseInt(usMatch[2], 10),
      year: parseInt(usMatch[3], 10),
    };
  }

  // European: D.M.YYYY
  const euMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (euMatch) {
    return {
      day: parseInt(euMatch[1], 10),
      month: parseInt(euMatch[2], 10),
      year: parseInt(euMatch[3], 10),
    };
  }

  // Spelled out: "11 July 2026" or "July 11, 2026"
  const spelledMatch = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$|^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/.exec(trimmed);
  if (spelledMatch) {
    if (spelledMatch[1] && spelledMatch[2] && spelledMatch[3]) {
      return {
        day: parseInt(spelledMatch[1], 10),
        month: monthFromName(spelledMatch[2]),
        year: parseInt(spelledMatch[3], 10),
      };
    }
    if (spelledMatch[4] && spelledMatch[5] && spelledMatch[6]) {
      return {
        day: parseInt(spelledMatch[5], 10),
        month: monthFromName(spelledMatch[4]),
        year: parseInt(spelledMatch[6], 10),
      };
    }
  }

  // Fall back to Date.parse (handles lots of edge cases)
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    };
  }

  throw new DateToWordsError(
    "INVALID_DATE_STRING",
    `Could not parse "${raw}" as a date. Try YYYY-MM-DD, MM/DD/YYYY, or "11 July 2026".`
  );
}

function monthFromName(name: string): number {
  const idx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === name.toLowerCase());
  if (idx === -1) {
    throw new DateToWordsError(
      "INVALID_MONTH",
      `"${name}" is not a recognised month name.`
    );
  }
  return idx + 1;
}

/* ─────────────────────────────────────────────────────────────────────
   Number → words
   ───────────────────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ONES_AND_TEENS = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const TENS_MULTIPLE = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty",
  "Sixty", "Seventy", "Eighty", "Ninety",
];

const ORDINAL_IRREGULAR: Record<string, string> = {
  "One": "First", "Two": "Second", "Three": "Third", "Five": "Fifth",
  "Eight": "Eighth", "Nine": "Ninth", "Twelve": "Twelfth",
  "Twenty": "Twentieth", "Thirty": "Thirtieth", "Forty": "Fortieth",
  "Fifty": "Fiftieth", "Sixty": "Sixtieth", "Seventy": "Seventieth",
  "Eighty": "Eightieth", "Ninety": "Ninetieth",
};

function numberToCardinal(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0) return "Minus " + numberToCardinal(-n);

  const parts: string[] = [];
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1_000;

  if (billions) parts.push(numberUnderThousand(billions) + " Billion" + (billions > 1 ? "s" : ""));
  if (millions) parts.push(numberUnderThousand(millions) + " Million" + (millions > 1 ? "s" : ""));
  if (thousands) parts.push(numberUnderThousand(thousands) + " Thousand");
  if (remainder) parts.push(numberUnderThousand(remainder));

  return parts.join(" ").trim();
}

function numberUnderThousand(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES_AND_TEENS[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return TENS_MULTIPLE[tens] + (ones ? "-" + ONES_AND_TEENS[ones] : "");
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return ONES_AND_TEENS[hundreds] + " Hundred" + (rest ? " " + numberUnderThousand(rest) : "");
}

/**
 * Convert a cardinal word string to its ordinal form.
 *  "One" → "First", "Twenty-Three" → "Twenty-Third", "Two Hundred" → "Two Hundredth"
 */
export function toOrdinal(cardinalString: string): string {
  if (!cardinalString) return cardinalString;

  // 1. Hyphenated form: "Twenty-Three" → "Twenty-Third"
  if (cardinalString.includes("-")) {
    const parts = cardinalString.split("-");
    const lastIndex = parts.length - 1;
    return parts
      .map((part, i) => {
        if (i < lastIndex) return part;
        // Last part — get its ordinal, lowercased to fit the hyphen
        let ordinal: string;
        if (ORDINAL_IRREGULAR[part]) {
          ordinal = ORDINAL_IRREGULAR[part];
        } else if (part.endsWith("y")) {
          ordinal = part.slice(0, -1) + "ieth";
        } else {
          ordinal = part + "th";
        }
        return ordinal.toLowerCase();
      })
      .join("-");
  }

  // 2. Space-separated form: "Two Hundred" → "Two Hundredth"
  const lastSpace = cardinalString.lastIndexOf(" ");
  if (lastSpace !== -1) {
    const head = cardinalString.slice(0, lastSpace);
    const tail = cardinalString.slice(lastSpace + 1);
    if (ORDINAL_IRREGULAR[tail]) return head + " " + ORDINAL_IRREGULAR[tail];
    if (tail.endsWith("y")) return head + " " + tail.slice(0, -1) + "ieth";
    return head + " " + tail + "th";
  }

  // 3. Single word
  if (ORDINAL_IRREGULAR[cardinalString]) return ORDINAL_IRREGULAR[cardinalString];
  if (cardinalString.endsWith("y")) return cardinalString.slice(0, -1) + "ieth";
  return cardinalString + "th";
}

export function numberToOrdinal(n: number): string {
  return toOrdinal(numberToCardinal(n));
}

/**
 * Year words. For years 1000-9999 we use the "Two Thousand Twenty-Six" style
 * (split into two halves). For 1-999 we just write the cardinal.
 */
function numberToYearWords(year: number): string {
  if (year < 1000) return numberToCardinal(year);

  const thousands = Math.floor(year / 1000);
  const rest = year % 1000;
  const thousandsPart = numberToCardinal(thousands) + " Thousand";

  if (rest === 0) return thousandsPart;
  return thousandsPart + " " + numberToCardinal(rest);
}

/**
 * British style: insert " and " before the final word of the year.
 * "Two Thousand Twenty-Six" → "Two Thousand and Twenty-Six"
 * "One Thousand Nine Hundred Eighty-Five" → "One Thousand Nine Hundred and Eighty-Five"
 */
function insertBritishAnd(yearWords: string): string {
  const parts = yearWords.split(" ");
  if (parts.length <= 1) return yearWords;
  return parts.slice(0, -1).join(" ") + " and " + parts[parts.length - 1];
}
