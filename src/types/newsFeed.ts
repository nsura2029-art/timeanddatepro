// src/types/newsFeed.ts

export type NewsCategory = "world" | "science" | "technology" | "sports" | "business" | "entertainment";

export interface NewsFeed {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
  /** Optional ISO 3166-1 alpha-2 country code — used by /api/v1/news/by-country */
  country?: string;
  homepage: string;
  language: string;
  attribution: string;
}

export interface NewsItem {
  id: string;
  feedId: string;
  feedName: string;
  title: string;
  link: string;
  pubDate: string;        // ISO 8601
  description?: string;
  category: NewsCategory;
  attribution: string;
}