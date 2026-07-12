// src/middleware/cors.ts
// CORS middleware for the API. Allows the frontend + dashboard origins.
// Handles preflight (OPTIONS) requests.

import type { MiddlewareHandler } from "hono";

const ALLOWED_ORIGINS = [
  "https://dateandtime.live",
  "https://www.dateandtime.live",
  "https://dev.dateandtime.live",
  "https://api.dateandtime.live",
  "https://dev.api.dateandtime.live",
  "https://develop.timeanddatepro.pages.dev",
  "https://develop.timeanddatepro-dev.pages.dev",
  "https://develop.timeanddatepro.pages.dev",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
];

function isAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow any *.pages.dev subdomain
  if (origin.endsWith(".pages.dev")) return true;
  return false;
}

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const origin: string | null = c.req.header("origin") ?? null;
  const allow = isAllowed(origin);

  if (allow && origin) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Vary", "Origin");
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    c.header("Access-Control-Max-Age", "86400");
  }

  // Handle preflight
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: c.res.headers });
  }

  await next();
};
