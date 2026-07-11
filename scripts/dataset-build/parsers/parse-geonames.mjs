#!/usr/bin/env node
// parsers/parse-geonames.mjs
// Extracts cities5000.zip → cities5000.json (JSON array of normalized city records).
//
// GeoNames cities5000.zip is a tab-separated values file with no header.
// Columns (0-indexed):
//   0  geonameid
//   1  name
//   2  asciiname
//   3  alternatenames (comma-separated)
//   4  latitude
//   5  longitude
//   6  feature_class
//   7  feature_code          (PPLC = capital, PPLA = admin capital, PPL = city, ...)
//   8  country_code          (ISO 3166-1 alpha-2)
//   9  cc2                   (alternate country codes, comma-separated)
//   10 admin1_code          (state/region)
//   11 admin2_code          (county/district)
//   12 admin3_code
//   13 admin4_code
//   14 population
//   15 elevation
//   16 dem                   (digital elevation model)
//   17 timezone             (IANA timezone)
//   18 modification_date

import { promises as fs } from "node:fs";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const [, , inputZip, outputJson] = process.argv;

if (!inputZip || !outputJson) {
  console.error("Usage: node parse-geonames.mjs <cities5000.zip> <cities5000.json>");
  process.exit(1);
}

const COUNTRY_NAMES = await loadCountryNames();
const TMP_TSV = resolve(dirname(inputZip), "cities5000.txt");

console.log("  → unzipping…");
// unzip the file using the system `unzip` tool (available on Linux/Mac/WSL)
await new Promise((resolveProm, reject) => {
  const child = spawn("unzip", ["-o", "-d", dirname(TMP_TSV), inputZip], { stdio: "inherit" });
  child.on("close", (code) => (code === 0 ? resolveProm() : reject(new Error("unzip failed"))));
});

const cities = [];
let lineNum = 0;
const rl = createInterface({
  input: createReadStream(TMP_TSV, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  lineNum++;
  if (lineNum === 1 && line.startsWith("geonameid")) continue; // skip header if present

  const cols = line.split("\t");
  if (cols.length < 19) continue;

  const [
    _id,
    name,
    asciiName,
    _alt,
    lat,
    lng,
    _class,
    featureCode,
    countryCode,
    _cc2,
    admin1,
    _admin2,
    _admin3,
    _admin4,
    population,
    elevation,
    _dem,
    timezone,
  ] = cols;

  const pop = parseInt(population, 10) || 0;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) continue;

  cities.push({
    geonameId: parseInt(cols[0], 10),
    name: name.trim(),
    asciiName: (asciiName || name).trim(),
    countryCode: countryCode.trim(),
    countryName: COUNTRY_NAMES[countryCode.trim()] ?? countryCode.trim(),
    admin1: admin1?.trim() || null,
    admin2: cols[11]?.trim() || null,
    latitude: latNum,
    longitude: lngNum,
    timezone: timezone?.trim() || "UTC",
    population: pop,
    elevation: elevation ? parseInt(elevation, 10) : null,
    featureCode: featureCode?.trim() || "PPL",
    isCapital: featureCode?.trim() === "PPLC",
  });

  if (lineNum % 5000 === 0) {
    process.stdout.write(`    ${lineNum} rows parsed, ${cities.length} valid\r`);
  }
}

console.log(`\n  ✓ ${cities.length} cities parsed from ${lineNum} rows`);
await fs.writeFile(outputJson, JSON.stringify(cities, null, 0)); // no indentation, smaller file
console.log(`  → wrote ${(JSON.stringify(cities).length / 1024 / 1024).toFixed(1)} MB to ${outputJson}`);

// Clean up
await fs.unlink(TMP_TSV).catch(() => {});

// ──────────────────────────────────────────────────────────────────────
// Country name lookup (from restcountries, cached for 30 days)
// ──────────────────────────────────────────────────────────────────────
async function loadCountryNames() {
  const cacheFile = resolve(__dirname, "..", ".cache", "mledoze-countries.json");
  try {
    const raw = await fs.readFile(cacheFile, "utf8");
    const data = JSON.parse(raw);
    const map = {};
    for (const c of data) {
      if (c.cca2) map[c.cca2] = c.name?.common ?? c.cca2;
    }
    return map;
  } catch {
    return {}; // empty fallback — we just use the country code as name
  }
}
