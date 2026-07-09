// src/data/currency/currencies.ts
// Curated ISO 4217 catalog with display metadata. 33 codes ship by default;
// the 32-mark base is the European Central Bank daily reference feed
// (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml, CC-BY 4.0,
// refreshed once a day ~16:00 CET). USD has an additional entry so we can
// use it as a base via cross-rate when needed.
//
// "flag" uses Twemoji-style emoji rendered as text so no image assets are
// required on first paint.

export interface CurrencyInfo {
  code: string;            // ISO 4217 (e.g. "USD")
  name: string;            // "US Dollar"
  symbol: string;          // "$"
  flag: string;            // emoji
  /** ~cents precision. e.g. JPY has 0 decimals, USD has 2. */
  decimals: number;
  /** ISO 3166-1 alpha-2 territories where this is the primary currency */
  primaryIn: string[];     // e.g. ["US", "EC", "SV"] for USD
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar",                symbol: "$",   flag: "🇺🇸", decimals: 2, primaryIn: ["US", "EC", "SV", "ZW"] },
  { code: "EUR", name: "Euro",                     symbol: "€",   flag: "🇪🇺", decimals: 2, primaryIn: ["FR", "DE", "ES", "IT", "NL", "BE", "AT", "PT", "FI", "IE", "GR"] },
  { code: "GBP", name: "British Pound",            symbol: "£",   flag: "🇬🇧", decimals: 2, primaryIn: ["GB"] },
  { code: "JPY", name: "Japanese Yen",             symbol: "¥",   flag: "🇯🇵", decimals: 0, primaryIn: ["JP"] },
  { code: "CHF", name: "Swiss Franc",              symbol: "Fr",  flag: "🇨🇭", decimals: 2, primaryIn: ["CH", "LI"] },
  { code: "AUD", name: "Australian Dollar",        symbol: "A$",  flag: "🇦🇺", decimals: 2, primaryIn: ["AU", "KI", "TV", "NR"] },
  { code: "CAD", name: "Canadian Dollar",          symbol: "C$",  flag: "🇨🇦", decimals: 2, primaryIn: ["CA"] },
  { code: "CNY", name: "Chinese Yuan",             symbol: "¥",   flag: "🇨🇳", decimals: 2, primaryIn: ["CN"] },
  { code: "HKD", name: "Hong Kong Dollar",         symbol: "HK$", flag: "🇭🇰", decimals: 2, primaryIn: ["HK"] },
  { code: "SGD", name: "Singapore Dollar",         symbol: "S$",  flag: "🇸🇬", decimals: 2, primaryIn: ["SG"] },
  { code: "NZD", name: "New Zealand Dollar",       symbol: "NZ$", flag: "🇳🇿", decimals: 2, primaryIn: ["NZ", "CK", "NU"] },
  { code: "INR", name: "Indian Rupee",             symbol: "₹",   flag: "🇮🇳", decimals: 2, primaryIn: ["IN"] },
  { code: "KRW", name: "South Korean Won",         symbol: "₩",   flag: "🇰🇷", decimals: 0, primaryIn: ["KR"] },
  { code: "MXN", name: "Mexican Peso",             symbol: "Mex$",flag: "🇲🇽", decimals: 2, primaryIn: ["MX"] },
  { code: "BRL", name: "Brazilian Real",           symbol: "R$",  flag: "🇧🇷", decimals: 2, primaryIn: ["BR"] },
  { code: "ARS", name: "Argentine Peso",           symbol: "$",   flag: "🇦🇷", decimals: 2, primaryIn: ["AR"] },
  { code: "ZAR", name: "South African Rand",       symbol: "R",   flag: "🇿🇦", decimals: 2, primaryIn: ["ZA"] },
  { code: "TRY", name: "Turkish Lira",             symbol: "₺",   flag: "🇹🇷", decimals: 2, primaryIn: ["TR"] },
  { code: "SEK", name: "Swedish Krona",            symbol: "kr",  flag: "🇸🇪", decimals: 2, primaryIn: ["SE"] },
  { code: "NOK", name: "Norwegian Krone",          symbol: "kr",  flag: "🇳🇴", decimals: 2, primaryIn: ["NO"] },
  { code: "DKK", name: "Danish Krone",             symbol: "kr",  flag: "🇩🇰", decimals: 2, primaryIn: ["DK", "FO", "GL"] },
  { code: "PLN", name: "Polish Zloty",             symbol: "zł",  flag: "🇵🇱", decimals: 2, primaryIn: ["PL"] },
  { code: "CZK", name: "Czech Koruna",             symbol: "Kč",  flag: "🇨🇿", decimals: 2, primaryIn: ["CZ"] },
  { code: "HUF", name: "Hungarian Forint",         symbol: "Ft",  flag: "🇭🇺", decimals: 2, primaryIn: ["HU"] },
  { code: "RON", name: "Romanian Leu",             symbol: "lei", flag: "🇷🇴", decimals: 2, primaryIn: ["RO"] },
  { code: "BGN", name: "Bulgarian Lev",            symbol: "лв",  flag: "🇧🇬", decimals: 2, primaryIn: ["BG"] },
  { code: "ISK", name: "Icelandic Krona",          symbol: "kr",  flag: "🇮🇸", decimals: 0, primaryIn: ["IS"] },
  { code: "ILS", name: "Israeli New Shekel",       symbol: "₪",   flag: "🇮🇱", decimals: 2, primaryIn: ["IL"] },
  { code: "THB", name: "Thai Baht",                symbol: "฿",   flag: "🇹🇭", decimals: 2, primaryIn: ["TH"] },
  { code: "IDR", name: "Indonesian Rupiah",        symbol: "Rp",  flag: "🇮🇩", decimals: 2, primaryIn: ["ID"] },
  { code: "MYR", name: "Malaysian Ringgit",        symbol: "RM",  flag: "🇲🇾", decimals: 2, primaryIn: ["MY"] },
  { code: "PHP", name: "Philippine Peso",          symbol: "₱",   flag: "🇵🇭", decimals: 2, primaryIn: ["PH"] },
  { code: "EGP", name: "Egyptian Pound",           symbol: "£E",  flag: "🇪🇬", decimals: 2, primaryIn: ["EG"] },
];

const CURRENCY_BY_CODE: Record<string, CurrencyInfo> = (() => {
  const out: Record<string, CurrencyInfo> = {};
  for (const c of CURRENCIES) out[c.code] = c;
  return out;
})();

export function getCurrency(code: string): CurrencyInfo | undefined {
  return CURRENCY_BY_CODE[code.toUpperCase()];
}

export function isSupported(code: string): boolean {
  return !!CURRENCY_BY_CODE[code.toUpperCase()];
}

export function listCodes(): string[] {
  return CURRENCIES.map((c) => c.code);
}
