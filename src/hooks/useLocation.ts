// src/hooks/useLocation.ts
// Auto-detect user location from browser + IP fallback.
// Caches result in localStorage for 24h to avoid re-fetching.
//
// Returns:
//   location: { country, currency, timezone, city } | null
//   loading: boolean
//   error: string | null
//   refresh: () => void

import { useEffect, useState, useCallback } from "react";

export interface UserLocation {
  country: string;       // ISO 3166-1 alpha-2 (e.g. "JP")
  currency: string;      // ISO 4217 (e.g. "JPY")
  timezone: string;      // IANA (e.g. "Asia/Tokyo")
  city?: string;         // Best-effort city name
  source: "browser" | "ip" | "cache" | "default";
}

const CACHE_KEY = "tdp_user_location_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// Country → currency map (most common)
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  JP: "JPY", US: "USD", GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR",
  NL: "EUR", BE: "EUR", AT: "EUR", PT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR",
  CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK",
  CN: "CNY", HK: "HKD", SG: "SGD", KR: "KRW", IN: "INR", TH: "THB", ID: "IDR",
  MY: "MYR", PH: "PHP", VN: "VND", BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP",
  ZA: "ZAR", EG: "EGP", NG: "NGN", KE: "KES", RU: "RUB", TR: "TRY", SA: "SAR",
  AE: "AED", IL: "ILS", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", UA: "UAH",
};

// City map for the most common countries (best-effort label)
const COUNTRY_TO_CITY: Record<string, string> = {
  JP: "Tokyo", US: "New York", GB: "London", DE: "Berlin", FR: "Paris",
  IT: "Rome", ES: "Madrid", CA: "Toronto", AU: "Sydney", CN: "Shanghai",
  KR: "Seoul", IN: "Mumbai", BR: "São Paulo", MX: "Mexico City", RU: "Moscow",
  TR: "Istanbul", AE: "Dubai", SG: "Singapore", HK: "Hong Kong", TH: "Bangkok",
};

function fromBrowser(): UserLocation | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    // Map common timezones to country (rough)
    const tzToCountry: Record<string, string> = {
      "Asia/Tokyo": "JP", "America/New_York": "US", "America/Los_Angeles": "US",
      "America/Chicago": "US", "Europe/London": "GB", "Europe/Berlin": "DE",
      "Europe/Paris": "FR", "Europe/Rome": "IT", "Europe/Madrid": "ES",
      "America/Toronto": "CA", "Australia/Sydney": "AU", "Asia/Shanghai": "CN",
      "Asia/Seoul": "KR", "Asia/Kolkata": "IN", "America/Sao_Paulo": "BR",
      "Europe/Istanbul": "TR", "Asia/Dubai": "AE", "Asia/Singapore": "SG",
      "Asia/Hong_Kong": "HK", "Asia/Bangkok": "TH", "Europe/Moscow": "RU",
    };
    const country = tzToCountry[tz] || tz.split("/")[0].toUpperCase();
    const currency = COUNTRY_TO_CURRENCY[country] || "USD";
    return { country, currency, timezone: tz, city: COUNTRY_TO_CITY[country], source: "browser" };
  } catch {
    return null;
  }
}

function fromCache(): UserLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return { ...value, source: "cache" };
  } catch {
    return null;
  }
}

function toCache(loc: UserLocation) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value: loc, ts: Date.now() }));
  } catch {}
}

async function fromIP(): Promise<UserLocation | null> {
  try {
    // Free IP geolocation (no key, CORS-friendly, 1k req/day)
    const r = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = await r.json();
    const country = j.country_code || j.country || "US";
    const currency = j.currency || COUNTRY_TO_CURRENCY[country] || "USD";
    return {
      country,
      currency,
      timezone: j.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      city: j.city,
      source: "ip",
    };
  } catch {
    return null;
  }
}

const DEFAULT_LOCATION: UserLocation = {
  country: "US",
  currency: "USD",
  timezone: "America/New_York",
  city: "New York",
  source: "default",
};

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Try cache first
    const cached = fromCache();
    if (cached) {
      setLocation(cached);
      setLoading(false);
      return;
    }

    // 2. Try browser detection (instant)
    const browser = fromBrowser();
    if (browser) {
      setLocation(browser);
      toCache(browser);
      setLoading(false);
      // Optionally refine with IP in the background
      fromIP().then((ip) => {
        if (ip && ip.country !== browser.country) {
          setLocation(ip);
          toCache(ip);
        }
      });
      return;
    }

    // 3. Try IP geolocation
    const ip = await fromIP();
    if (ip) {
      setLocation(ip);
      toCache(ip);
      setLoading(false);
      return;
    }

    // 4. Fall back to default
    setError("Could not detect location — using default");
    setLocation(DEFAULT_LOCATION);
    setLoading(false);
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  return { location, loading, error, refresh: detect };
}
