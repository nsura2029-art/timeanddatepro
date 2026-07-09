// src/types/onthisday.ts

export type OnThisDayType = "events" | "births" | "deaths";

export interface OnThisDayEvent {
  year: number;            // negative for BC
  text: string;            // 1-2 sentence summary
  pages?: Array<{
    type?: string;
    title: string;
    displaytitle?: string;
    extract?: string;
    content_urls?: {
      desktop?: { page?: string };
      mobile?: { page?: string };
    };
  }>;
}

export interface OnThisDayFeed {
  events: OnThisDayEvent[];
  births: OnThisDayEvent[];
  deaths: OnThisDayEvent[];
  month: number;
  day: number;
  attribution: string;
}