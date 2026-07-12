// src/components/tools/DateToWords.tsx
// Re-export shim — the premium Date to Words treatment now lives in
// `./DateToWord.tsx` (which implements the A4 design with 5 pastel
// format tabs, per-variant translation capture for 50 languages, and
// auto-redirect to the suggestion page for non-English locales).
//
// This file is kept as a stable import path because App.tsx and
// toolRoutes.ts reference "DateToWords". The legacy implementation
// that used to live here has been retired (commit f427372 supersedes).

export { DateToWord as default } from "./DateToWord";
export type { DateFormatId, LocaleTag, DateToWordsOutput } from "../../lib/dateToWords/converter";
