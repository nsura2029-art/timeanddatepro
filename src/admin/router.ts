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
import { TRIGGERS, findTrigger, triggersGrouped } from "./triggers";
import { enqueueTrigger, getJob, listJobs, subscribe } from "./worker";

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

  // ── CDN edge cache purge (Cloudflare Pages) ──────────────────────
  // Purges the entire CDN edge cache for the timeanddatepro Pages
  // project. Uses the account-level Pages API (not the zone-level
  // cache API), so the existing account-scoped CLOUDFLARE_API_TOKEN
  // works without needing zone resources.
  //
  // On failure, returns the Cloudflare dashboard URL in `data.dashboardUrl`
  // so the admin UI can show a one-click fallback button.
  authed.post("/cdn/purge", async (req, res) => {
    const user = (req as AuthedRequest).user!;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!token || !accountId) {
      res.status(503).json({
        success: false,
        error: { message: "CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID not configured" },
      });
      return;
    }
    const dashboardUrl = `https://dash.cloudflare.com/${accountId}/pages/view/timeanddatepro`;
    try {
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/timeanddatepro/purge_cache`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      const cfJson: any = await cfRes.json().catch(() => ({}));
      const ok = cfRes.ok && cfJson.success !== false;
      // Log the purge action for the audit trail
      run(
        "INSERT INTO cache_invalidation (cache_key, triggered_by, reason, created_at) VALUES (?, ?, ?, ?)",
        [`cdn:timeanddatepro:${Date.now()}`, user.id, ok ? "manual admin CDN purge" : `CDN purge FAILED: ${cfJson.errors?.[0]?.message ?? cfRes.status}`, Date.now()]
      );
      if (ok) {
        res.json({ success: true, data: { purged: true, project: "timeanddatepro" } });
      } else {
        res.status(502).json({
          success: false,
          error: {
            message: cfJson.errors?.[0]?.message ?? `Cloudflare responded ${cfRes.status}`,
          },
          data: { dashboardUrl, fallback: true },
        });
      }
    } catch (e) {
      res.status(500).json({
        success: false,
        error: { message: (e as Error).message },
        data: { dashboardUrl, fallback: true },
      });
    }
  });

  // ── KV cache: list namespaces ────────────────────────────────
  // Lists all KV namespaces in the account. Used by the admin Cache
  // page to show which caches are available to purge.
  authed.get("/kv/namespaces", async (_req, res) => {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!token || !accountId) {
      res.status(503).json({ success: false, error: { message: "Cloudflare creds not configured" } });
      return;
    }
    try {
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces?per_page=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const j: any = await r.json();
      if (!j.success) {
        res.status(502).json({ success: false, error: { message: j.errors?.[0]?.message ?? "Failed" } });
        return;
      }
      res.json({
        success: true,
        data: {
          namespaces: (j.result || []).map((n: any) => ({ id: n.id, title: n.title })),
        },
      });
    } catch (e) {
      res.status(500).json({ success: false, error: { message: (e as Error).message } });
    }
  });

  // ── KV cache: purge all keys in a namespace ──────────────────
  // Lists all keys in the namespace, then deletes each one.
  // WARNING: destructive — wipes the entire namespace contents.
  // The admin UI should require explicit confirmation before calling.
  authed.post("/kv/purge", async (req, res) => {
    const user = (req as AuthedRequest).user!;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const { namespaceId, confirm } = (req.body || {}) as { namespaceId: string; confirm: boolean };
    if (!token || !accountId) {
      res.status(503).json({ success: false, error: { message: "Cloudflare creds not configured" } });
      return;
    }
    if (!namespaceId || !confirm) {
      res.status(400).json({
        success: false,
        error: { message: "namespaceId and confirm=true required (destructive op)" },
      });
      return;
    }
    try {
      // List all keys
      const listRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?per_page=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const listJson: any = await listRes.json();
      if (!listJson.success) {
        res.status(502).json({ success: false, error: { message: listJson.errors?.[0]?.message ?? "List failed" } });
        return;
      }
      const keys: string[] = (listJson.result || []).map((k: any) => k.name);
      // Delete each key (bulk endpoint accepts up to 10000 per call)
      let deleted = 0;
      for (const key of keys) {
        const delRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
        );
        if (delRes.ok) deleted++;
      }
      // Audit log
      run(
        "INSERT INTO cache_invalidation (cache_key, triggered_by, reason, created_at) VALUES (?, ?, ?, ?)",
        [`kv:${namespaceId}:${Date.now()}`, user.id, `KV namespace purge: ${deleted} keys deleted`, Date.now()]
      );
      res.json({ success: true, data: { namespaceId, totalKeys: keys.length, deleted } });
    } catch (e) {
      res.status(500).json({ success: false, error: { message: (e as Error).message } });
    }
  });

  // ── Triggers (Phase E) ────────────────────────────────────────────────
  authed.get("/triggers", (_req, res) => {
    res.json({ success: true, data: { grouped: triggersGrouped(), total: TRIGGERS.length } });
  });

  authed.post("/triggers/run", (req, res) => {
    const user = (req as AuthedRequest).user!;
    const { triggerName, params } = (req.body || {}) as { triggerName: string; params?: Record<string, string> };
    if (!triggerName) {
      res.status(400).json({ success: false, error: { message: "triggerName required" } });
      return;
    }
    const t = findTrigger(triggerName);
    if (!t) {
      res.status(404).json({ success: false, error: { message: `Unknown trigger: ${triggerName}` } });
      return;
    }
    // Validate params
    const errors: string[] = [];
    const cleanParams: Record<string, string> = {};
    for (const p of t.params) {
      const v = params?.[p.name];
      if (p.required && !v) errors.push(`Missing required param: ${p.name}`);
      cleanParams[p.name] = v || p.default || "";
    }
    if (errors.length > 0) {
      res.status(400).json({ success: false, error: { message: errors.join("; "), code: "E_VALIDATION" } });
      return;
    }
    const job = enqueueTrigger(triggerName, cleanParams, user.id);
    // Audit
    run(
      "INSERT INTO admin_audit (user_id, action, target, meta, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, "trigger.run", triggerName, JSON.stringify(cleanParams), (req.ip || "").toString(), Date.now()]
    );
    res.json({ success: true, data: job });
  });

  authed.get("/triggers/history", (_req, res) => {
    const rows = listJobs(50).map((r) => ({
      id: r.id,
      trigger_name: r.trigger_name,
      params: r.params ? JSON.parse(r.params) : {},
      status: r.status,
      created_at: r.created_at,
      started_at: r.started_at,
      finished_at: r.finished_at,
      output_meta: r.output_meta ? JSON.parse(r.output_meta) : null,
    }));
    res.json({ success: true, data: { jobs: rows } });
  });

  // SSE: streams live updates for either a specific task or all tasks.
  authed.get("/triggers/stream", (req, res) => {
    const user = (req as AuthedRequest).user!;
    const taskIdParam = (req.query.taskId ? parseInt(String(req.query.taskId)) : null) as number | null;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    // Send a hello
    res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, taskId: taskIdParam, user: user.username })}\n\n`);

    // If we have a taskId and that task is already done, replay then close.
    if (taskIdParam) {
      const existing = getJob(taskIdParam);
      if (existing) {
        const out = existing.output_meta ? JSON.parse(existing.output_meta) : null;
        res.write(`event: status\ndata: ${JSON.stringify({
          taskId: existing.id,
          status: existing.status,
          created_at: existing.created_at,
          started_at: existing.started_at,
          finished_at: existing.finished_at,
          output: out,
        })}\n\n`);
        if (existing.status === "ok" || existing.status === "failed") {
          res.write(`event: done\ndata: ${JSON.stringify({ taskId: existing.id })}\n\n`);
          res.end();
          return;
        }
      }
    }

    const unsubscribe = subscribe((ev) => {
      if (taskIdParam && ev.taskId !== taskIdParam) return;
      const eventName = ev.status === "ok" || ev.status === "failed" ? "status" : "status";
      res.write(`event: ${eventName}\ndata: ${JSON.stringify(ev)}\n\n`);
      if ((ev.status === "ok" || ev.status === "failed") && (!taskIdParam || ev.taskId === taskIdParam)) {
        res.write(`event: done\ndata: ${JSON.stringify({ taskId: ev.taskId })}\n\n`);
        if (taskIdParam) {
          unsubscribe();
          res.end();
        }
      }
    });

    // Keep-alive heartbeat every 15s
    const ka = setInterval(() => {
      try {
        res.write(`:heartbeat\n\n`);
      } catch {
        // ignore
      }
    }, 15_000);

    req.on("close", () => {
      clearInterval(ka);
      unsubscribe();
    });
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
