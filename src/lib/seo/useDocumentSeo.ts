// src/lib/seo/useDocumentSeo.ts
// Document-level SEO helper for tool pages. Mounts/unmounts meta tags,
// title, canonical, Open Graph, Twitter Card, hreflang alternates, and
// JSON-LD schemas in the document <head>. Idempotent — calling with
// the same values is a no-op; calling again with different values
// swaps the tags cleanly.

import { useEffect } from "react";

export interface SeoConfig {
  /** Document title, e.g. "Date to Words Converter — TimeAndDatePro" */
  title: string;
  /** Meta description, ~150-160 chars */
  description: string;
  /** Canonical URL (absolute) */
  canonicalUrl: string;
  /** Path to og:image (absolute URL preferred) */
  ogImageUrl: string;
  /** Open Graph type, defaults to "website" */
  ogType?: "website" | "article";
  /** Hreflang alternates: { "en": "https://...en/...", "fr": "https://...fr/..." } */
  hreflang?: Record<string, string>;
  /** JSON-LD schema objects to inject as <script type="application/ld+json"> */
  schemas?: object[];
  /** Optional site name override, defaults to "TimeAndDatePro" */
  siteName?: string;
}

const SITE_NAME = "TimeAndDatePro";
const TWITTER_HANDLE = "@timeanddatepro";

/**
 * Mount SEO meta tags in document.head. Cleans them up on unmount.
 * Pass a `key` (route path) as the second arg if you want to force
 * a fresh injection when the URL changes.
 */
export function useDocumentSeo(config: SeoConfig): void {
  useEffect(() => {
    const created: HTMLMetaElement[] = [];
    const createdLinks: HTMLLinkElement[] = [];
    const createdScripts: HTMLScriptElement[] = [];

    // 1. Title
    const previousTitle = document.title;
    document.title = config.title;

    // 2. Helper to add or update a meta tag
    const setMeta = (
      attr: "name" | "property",
      key: string,
      content: string
    ) => {
      let el = document.head.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        created.push(el);
      }
      el.setAttribute("content", content);
    };

    // 3. Helper to add or update a link tag
    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]`;
      let el = document.head.querySelector<HTMLLinkElement>(selector);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        if (hreflang) el.setAttribute("hreflang", hreflang);
        document.head.appendChild(el);
        createdLinks.push(el);
      }
      el.setAttribute("href", href);
    };

    // 4. Helper to add a JSON-LD script
    const setSchema = (data: object, id: string) => {
      let el = document.head.querySelector<HTMLScriptElement>(
        `script[type="application/ld+json"][data-seo-id="${id}"]`
      );
      if (!el) {
        el = document.createElement("script");
        el.setAttribute("type", "application/ld+json");
        el.setAttribute("data-seo-id", id);
        document.head.appendChild(el);
        createdScripts.push(el);
      }
      el.textContent = JSON.stringify(data);
    };

    // Standard meta
    setMeta("name", "description", config.description);
    setMeta("name", "viewport", "width=device-width, initial-scale=1.0");

    // Canonical
    setLink("canonical", config.canonicalUrl);

    // Open Graph
    setMeta("property", "og:type", config.ogType ?? "website");
    setMeta("property", "og:title", config.title);
    setMeta("property", "og:description", config.description);
    setMeta("property", "og:url", config.canonicalUrl);
    setMeta("property", "og:image", config.ogImageUrl);
    setMeta("property", "og:site_name", config.siteName ?? SITE_NAME);

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", config.title);
    setMeta("name", "twitter:description", config.description);
    setMeta("name", "twitter:image", config.ogImageUrl);
    setMeta("name", "twitter:site", TWITTER_HANDLE);

    // Hreflang alternates
    if (config.hreflang) {
      Object.entries(config.hreflang).forEach(([lang, url]) => {
        setLink("alternate", url, lang);
      });
    }

    // JSON-LD schemas
    if (config.schemas) {
      config.schemas.forEach((schema, i) => {
        setSchema(schema, `seo-schema-${i}`);
      });
    }

    // Cleanup on unmount
    return () => {
      document.title = previousTitle;
      created.forEach((el) => el.remove());
      createdLinks.forEach((el) => el.remove());
      createdScripts.forEach((el) => el.remove());
    };
  }, [
    config.title,
    config.description,
    config.canonicalUrl,
    config.ogImageUrl,
    config.ogType,
    config.siteName,
    JSON.stringify(config.hreflang ?? {}),
    JSON.stringify(config.schemas ?? []),
  ]);
}
