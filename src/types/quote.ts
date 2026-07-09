// src/types/quote.ts
// Tag taxonomy for the quote selector. Matches the demo data shape.

export type QuoteTag =
  | "morning" | "afternoon" | "evening" | "night"
  | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
  | "weekend" | "weekday"
  | "country:us" | "country:gb" | "country:fr" | "country:de" | "country:jp"
  | "country:cn" | "country:in" | "country:br" | "country:au" | "country:ca"
  | "country:mx" | "country:it" | "country:es" | "country:kr" | "country:ru"
  | "country:global"
  | "holiday"
  | "general";

export interface Quote {
  id: string;
  text: string;
  author?: string;
  tags: QuoteTag[];
  lang?: "en" | "fr" | "ja" | "zh";
}