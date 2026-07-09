// src/admin/router.ts
// All /api/admin/* + the static-ish /admin/auth-strip /admin/login JSON routes.
// Mount point: app.use("/api/admin", adminRouter);

import { Router } from "express";
import path from "path";
import fs from "fs";
import { db, all, get, run } from "./db";
import {
  adminCookieParser,
  loadSession,
  verifyPassword,
  signSession,
  type AuthedRequest,
  requireAdmin,
} from "./auth";
import { ensureAdminSeed } from "./seed";
import { dashboardSummary } from "./requestLog";
import { ADMIN_CATEGORIES, categoryOf, ENDPOINT_CATEGORY } from "./categories";
import { ENDPOINT_CATALOG, type EndpointDoc } from "../data/docs/endpointCatalog";

export function buildAdminRouter(): Router {
  const r = Router();

  // ── Public: status without auth (so the link in nav can render & show banner)
  r.get("/bootstrap", (req, res) => {
    const user = (req as AuthedRequest).user ?? null;
    const seeded = ensureAdminSeed();
    res.json({
      success: true,
      data: {
        adminPath: "/admin",
        loginPath: "/admin/login",
        username: user?.username ?? null,
        role: user?.role ?? null,
        authRequired: false, // admin route visible to all, but API is protected
        categories: ADMIN_CATEGORIES,
        seeded: seeded.generated ? "generated" : "configured",
        docsUrl: "/docs/api-reference",
      },
    });
  });

  // ── Login / logout (public on the auth flow itself)
  r.post("/login", async (req, res) => {
    const { username, password } = (req.body || {}) as { username?: string; password?: string };
    if (!username || !password) {
      res.status(400).json({ success: false, error: { message: "username and password required", code: "E_VALIDATION" } });
      return;
    }
    const user = get<{ id: number; username: string; pass_hash: string; role: "admin" | "viewer" }>(
      "SELECT id, username, pass_hash, role FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    if (!user) {
      res.status(401).json({ success: false, error: { message: "Invalid credentials", code: "E_AUTH" } });
      return;
    }
    const ok = await verifyPassword(password, user.pass_hash);
    if (!ok) {
      res.status(401).json({ success: false, error: { message: "Invalid credentials", code: "E_AUTH" } });
      return;
    }
    run("UPDATE users SET last_login = ? WHERE id = ?", [Date.now(), user.id]);
    const session = { id: user.id, username: user.username, role: user.role };
    const token = signSession(session);
    (res as any).__setSession(session);
    res.json({ success: true, data: { user: session, token, bootstrap: `/admin` } });
  });

  r.post("/logout", (req, res) => {
    (res as any).__clearSession();
    res.json({ success: true, data: { ok: true } });
  });

  r.get("/me", (req, res) => {
    const user = (req as AuthedRequest).user ?? null;
    res.json({ success: true, data: { user } });
  });

  // ── Authenticated routes (requireAdmin)
  const authed = Router({ mergeParams: false });
  authed.use(requireAdmin);

  authed.get("/dashboard", (_req, res) => {
    res.json({ success: true, data: dashboardSummary() });
  });

  authed.get("/api-status", (req, res) => {
    const { endpoint, category, status, since, limit = 200 } = req.query as Record<string, string>;
    const params: unknown[] = [];
    const where: string[] = [];
    if (endpoint) {
      where.push("endpoint = ?");
      params.push(endpoint);
    }
    if (category) {
      where.push("category = ?");
      params.push(category);
    }
    if (status === "errors") {
      where.push("status >= 400");
    } else if (status) {
      const n = parseInt(status);
      if (!Number.isNaN(n)) {
        where.push("status = ?");
        params.push(n);
      }
    }
    const sinceN = since ? parseInt(since) : Date.now() - 60 * 60 * 1000;
    where.push("created_at >= ?");
    params.push(sinceN);
    const sql = `SELECT id, method, path, endpoint, category, status, latency_ms, user_agent, ip,
                        request_meta, response_meta, cached, source, created_at
                 FROM api_requests WHERE ${where.join(" AND ")}
                 ORDER BY created_at DESC LIMIT ?`;
    params.push(Math.max(1, Math.min(parseInt(String(limit) || '200') || 200, 1000)));
    const rows = all(sql, params);
    res.json({ success: true, data: { rows, since: sinceN } });
  });

  authed.get("/categories", (_req, res) => {
    const categories = ADMIN_CATEGORIES;
    const counts = all<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count FROM api_requests
       WHERE created_at >= ? GROUP BY category`,
      [Date.now() - 60 * 60 * 1000]
    );
    res.json({ success: true, data: { categories, counts } });
  });

  authed.get("/endpoints", (_req, res) => {
    // Build the endpoint list grouped by category for the sidebar
    const catalog: EndpointDoc[] = [...ENDPOINT_CATALOG];
    const grouped: Record<string, { endpoint: string; method: string; apiPath: string; summary: string }[]> = {};
    for (const c of catalog) {
      const cat = categoryOf(c.slug) || "data-source";
      grouped[cat] ??= [];
      grouped[cat].push({
        endpoint: c.slug,
        method: c.method,
        apiPath: c.apiPath,
        summary: c.summary,
      });
    }
    res.json({ success: true, data: { grouped, total: catalog.length } });
  });

  authed.post("/cache/invalidate", (req, res) => {
    const user = (req as AuthedRequest).user!;
    const { cacheKey, reason } = (req.body || {}) as { cacheKey: string; reason?: string };
    if (!cacheKey) {
      res.status(400).json({ success: false, error: { message: "cacheKey required" } });
      return;
    }
    run(
      "INSERT INTO cache_invalidation (cache_key, triggered_by, reason, created_at) VALUES (?, ?, ?, ?)",
      [cacheKey, user.id, reason ?? null, Date.now()]
    );
    res.json({ success: true, data: { cacheKey, invalidated: true } });
  });

  // All authed routes mounted under /api/admin/authed
  r.use("/authed", authed);

  return r;
}

/** Mount the admin SPA — serves the React app with proper non-API routes.
 *  The SPA route is /admin, /admin/dashboard, /admin/api-status, /admin/cache.
 *  In dev, vite middleware will rewrite these to index.html before they
 *  reach this; in prod, we serve dist/index.html with a fallback here. */
export function mountAdminSPA(app: any, distPath: string) {
  if (!fs.existsSync(distPath)) return;
  const indexHtml = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
  app.get("/admin", (_req: any, res: any) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(indexHtml);
  });
  app.get("/admin/*", (_req: any, res: any) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(indexHtml);
  });
}
