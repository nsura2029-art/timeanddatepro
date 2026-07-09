// src/data/news/newsFeeds.ts
// RSS feeds for the news section. Manually curated for time/date relevance.
// Source: Public RSS feeds from major outlets. Free to use with attribution.
// Cache-Control: max-age=900 (15 minutes) for news freshness.

import type { NewsFeed } from "../../types/newsFeed";

export const NEWS_FEEDS: NewsFeed[] = [
  {
    id: "nyt-world",
    name: "New York Times — World",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    category: "world",
    homepage: "https://www.nytimes.com/section/world",
    language: "en",
    attribution: "The New York Times",
  },
  {
    id: "nyt-science",
    name: "New York Times — Science",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
    category: "science",
    homepage: "https://www.nytimes.com/section/science",
    language: "en",
    attribution: "The New York Times",
  },
  {
    id: "bbc-world",
    name: "BBC News — World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "world",
    homepage: "https://www.bbc.com/news/world",
    language: "en",
    attribution: "BBC",
  },
  {
    id: "bbc-science",
    name: "BBC News — Science & Environment",
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    category: "science",
    homepage: "https://www.bbc.com/news/science_and_environment",
    language: "en",
    attribution: "BBC",
  },
  {
    id: "reuters-world",
    name: "Reuters — World News",
    url: "https://www.reutersagency.com/feed/?best-topics=world&post_type=best",
    category: "world",
    homepage: "https://www.reuters.com/world",
    language: "en",
    attribution: "Reuters",
  },
  {
    id: "ap-top",
    name: "Associated Press — Top News",
    url: "https://feeds.apnews.com/rss/apf-topnews",
    category: "world",
    homepage: "https://apnews.com",
    language: "en",
    attribution: "Associated Press",
  },
  {
    id: "espn-soccer",
    name: "ESPN — Soccer",
    url: "https://www.espn.com/espn/rss/soccer/news",
    category: "sports",
    homepage: "https://www.espn.com/soccer/",
    language: "en",
    attribution: "ESPN",
  },
  {
    id: "espn-tennis",
    name: "ESPN — Tennis",
    url: "https://www.espn.com/espn/rss/tennis/news",
    category: "sports",
    homepage: "https://www.espn.com/tennis/",
    language: "en",
    attribution: "ESPN",
  },
  {
    id: "verge-tech",
    name: "The Verge — Tech",
    url: "https://www.theverge.com/rss/index.xml",
    category: "tech",
    homepage: "https://www.theverge.com",
    language: "en",
    attribution: "The Verge",
  },
  {
    id: "arstechnica",
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    category: "tech",
    homepage: "https://arstechnica.com",
    language: "en",
    attribution: "Ars Technica",
  },
];

export function getNewsFeedsByCategory(category: NewsFeed["category"]): NewsFeed[] {
  return NEWS_FEEDS.filter((f) => f.category === category);
}