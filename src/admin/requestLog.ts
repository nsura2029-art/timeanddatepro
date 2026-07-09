// src/admin/requestLog.ts
// Middleware that logs every /api/v1/* hit to api_requests. Sampling rate
// configurable via ADMIN_LOG_SAMPLE (default: log every request; for a busy
// prod we might set 0.1 to log 10%).
//
// The intent: drive the admin "API Status" page (Phase D). Each row carries
// truncated request_meta + response_meta so an admin can quickly see what's
// happening.

import type { Request, Response, NextFunction } from "express";
import { db, all, run } from "./db";
import { categoryOf } from "./categories";
import { COOKIE } from "./auth";

const SAMPLE = Number(process.env.ADMIN_LOG_SAMPLE ?? 1);

function shouldLog(): boolean {
  if (SAMPLE >= 1) return true;
  return Math.random() < SAMPLE;
}

/** Heuristic to extract the endpoint slug (e.g. 'time/now') from the URL. */
function deriveEndpoint(path: string): { endpoint: string; params: Record<string, string> } {
  // /api/v1/<slug>
  // matches /api/v1/foo/bar → endpoint 'foo/bar'
  const m = path.match(/^\/api\/v1\/([^?]+)(?:\?|$)/);
  if (!m) return { endpoint: path, params: {} };
  return { endpoint: m[1], params: {} };
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith("/api/v1")) return next();
  if (!shouldLog()) return next();
  const t0 = Date.now();
  res.on("finish", () => {
    try {
      const { endpoint } = deriveEndpoint(req.path);
      const latency = Date.now() - t0;
      const cat = categoryOf(endpoint);
      run(
        `INSERT INTO api_requests
         (method, path, endpoint, category, status, latency_ms, user_agent, ip,
          request_meta, response_meta, cached, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public', ?)`,
        [
          req.method,
          req.path,
          endpoint,
          cat,
          res.statusCode,
          latency,
          (req.headers["user-agent"] || "").toString().slice(0, 200),
          (req.headers["x-forwarded-for"] || req.ip || "").toString().slice(0, 64),
          truncate(JSON.stringify(req.query || {}), 1024),
          truncate(res.statusCode >= 400 ? JSON.stringify((res as any).body || {}) : "", 1024),
          res.getHeader("cache-control") ? 1 : 0,
          Date.now(),
        ]
      );

      // Roll retention: keep last 7 days raw, prune older
      run("DELETE FROM api_requests WHERE created_at < ?", [Date.now() - 7 * 24 * 60 * 60 * 1000]);
    } catch (err) {
      // intentionally silent — logging should never break the API
      // eslint-disable-next-line no-console
      console.warn('[admin/requestLog] failed to persist log:', (err as Error)?.message);
    }
  });
  next();
};

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

/** Pull summary stats for the admin dashboard. */
export function dashboardSummary(): {
  since: number;
  total: number;
  p50_ms: number;
  p95_ms: number;
  errors: number;
  cache_hits: number;
  byCategory: { category: string; count: number }[];
  byEndpoint: { endpoint: string; count: number; p50_ms: number; errors: number }[];
} {
  const since = Date.now() - 60 * 60 * 1000; // last hour
  const total = (get(`SELECT COUNT(*) as c FROM api_requests WHERE created_at >= ?`, [since]) as { c: number } | undefined)?.c ?? 0;
  const errors =
    (get(`SELECT COUNT(*) as c FROM api_requests WHERE created_at >= ? AND status >= 400`, [since]) as { c: number } | undefined)?.c ?? 0;
  const cache_hits =
    (get(`SELECT COUNT(*) as c FROM api_requests WHERE created_at >= ? AND cached = 1`, [since]) as { c: number } | undefined)?.c ?? 0;
  const latencies = all<{ latency_ms: number }>(
    `SELECT latency_ms FROM api_requests WHERE created_at >= ? ORDER BY latency_ms ASC`,
    [since]
  );
  const p50 = percentile(latencies.map((x) => x.latency_ms), 0.5);
  const p95 = percentile(latencies.map((x) => x.latency_ms), 0.95);
  const byCategory = all<{ category: string; count: number }>(
    `SELECT COALESCE(category, 'other') as category, COUNT(*) as count
     FROM api_requests WHERE created_at >= ?
     GROUP BY category ORDER BY count DESC LIMIT 20`,
    [since]
  );
  const byEndpoint = all<{ endpoint: string; count: number; latency_ms: number; status: number }>(
    `SELECT endpoint, COUNT(*) as count, latency_ms, status
     FROM api_requests WHERE created_at >= ?
     GROUP BY endpoint ORDER BY count DESC LIMIT 20`,
    [since]
  ).map((r) => ({
    endpoint: r.endpoint,
    count: r.count,
    p50_ms: Number(((all<{ ms: number }>(
      `SELECT latency_ms as ms FROM api_requests WHERE created_at >= ? AND endpoint = ? ORDER BY latency_ms ASC`,
      [since, r.endpoint]
    ))[Math.floor((all<{ c: number }>(`SELECT COUNT(*) as c FROM api_requests WHERE created_at >= ? AND endpoint = ?`, [since, r.endpoint])[0] as any).c / 2)] ?? { ms: 0 }).ms),
    errors: 0,
  }));
  return {
    since,
    total,
    p50_ms: p50,
    p95_ms: p95,
    errors,
    cache_hits,
    byCategory,
    byEndpoint,
  };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const idx = Math.min(values.length - 1, Math.floor(values.length * p));
  return values[idx] ?? 0;
}

function get(sql: string, params: unknown[] = []): unknown {
  return db.prepare(sql).get(...(params as any));
}
