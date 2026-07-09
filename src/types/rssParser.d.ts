// src/types/rssParser.d.ts
// Ambient declarations for rss-parser (no @types package shipped).
declare module "rss-parser" {
  export interface Item {
    title?: string;
    link?: string;
    pubDate?: string;
    creator?: string;
    content?: string;
    contentSnippet?: string;
    isoDate?: string;
    categories?: string[] | string;
    guid?: string;
    summary?: string;
  }
  export interface Feed {
    title?: string;
    description?: string;
    link?: string;
    language?: string;
    items?: Item[];
    [k: string]: unknown;
  }
  export default class Parser {
    constructor(opts?: Record<string, unknown>);
    parseString(xml: string): Promise<Feed>;
    parseURL(feedUrl: string): Promise<Feed>;
  }
}
