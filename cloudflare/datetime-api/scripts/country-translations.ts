// ============================================================
// Country name translations for locale-aware search
// ============================================================
// Fetches from mledoze/countries (open restcountries.com dataset)
// Falls back to hardcoded common translations if fetch fails.
// ============================================================

const LOCALES = ["fr-FR", "de-DE", "es-ES", "ja-JP", "zh-CN", "ar-SA", "pt-BR", "ru-RU"];

export async function fetchCountryNames(): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};
  for (const locale of LOCALES) result[locale] = {};

  // Try mledoze first (full translations object)
  try {
    console.log("  Fetching mledoze/countries (full dataset)...");
    const response = await fetch(
      "https://raw.githubusercontent.com/mledoze/countries/master/countries.json",
      { signal: AbortSignal.timeout(30_000) },
    );
    if (response.ok) {
      const data = (await response.json()) as Array<{
        cca2: string;
        name: { common: string; official: string };
        translations?: Record<string, { common: string; official: string }>;
      }>;
      for (const c of data) {
        if (!c.translations) continue;
        for (const locale of LOCALES) {
          const langCode = locale.split("-")[0];  // fr-FR → fr
          const t = c.translations[langCode];
          if (t?.common) {
            result[locale][c.cca2] = t.common;
          }
        }
      }
      const filled = Object.values(result).filter((r) => Object.keys(r).length > 0).length;
      console.log(`  Loaded translations for ${filled}/${LOCALES.length} locales (${data.length} countries)`);
      return result;
    }
  } catch (e) {
    console.log(`  mledoze fetch failed: ${(e as Error).message}`);
  }

  // Fallback to hardcoded common translations
  console.log("  Using fallback translations");
  const fallback: Record<string, Record<string, string>> = {
    "fr-FR": {
      US: "États-Unis", GB: "Royaume-Uni", FR: "France", DE: "Allemagne",
      IT: "Italie", ES: "Espagne", PT: "Portugal", NL: "Pays-Bas",
      BE: "Belgique", CH: "Suisse", AT: "Autriche", SE: "Suède",
      NO: "Norvège", DK: "Danemark", FI: "Finlande", IS: "Islande",
      IE: "Irlande", PL: "Pologne", CZ: "Tchéquie", SK: "Slovaquie",
      HU: "Hongrie", RO: "Roumanie", BG: "Bulgarie", GR: "Grèce",
      TR: "Turquie", RU: "Russie", UA: "Ukraine", CN: "Chine",
      JP: "Japon", KR: "Corée du Sud", KP: "Corée du Nord", TW: "Taïwan",
      IN: "Inde", PK: "Pakistan", BD: "Bangladesh", TH: "Thaïlande",
      VN: "Vietnam", ID: "Indonésie", PH: "Philippines", MY: "Malaisie",
      SG: "Singapour", EG: "Égypte", ZA: "Afrique du Sud", NG: "Nigeria",
      KE: "Kenya", AR: "Argentine", BR: "Brésil", CL: "Chili",
      CO: "Colombie", PE: "Pérou", MX: "Mexique", CA: "Canada",
      AU: "Australie", NZ: "Nouvelle-Zélande", IL: "Israël", SA: "Arabie saoudite",
      AE: "Émirats arabes unis",
    },
    "de-DE": {
      US: "Vereinigte Staaten", GB: "Vereinigtes Königreich", FR: "Frankreich",
      DE: "Deutschland", IT: "Italien", ES: "Spanien", PT: "Portugal",
      NL: "Niederlande", BE: "Belgien", CH: "Schweiz", AT: "Österreich",
      SE: "Schweden", NO: "Norwegen", DK: "Dänemark", FI: "Finnland",
      IS: "Island", IE: "Irland", PL: "Polen", CZ: "Tschechien",
      SK: "Slowakei", HU: "Ungarn", RO: "Rumänien", BG: "Bulgarien",
      GR: "Griechenland", TR: "Türkei", RU: "Russland", UA: "Ukraine",
      CN: "China", JP: "Japan", KR: "Südkorea", KP: "Nordkorea",
      TW: "Taiwan", IN: "Indien", PK: "Pakistan", BD: "Bangladesch",
      TH: "Thailand", VN: "Vietnam", ID: "Indonesien", PH: "Philippinen",
      MY: "Malaysia", SG: "Singapur", EG: "Ägypten", ZA: "Südafrika",
      NG: "Nigeria", KE: "Kenia", AR: "Argentinien", BR: "Brasilien",
      CL: "Chile", CO: "Kolumbien", PE: "Peru", MX: "Mexiko",
      CA: "Kanada", AU: "Australien", NZ: "Neuseeland", IL: "Israel",
      SA: "Saudi-Arabien", AE: "Vereinigte Arabische Emirate",
    },
    "es-ES": {
      US: "Estados Unidos", GB: "Reino Unido", FR: "Francia", DE: "Alemania",
      IT: "Italia", ES: "España", PT: "Portugal", NL: "Países Bajos",
      BE: "Bélgica", CH: "Suiza", AT: "Austria", SE: "Suecia",
      NO: "Noruega", DK: "Dinamarca", FI: "Finlandia", IS: "Islandia",
      IE: "Irlanda", PL: "Polonia", CZ: "Chequia", SK: "Eslovaquia",
      HU: "Hungría", RO: "Rumanía", BG: "Bulgaria", GR: "Grecia",
      TR: "Turquía", RU: "Rusia", UA: "Ucrania", CN: "China",
      JP: "Japón", KR: "Corea del Sur", KP: "Corea del Norte", TW: "Taiwán",
      IN: "India", PK: "Pakistán", BD: "Bangladés", TH: "Tailandia",
      VN: "Vietnam", ID: "Indonesia", PH: "Filipinas", MY: "Malasia",
      SG: "Singapur", EG: "Egipto", ZA: "Sudáfrica", NG: "Nigeria",
      KE: "Kenia", AR: "Argentina", BR: "Brasil", CL: "Chile",
      CO: "Colombia", PE: "Perú", MX: "México", CA: "Canadá",
      AU: "Australia", NZ: "Nueva Zelanda", IL: "Israel", SA: "Arabia Saudí",
      AE: "Emiratos Árabes Unidos",
    },
  };
  return fallback;
}
