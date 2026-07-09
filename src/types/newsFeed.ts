// src/types/newsFeed.ts

export type NewsCategory = "world" | "science" | "tech" | "sports" | "business" | "entertainment";

export interface NewsFeed {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
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