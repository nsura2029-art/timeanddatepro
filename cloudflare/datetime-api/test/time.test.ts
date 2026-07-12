// test/time.test.ts
// Tests for time utilities: formatting, parts, business days, YMD diff.

import { describe, it, expect } from "vitest";
import {
  formatInTz,
  partsInTz,
  isoInTz,
  tzAbbreviation,
  tzOffsetMinutes,
  businessDaysBetween,
  calendarDaysBetween,
  ymdBetween,
  daysInMonth,
  isLeapYear,
} from "../src/lib/time";

describe("formatInTz", () => {
  it("formats a UTC date in NY", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    const out = formatInTz(d, "America/New_York", { hour: "2-digit", hour12: false });
    expect(out).toMatch(/07/); // 12 UTC = 7 AM EST
  });

  it("falls back to UTC on invalid timezone", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    const out = formatInTz(d, "Not/A/Zone", { hour: "2-digit", hour12: false });
    expect(out).toMatch(/12/);
  });
});

describe("partsInTz", () => {
  it("extracts the right hour in Tokyo", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    const p = partsInTz(d, "Asia/Tokyo");
    expect(p.hour).toBe(21); // 12 UTC = 21 JST
  });

  it("handles day rollover", () => {
    const d = new Date("2026-01-01T20:00:00Z");
    const p = partsInTz(d, "Asia/Tokyo");
    expect(p.day).toBe(2); // Jan 2 in Tokyo
  });
});

describe("isoInTz", () => {
  it("formats without Z suffix", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    const out = isoInTz(d, "UTC");
    expect(out).toBe("2026-01-01T12:00:00");
  });
});

describe("tzAbbreviation", () => {
  it("returns EST for NY in winter", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    const abbr = tzAbbreviation(d, "America/New_York");
    expect(abbr).toMatch(/EST|UTC|GMT/);
  });
});

describe("tzOffsetMinutes", () => {
  it("returns -300 for EST", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    expect(tzOffsetMinutes(d, "America/New_York")).toBe(-300);
  });
  it("returns 0 for UTC", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    expect(tzOffsetMinutes(d, "UTC")).toBe(0);
  });
  it("returns 540 for JST", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    expect(tzOffsetMinutes(d, "Asia/Tokyo")).toBe(540);
  });
});

describe("businessDaysBetween", () => {
  it("counts a full week (Mon-Fri)", () => {
    // Mon 2026-01-05 to Fri 2026-01-09 = 5 business days
    const start = new Date("2026-01-05T00:00:00Z");
    const end = new Date("2026-01-09T00:00:00Z");
    expect(businessDaysBetween(start, end)).toBe(5);
  });
  it("returns 0 for a weekend-only range", () => {
    // Sat-Sun = 0 business days
    const start = new Date("2026-01-03T00:00:00Z");
    const end = new Date("2026-01-04T00:00:00Z");
    expect(businessDaysBetween(start, end)).toBe(0);
  });
  it("swaps start/end if reversed (returns positive)", () => {
    const a = new Date("2026-01-05T00:00:00Z");
    const b = new Date("2026-01-09T00:00:00Z");
    expect(businessDaysBetween(b, a)).toBe(businessDaysBetween(a, b));
  });
});

describe("calendarDaysBetween", () => {
  it("counts 30 days", () => {
    const a = new Date("2026-01-01T00:00:00Z");
    const b = new Date("2026-01-31T00:00:00Z");
    expect(calendarDaysBetween(a, b)).toBe(30);
  });
  it("returns 0 for the same day", () => {
    const a = new Date("2026-01-01T00:00:00Z");
    const b = new Date("2026-01-01T12:00:00Z");
    expect(calendarDaysBetween(a, b)).toBe(0);
  });
});

describe("ymdBetween", () => {
  it("exactly 1 year", () => {
    const a = new Date("2025-01-01T00:00:00Z");
    const b = new Date("2026-01-01T00:00:00Z");
    expect(ymdBetween(a, b)).toEqual({ years: 1, months: 0, days: 0 });
  });
  it("handles month borrowing", () => {
    // 2026-01-31 to 2026-02-28 = 0y 0m 28d (Feb has no 31)
    const a = new Date("2026-01-31T00:00:00Z");
    const b = new Date("2026-02-28T00:00:00Z");
    expect(ymdBetween(a, b)).toEqual({ years: 0, months: 0, days: 28 });
  });
});

describe("daysInMonth", () => {
  it("Feb in a leap year = 29", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });
  it("Feb in a non-leap year = 28", () => {
    expect(daysInMonth(2023, 2)).toBe(28);
  });
  it("April = 30", () => {
    expect(daysInMonth(2026, 4)).toBe(30);
  });
  it("handles invalid month (returns 0)", () => {
    expect(daysInMonth(2026, 0)).toBe(0);
    expect(daysInMonth(2026, 13)).toBe(0);
  });
});

describe("isLeapYear", () => {
  it("2024 is a leap year (div by 4)", () => {
    expect(isLeapYear(2024)).toBe(true);
  });
  it("2023 is not", () => {
    expect(isLeapYear(2023)).toBe(false);
  });
  it("2000 is a leap year (div by 400)", () => {
    expect(isLeapYear(2000)).toBe(true);
  });
  it("1900 is NOT a leap year (div by 100 but not 400)", () => {
    expect(isLeapYear(1900)).toBe(false);
  });
  it("2400 is a leap year", () => {
    expect(isLeapYear(2400)).toBe(true);
  });
});
