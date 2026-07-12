// src/lib/dateToWords/smoke-test.mjs
// Quick smoke test for the converter. Runs with `node --import tsx`.
// Replace with vitest when test infra is added.

import { convertDateToWords, getAllFormats, toOrdinal } from "./converter.ts";

const cases = [
  { date: "2026-07-11", expectLegal: "Eleventh day of July, Two Thousand Twenty-Six" },
  { date: "2026-01-01", expectLegal: "First day of January, Two Thousand Twenty-Six" },
  { date: "2026-01-02", expectLegal: "Second day of January, Two Thousand Twenty-Six" },
  { date: "2026-01-03", expectLegal: "Third day of January, Two Thousand Twenty-Six" },
  { date: "2026-01-20", expectLegal: "Twentieth day of January, Two Thousand Twenty-Six" },
  { date: "2026-01-30", expectLegal: "Thirtieth day of January, Two Thousand Twenty-Six" },
  { date: "2026-07-23", expectLegal: "Twenty-third day of July, Two Thousand Twenty-Six" },
  { date: "2026-07-31", expectLegal: "Thirty-first day of July, Two Thousand Twenty-Six" },
  { date: "0001-01-01", expectLegal: "First day of January, One" },
  { date: "9999-12-31", expectLegal: "Thirty-first day of December, Nine Thousand Nine Hundred Ninety-Nine" },
  { date: "1000-01-01", expectLegal: "First day of January, One Thousand" },
  { date: "2024-02-29", expectLegal: "Twenty-ninth day of February, Two Thousand Twenty-Four" },
];

let passed = 0;
let failed = 0;
const errors = [];

for (const test of cases) {
  try {
    const result = convertDateToWords({ dateString: test.date });
    if (result.legal === test.expectLegal) {
      console.log(`  ✓ ${test.date}`);
      passed++;
    } else {
      console.log(`  ✗ ${test.date}`);
      console.log(`     expected: ${test.expectLegal}`);
      console.log(`     got:      ${result.legal}`);
      failed++;
      errors.push(test.date);
    }
  } catch (e) {
    console.log(`  ✗ ${test.date} (threw: ${e.message})`);
    failed++;
    errors.push(test.date);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

// Test all 5 formats on a single date
const formats = getAllFormats("2026-07-11");
console.log("\nAll 5 formats for 2026-07-11:");
console.log(`  formal:  ${formats.formal}`);
console.log(`  legal:   ${formats.legal}`);
console.log(`  banking: ${formats.banking}`);
console.log(`  casual:  ${formats.casual}`);
console.log(`  british: ${formats.british}`);

// British format should include "and" before the last year word
if (!formats.british.includes(" and Twenty-Six")) {
  console.log("\n  ✗ British format missing 'and' before Twenty-Six");
  failed++;
} else {
  console.log("\n  ✓ British format includes 'and'");
  passed++;
}

// toOrdinal smoke test
const ordinalCases = [
  ["One", "First"],
  ["Two", "Second"],
  ["Three", "Third"],
  ["Five", "Fifth"],
  ["Eight", "Eighth"],
  ["Nine", "Ninth"],
  ["Twelve", "Twelfth"],
  ["Twenty", "Twentieth"],
  ["Thirty", "Thirtieth"],
  ["Forty", "Fortieth"],
  ["Twenty-Three", "Twenty-third"],
  ["Forty-Two", "Forty-second"],
  ["One Hundred", "One Hundredth"],
];

for (const [cardinal, expected] of ordinalCases) {
  const got = toOrdinal(cardinal);
  if (got === expected) {
    console.log(`  ✓ toOrdinal("${cardinal}") = "${got}"`);
    passed++;
  } else {
    console.log(`  ✗ toOrdinal("${cardinal}") = "${got}" (expected "${expected}")`);
    failed++;
  }
}

console.log(`\nFinal: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
