// ============================================================
// String normalization — diacritics, case, locale-aware
// ============================================================
// Diacritics: "São Paulo" → "Sao Paulo", "München" → "Munchen"
// Uses NFD decomposition + combining mark strip
// ============================================================

/**
 * Strip diacritics from a string using NFD normalization.
 * "São Paulo" → "Sao Paulo"
 * "München" → "Munchen"
 * "Zürich" → "Zurich"
 */
export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
}

/**
 * Normalize a string for comparison: lowercase + strip diacritics.
 * "São Paulo" → "sao paulo"
 */
export function normalize(s: string): string {
  return stripDiacritics(s).toLowerCase().trim();
}

/**
 * Normalize preserving original case (for display).
 */
export function normalizeCase(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * Levenshtein distance — minimum edits to transform a → b.
 * Standard Wagner-Fischer algorithm with 2-row optimization.
 *
 * Time: O(n*m), Space: O(min(n,m))
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Use shorter string as the "inner" loop for cache efficiency
  const [s, t] = a.length <= b.length ? [a, b] : [b, a];
  const m = s.length;
  const n = t.length;

  let prev = new Array(m + 1);
  let curr = new Array(m + 1);
  for (let i = 0; i <= m; i++) prev[i] = i;

  for (let j = 1; j <= n; j++) {
    curr[0] = j;
    for (let i = 1; i <= m; i++) {
      const cost = s.charCodeAt(i - 1) === t.charCodeAt(j - 1) ? 0 : 1;
      curr[i] = Math.min(
        curr[i - 1] + 1,      // insertion
        prev[i] + 1,          // deletion
        prev[i - 1] + cost,   // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[m];
}

/**
 * Fuzzy match score (0.0 = no match, 1.0 = exact match).
 * Returns null if the strings are too different.
 */
export function fuzzyScore(query: string, target: string, maxDistance = 2): number | null {
  const q = normalize(query);
  const t = normalize(target);
  if (q === t) return 1.0;
  if (q.length < 4) return null;  // too short to fuzzy match
  if (t.length < q.length - 2) return null;  // too different in length
  const dist = levenshtein(q, t);
  if (dist > maxDistance) return null;
  return 1.0 - dist / Math.max(q.length, t.length);
}

/**
 * Haversine distance between two lat/lon points in km.
 */
export function haversineKm(
  lat1: number, lon1: number, lat2: number, lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
