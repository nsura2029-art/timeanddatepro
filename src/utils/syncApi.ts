// src/utils/syncApi.ts
// Server-side clock for client clock-sync.
// Returns the server's authoritative time + an ISO timestamp.
// The client compares this against its own `Date.now()` to compute drift.

export interface SyncResponse {
  /** Server time in milliseconds since epoch */
  serverTimeMs: number;
  /** Server time as ISO 8601 UTC string */
  isoTimestamp: string;
  /** Server time as unix seconds (for cross-check) */
  unixSeconds: number;
  /** Timezone of the server (usually UTC) */
  serverTz: string;
  /** Drift estimate in milliseconds — server - local (negative if local is ahead) */
  driftMs: number;
}

export function getSyncResponse(clientNowMs?: number): SyncResponse {
  const serverTimeMs = Date.now();
  const serverTz = process.env.TZ || "UTC";
  return {
    serverTimeMs,
    isoTimestamp: new Date(serverTimeMs).toISOString(),
    unixSeconds: Math.floor(serverTimeMs / 1000),
    serverTz,
    driftMs: clientNowMs !== undefined ? serverTimeMs - clientNowMs : 0,
  };
}