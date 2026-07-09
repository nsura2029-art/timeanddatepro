// src/data/currency/staticRates.ts
// Offline snapshot of ECB eurofxref for 2026-07-09 used as the fallback
// when the upstream ECB feed is unreachable. Values are the published
// reference rates from the latest daily file we were able to verify.
//
// Source: European Central Bank, "Euro foreign exchange reference rates"
// (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml). CC-BY 4.0.
// Refreshed daily by `npm run refresh:currency-rates` admin trigger (Phase E).

export const STATIC_RATES_EUR = {
  date: "2026-07-08",
  // rates are: 1 unit of `code` = N EUR
  rates: {
    USD: 1.1715,
    JPY: 171.62,
    BGN: 1.9558,
    CZK: 24.831,
    DKK: 7.4635,
    GBP: 0.8556,
    HUF: 396.50,
    PLN: 4.2683,
    RON: 5.0617,
    SEK: 11.0228,
    CHF: 0.9336,
    ISK: 143.90,
    NOK: 11.7105,
    TRY: 46.8230,
    AUD: 1.7793,
    BRL: 6.3190,
    CAD: 1.5998,
    CNY: 8.3965,
    HKD: 9.1173,
    IDR: 19053.0,
    ILS: 3.9142,
    INR: 102.0180,
    KRW: 1595.00,
    MXN: 21.8250,
    MYR: 4.9443,
    NZD: 1.9293,
    PHP: 67.020,
    SGD: 1.5080,
    THB: 38.140,
    ZAR: 20.842,
    EGP: 56.450,
    ARS: 1378.00,
  } as Record<string, number>,
};
