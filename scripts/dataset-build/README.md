# Global Dataset Build Script

Generates the canonical timezone/country/city dataset for TimeAndDatePro from
public, license-clean sources. Output: TypeScript files (ship in the React
bundle for instant search) + D1 SQL seed (serves the API endpoints).

## Targets (per locked spec)

| Layer | Count | Source |
|---|---:|---|
| Continents | 7 | UN M49 macro-regions |
| UN subregions | 22 | UN M49 |
| Countries & territories | 249 | restcountries.com (v3.1) |
| Canonical IANA timezones | 312 | system zone1970.tab (the attachment) |
| Aliases (non-canonical) | 287 | IANA tz database backward-compat |
| UTC offsets | 38 | computed from canonical set |
| Major cities | ~5,000 | GeoNames cities5000.zip (filter) |
| Currencies | ~180 | ISO 4217 (via restcountries) |
| Phone codes | 249 | ITU-T E.164 (via restcountries) |
| Languages | ~180 | ISO 639-1 (via restcountries) |
| Public holidays | ~100 countries | Nager.Date API |

## Usage

```bash
cd scripts/dataset-build
node build.mjs                    # full build (~5 min, downloads 150MB)
node build.mjs --skip-download    # use cached sources (~30s)
node build.mjs --cities-only      # rebuild just the cities
```

## Outputs

| File | Goes to |
|---|---|
| `output/regions.ts` | `src/data/regions.ts` (bundled) |
| `output/countries.ts` | `src/data/countries.ts` (bundled + D1 mirror) |
| `output/timezones.ts` | `src/data/timezones.ts` (bundled + D1 mirror) |
| `output/cities.ts` | `src/data/cities.ts` (bundled — top 1,000 featured) |
| `output/cities-full.json` | D1 seed (full ~5,000) |
| `output/seed.sql` | D1 migrations |
| `output/stats.json` | build summary (counts, source URLs) |

## Data sources (all public, all license-clean)

- **restcountries.com** v3.1 — https://restcountries.com/v3.1/all
- **GeoNames** cities5000.zip — https://download.geonames.org/export/dump/cities5000.zip (CC-BY 4.0)
- **Nager.Date** API — https://date.nager.at/api/v3/PublicHolidays/{year}/{cc}
- **IANA tz database** (the user-supplied attachment) — 312 canonical zones
- **UN M49** — https://unstats.un.org/unsd/methodology/m49/overview/ (public)
- **ISO 4217 / 639-1** — derived from restcountries (already in v3.1 response)
- **ITU phone codes** — derived from restcountries `idd.root` + `idd.suffixes`
