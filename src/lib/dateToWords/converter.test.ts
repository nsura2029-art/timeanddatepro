// src/lib/dateToWords/converter.test.ts
// Unit tests for the date-to-words converter. Run with vitest once it's
// added to devDependencies (`npm i -D vitest`). For now, use
// `node --import tsx src/lib/dateToWords/smoke-test.mjs` for smoke tests.
//
// import { describe, it, expect } from "vitest";
import { convertDateToWords, getAllFormats, toOrdinal, DateToWordsError, type DateFormatId } from "./converter";

// Minimal shims so this file type-checks without vitest installed.
// Remove these declarations once `npm i -D vitest` is run.
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: any;

describe("convertDateToWords", () => {
  it("converts a normal date in all 5 formats", () => {
    const out = convertDateToWords({ dateString: "2026-07-11" });
    expect(out.formal).toBe("Eleventh of July, Two Thousand Twenty-Six");
    expect(out.legal).toBe("Eleventh day of July, Two Thousand Twenty-Six");
    expect(out.banking).toBe("Eleventh July, Two Thousand Twenty-Six");
    expect(out.casual).toBe("July eleven, two thousand twenty-six");
    expect(out.british).toBe("Eleventh day of July, Two Thousand and Twenty-Six");
  });

  it("handles the 1st of the month (irregular ordinal)", () => {
    const out = convertDateToWords({ dateString: "2026-01-01" });
    expect(out.legal).toBe("First day of January, Two Thousand Twenty-Six");
  });

  it("handles the 2nd, 3rd, 5th, 8th, 9th, 12th, 20th, 30th (irregular ordinals)", () => {
    const cases: Array<[string, string]> = [
      ["2026-01-02", "Second day of January, Two Thousand Twenty-Six"],
      ["2026-01-03", "Third day of January, Two Thousand Twenty-Six"],
      ["2026-01-05", "Fifth day of January, Two Thousand Twenty-Six"],
      ["2026-01-08", "Eighth day of January, Two Thousand Twenty-Six"],
      ["2026-01-09", "Ninth day of January, Two Thousand Twenty-Six"],
      ["2026-01-12", "Twelfth day of January, Two Thousand Twenty-Six"],
      ["2026-01-20", "Twentieth day of January, Two Thousand Twenty-Six"],
      ["2026-01-30", "Thirtieth day of January, Two Thousand Twenty-Six"],
    ];
    for (const [date, expected] of cases) {
      const out = convertDateToWords({ dateString: date });
      expect(out.legal).toBe(expected);
    }
  });

  it("handles 23rd, 31st (hyphenated compound ordinals)", () => {
    expect(convertDateToWords({ dateString: "2026-07-23" }).legal).toBe(
      "Twenty-third day of July, Two Thousand Twenty-Six"
    );
    expect(convertDateToWords({ dateString: "2026-07-31" }).legal).toBe(
      "Thirty-first day of July, Two Thousand Twenty-Six"
    );
  });

  it("handles year 1 (boundary)", () => {
    const out = convertDateToWords({ dateString: "0001-01-01" });
    expect(out.legal).toBe("First day of January, One");
  });

  it("handles year 9999 (boundary)", () => {
    const out = convertDateToWords({ dateString: "9999-12-31" });
    expect(out.legal).toBe("Thirty-first day of December, Nine Thousand Nine Hundred Ninety-Nine");
  });

  it("handles year 1000 (round thousand)", () => {
    const out = convertDateToWords({ dateString: "1000-01-01" });
    expect(out.legal).toBe("First day of January, One Thousand");
  });

  it("handles leap day Feb 29 in 2024", () => {
    const out = convertDateToWords({ dateString: "2024-02-29" });
    expect(out.legal).toBe("Twenty-ninth day of February, Two Thousand Twenty-Four");
  });

  it("respects the requested format", () => {
    const out = convertDateToWords({ dateString: "2026-07-11", format: "banking" });
    expect(out.selected).toBe("Eleventh July, Two Thousand Twenty-Six");
  });

  it("supports en-GB locale (British format only differs in 'and')", () => {
    const out = convertDateToWords({ dateString: "2026-07-11", locale: "en-GB" });
    expect(out.british).toBe("Eleventh day of July, Two Thousand and Twenty-Six");
  });

  it("parses MM/DD/YYYY US format", () => {
    const out = convertDateToWords({ dateString: "07/11/2026" });
    expect(out.year).toBe(2026);
    expect(out.month).toBe(7);
    expect(out.day).toBe(11);
  });

  it("parses DD.MM.YYYY European format", () => {
    const out = convertDateToWords({ dateString: "11.07.2026" });
    expect(out.year).toBe(2026);
    expect(out.month).toBe(7);
    expect(out.day).toBe(11);
  });

  it("parses spelled-out '11 July 2026'", () => {
    const out = convertDateToWords({ dateString: "11 July 2026" });
    expect(out.day).toBe(11);
    expect(out.month).toBe(7);
    expect(out.year).toBe(2026);
  });

  it("parses spelled-out 'July 11, 2026'", () => {
    const out = convertDateToWords({ dateString: "July 11, 2026" });
    expect(out.day).toBe(11);
    expect(out.month).toBe(7);
    expect(out.year).toBe(2026);
  });

  it("throws DateToWordsError for empty string", () => {
    expect(() => convertDateToWords({ dateString: "" })).toThrow(DateToWordsError);
  });

  it("throws DateToWordsError for garbage", () => {
    expect(() => convertDateToWords({ dateString: "not a date" })).toThrow(DateToWordsError);
  });

  it("throws DateToWordsError for unsupported locale", () => {
    expect(() => convertDateToWords({ dateString: "2026-07-11", locale: "fr-FR" as never })).toThrow(DateToWordsError);
  });

  it("getAllFormats returns the 5 named formats", () => {
    const formats = getAllFormats("2026-07-11");
    const expectedKeys: DateFormatId[] = ["formal", "legal", "banking", "casual", "british"];
    for (const key of expectedKeys) {
      expect(formats[key]).toBeTruthy();
    }
  });
});

describe("toOrdinal", () => {
  it("converts irregular cardinals", () => {
    expect(toOrdinal("One")).toBe("First");
    expect(toOrdinal("Two")).toBe("Second");
    expect(toOrdinal("Three")).toBe("Third");
    expect(toOrdinal("Five")).toBe("Fifth");
    expect(toOrdinal("Eight")).toBe("Eighth");
    expect(toOrdinal("Nine")).toBe("Ninth");
    expect(toOrdinal("Twelve")).toBe("Twelfth");
  });

  it("converts decades", () => {
    expect(toOrdinal("Twenty")).toBe("Twentieth");
    expect(toOrdinal("Thirty")).toBe("Thirtieth");
    expect(toOrdinal("Forty")).toBe("Fortieth");
    expect(toOrdinal("Eighty")).toBe("Eightieth");
  });

  it("converts hyphenated compounds (last part gets the suffix)", () => {
    expect(toOrdinal("Twenty-Three")).toBe("Twenty-third");
    expect(toOrdinal("Forty-Two")).toBe("Forty-second");
  });

  it("converts space-separated compounds (last part gets the suffix)", () => {
    expect(toOrdinal("One Hundred")).toBe("One Hundredth");
  });
});
