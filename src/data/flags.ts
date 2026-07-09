// src/data/flags.ts
// ISO 3166-1 alpha-2 country code → emoji flag.
// Covers every country that appears in CITIES. Emoji flags use the
// Regional Indicator Symbol Letter pair convention.

export const FLAG_BY_COUNTRY_CODE: Record<string, string> = {
  US: "\uD83C\uDDFA\uD83C\uDDF8", // 🇺🇸
  CA: "\uD83C\uDDE8\uD83C\uDDE6", // 🇨🇦
  MX: "\uD83C\uDDF2\uD83C\uDDFD", // 🇲🇽
  BR: "\uD83C\uDDE7\uD83C\uDDF7", // 🇧🇷
  AR: "\uD83C\uDDE6\uD83C\uDDF7", // 🇦🇷
  CL: "\uD83C\uDDE8\uD83C\uDDF1", // 🇨🇱
  CO: "\uD83C\uDDE8\uD83C\uDDF4", // 🇨🇴
  PE: "\uD83C\uDDF5\uD83C\uDDEA", // 🇵🇪
  VE: "\uD83C\uDDFB\uD83C\uDDEA", // 🇻🇪
  UY: "\uD83C\uDDFA\uD83C\uDDFE", // 🇺🇾

  GB: "\uD83C\uDDEC\uD83C\uDDE7", // 🇬🇧
  IE: "\uD83C\uDDEE\uD83C\uDDEA", // 🇮🇪 (alias for clarity)
  FR: "\uD83C\uDDEB\uD83C\uDDF7", // 🇫🇷
  DE: "\uD83C\uDDE9\uD83C\uDDEA", // 🇩🇪
  ES: "\uD83C\uDDEA\uD83C\uDDF8", // 🇪🇸
  PT: "\uD83C\uDDF5\uD83C\uDDF9", // 🇵🇹
  IT: "\uD83C\uDDEE\uD83C\uDDF9", // 🇮🇹
  NL: "\uD83C\uDDF3\uD83C\uDDF1", // 🇳🇱
  BE: "\uD83C\uDDE7\uD83C\uDDEA", // 🇧🇪
  AT: "\uD83C\uDDE6\uD83C\uDDED", // 🇦🇹
  CH: "\uD83C\uDDE8\uD83C\uDDED", // 🇨🇭
  LU: "\uD83C\uDDF1\uD83C\uDDFA", // 🇱🇺
  SE: "\uD83C\uDDF8\uD83C\uDDEA", // 🇸🇪
  NO: "\uD83C\uDDF3\uD83C\uDDF4", // 🇳🇴
  DK: "\uD83C\uDDE9\uD83C\uDDF0", // 🇩🇰
  FI: "\uD83C\uDDEB\uD83C\uDDEE", // 🇫🇮
  IS: "\uD83C\uDDEE\uD83C\uDDF8", // 🇮🇸
  PL: "\uD83C\uDDF5\uD83C\uDDF1", // 🇵🇱
  CZ: "\uD83C\uDDE8\uD83C\uDDFF", // 🇨🇿
  SK: "\uD83C\uDDF8\uD83C\uDDF0", // 🇸🇰
  HU: "\uD83C\uDDED\uD83C\uDDFA", // 🇭🇺
  RO: "\uD83C\uDDF7\uD83C\uDDF4", // 🇷🇴
  BG: "\uD83C\uDDE7\uD83C\uDDEC", // 🇧🇬
  GR: "\uD83C\uDDEC\uD83C\uDDF7", // 🇬🇷

  RU: "\uD83C\uDDF7\uD83C\uDDFA", // 🇷🇺
  UA: "\uD83C\uDDFA\uD83C\uDDE6", // 🇺🇦
  TR: "\uD83C\uDDF9\uD83C\uDDF7", // 🇹🇷

  AE: "\uD83C\uDDE6\uD83C\uDDEA", // 🇦🇪
  SA: "\uD83C\uDDF8\uD83C\uDDF4", // 🇸🇦
  IL: "\uD83C\uDDEE\uD83C\uDDF1", // 🇮🇱
  QA: "\uD83C\uDDF6\uD83C\uDDE6", // 🇶🇦
  KW: "\uD83C\uDDF0\uD83C\uDDFC", // 🇰🇼
  BH: "\uD83C\uDDE7\uD83C\uDDED", // 🇧🇭
  OM: "\uD83C\uDDF4\uD83C\uDDF2", // 🇴🇲
  JO: "\uD83C\uDDEF\uD83C\uDDF4", // 🇯🇴
  EG: "\uD83C\uDDEA\uD83C\uDDEC", // 🇪🇬
  ZA: "\uD83C\uDDFF\uD83C\uDDE6", // 🇿🇦
  NG: "\uD83C\uDDF3\uD83C\uDDEC", // 🇳🇬
  KE: "\uD83C\uDDF0\uD83C\uDDEA", // 🇰🇪
  MA: "\uD83C\uDDF2\uD83C\uDDE6", // 🇲🇦
  ET: "\uD83C\uDDEA\uD83C\uDDF9", // 🇪🇹
  GH: "\uD83C\uDDEC\uD83C\uDDED", // 🇬🇭
  TZ: "\uD83C\uDDF9\uD83C\uDDFF", // 🇹🇿

  IN: "\uD83C\uDDEE\uD83C\uDDF3", // 🇮🇳
  PK: "\uD83C\uDDF5\uD83C\uDDF0", // 🇵🇰
  BD: "\uD83C\uDDE7\uD83C\uDDE9", // 🇧🇩
  LK: "\uD83C\uDDF1\uD83C\uDDF0", // 🇱🇰
  NP: "\uD83C\uDDF3\uD83C\uDDF5", // 🇳🇵

  SG: "\uD83C\uDDF8\uD83C\uDDEC", // 🇸🇬
  TH: "\uD83C\uDDF9\uD83C\uDDED", // 🇹🇭
  VN: "\uD83C\uDDFB\uD83C\uDDF3", // 🇻🇳
  PH: "\uD83C\uDDF5\uD83C\uDDED", // 🇵🇭
  ID: "\uD83C\uDDEE\uD83C\uDDE9", // 🇮🇩
  MY: "\uD83C\uDDF2\uD83C\uDDFE", // 🇲🇾
  KH: "\uD83C\uDDF0\uD83C\uDDED", // 🇰🇭
  MM: "\uD83C\uDDF2\uD83C\uDDF2", // 🇲🇲

  JP: "\uD83C\uDDEF\uD83C\uDDF5", // 🇯🇵
  CN: "\uD83C\uDDE8\uD83C\uDDF3", // 🇨🇳
  HK: "\uD83C\uDDED\uD83C\uDDF0", // 🇭🇰
  TW: "\uD83C\uDDF9\uD83C\uDDF2", // 🇹🇼
  KR: "\uD83C\uDDF0\uD83C\uDDF7", // 🇰🇷
  MN: "\uD83C\uDDF2\uD83C\uDDF3", // 🇲🇳
  MO: "\uD83C\uDDF2\uD83C\uDDF4", // 🇲🇴

  AU: "\uD83C\uDDE6\uD83C\uDDFA", // 🇦🇺
  NZ: "\uD83C\uDDF3\uD83C\uDDFF", // 🇳🇿
  FJ: "\uD83C\uDDEB\uD83C\uDDEF", // 🇫🇯
};

export function flagFor(countryCode: string): string {
  return FLAG_BY_COUNTRY_CODE[countryCode] || "\uD83C\uDF10"; // fallback globe emoji
}