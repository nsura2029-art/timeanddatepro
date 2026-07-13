// src/middleware/rateLimit.ts
// Per-IP rate limiting for the Currency API. KV-backed sliding window.
//
// Defaults: 100 requests per 60 seconds per IP for unauthenticated.
// Override per-route via the `rateLimit()` helper.
//
// Storage: KV key `rl:{ip}:{windowBucket}` with TTL = window seconds.
// Window = current minute (so the bucket naturally rolls over).
// On overflow, return 429 with Retry-After header pointing to next minute.

import type { MiddlewareHandler } from "hono";
import type { KVNamespace } from "@cloudflare/workers-types";
import { err } from "../lib/responses";

type Bindings = { CACHE: KVNamespace };

export interface RateLimitOptions {
  /** Max requests per window. Default: 100 */
  limit?: number;
  /** Window size in seconds. Default: 60 */
  windowSec?: number;
  /** Identifier extractor. Default: uses CF-Connecting-IP. */
  keyBy?: (c: any) => string;
}

export function rateLimit(opts: RateLimitOptions = {}): MiddlewareHandler<{ Bindings: Bindings }> {
  const limit = opts.limit ?? 100;
  const windowSec = opts.windowSec ?? 60;
  const keyBy = opts.keyBy ?? ((c) => c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown");

  return async (c, next) => {
    // Debug: log binding state
    console.log(`[rateLimit] path=${c.req.path} CACHE=${c.env.CACHE ? "bound" : "undefined"}`);
    // Skip if no KV bound (local dev)
    if (!c.env.CACHE) {
      return next();
    }
    const ip = keyBy(c);
    if (!ip || ip === "unknown") {
      return next(); // Skip if we can't identify the IP
    }
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / windowSec);
    const key = `rl:${ip}:${bucket}`;

    // Atomic increment (KV is eventually consistent, but for rate limiting
    // a small overcount is acceptable — we never grant more than limit)
    const current = await c.env.CACHE.get(key).then((v) => parseInt(v || "0", 10));

    if (current >= limit) {
      const retryAfter = (bucket + 1) * windowSec - now;
      c.header("Retry-After", String(retryAfter));
      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String((bucket + 1) * windowSec));
      return err(c, 429, `rate_limit_exceeded: ${limit} requests per ${windowSec}s`, "rate_limit");
    }

    // Set count atomically — use put with metadata
    await c.env.CACHE.put(key, String(current + 1), { expirationTtl: windowSec * 2 });

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, limit - current - 1)));
    c.header("X-RateLimit-Reset", String((bucket + 1) * windowSec));
    return next();
  };
}

/** Default rate limiter: 100 req/min/IP, applied to the whole API. */
export const defaultRateLimit = rateLimit({ limit: 100, windowSec: 60 });

/** Stricter limiter for bulk + crypto endpoints (more expensive). */
export const strictRateLimit = rateLimit({ limit: 30, windowSec: 60 });
