// cloudflare/datetime-api-cron/src/index.ts
// Scheduled rate-alert checker (Phase 7).
// Triggered by a cron schedule (every 15 min) — reads active rate_alerts
// from D1, checks current rates via open.er-api.com, sends an email via
// Resend when a threshold is crossed, then updates the row.

import { Resend } from "resend";

interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  ALERT_FROM_EMAIL: string;
  ALERT_BASE_URL: string;
  CRON_SECRET?: string;
}

interface RateAlertRow {
  id: string;
  email: string;
  from_code: string;
  to_code: string;
  direction: "above" | "below";
  threshold: number;
  reference_rate: number | null;
  active: number;
  last_rate: number | null;
  last_checked: number | null;
  last_triggered: number | null;
  trigger_count: number;
  unsubscribe_token: string;
  created_at: number;
}

const COOLDOWN_SECONDS = 6 * 60 * 60;
const BATCH_SIZE = 50;

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(run(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/run") {
      const secret = url.searchParams.get("secret");
      if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
        return new Response("Forbidden", { status: 403 });
      }
      const result = await run(env);
      return Response.json(result);
    }
    return new Response("datetime-api-cron. Use POST /run to trigger manually.", { status: 200 });
  },
};

async function run(env: Env): Promise<{
  checked: number;
  triggered: number;
  emailed: number;
  errors: number;
  duration_ms: number;
}> {
  const start = Date.now();
  const now = Math.floor(Date.now() / 1000);
  const nowIso = new Date().toISOString();

  const alertsResult = await env.DB.prepare(
    `SELECT * FROM rate_alerts
     WHERE active = 1
     ORDER BY last_checked ASC NULLS FIRST
     LIMIT ?`
  ).bind(BATCH_SIZE).all<RateAlertRow>();

  const alerts = alertsResult.results ?? [];
  console.log(`[cron ${nowIso}] Checking ${alerts.length} active alerts`);

  const byPair = new Map<string, RateAlertRow[]>();
  for (const a of alerts) {
    const key = `${a.from_code}-${a.to_code}`;
    if (!byPair.has(key)) byPair.set(key, []);
    byPair.get(key)!.push(a);
  }

  let checked = 0;
  let triggered = 0;
  let emailed = 0;
  let errors = 0;
  const resend = new Resend(env.RESEND_API_KEY);

  for (const [pair, pairAlerts] of byPair.entries()) {
    const [from, to] = pair.split("-");
    let rate: number | null = null;
    let rateSource = "open.er-api.com";

    try {
      const url = `https://open.er-api.com/v6/latest/${from}`;
      const res = await fetch(url, { cf: { cacheTtl: 300 } });
      if (res.ok) {
        const data: any = await res.json();
        if (data.result === "success" && data.rates?.[to]) {
          rate = data.rates[to];
        }
      }
    } catch (e) {
      console.error(`[cron] Upstream failed for ${pair}:`, e);
      errors++;
      continue;
    }

    if (rate == null) {
      console.warn(`[cron] No rate for ${pair}`);
      continue;
    }

    for (const alert of pairAlerts) {
      checked++;
      const lastRate = alert.last_rate;
      const crossed =
        alert.direction === "above"
          ? lastRate != null && lastRate < alert.threshold && rate >= alert.threshold
          : lastRate != null && lastRate > alert.threshold && rate <= alert.threshold;

      if (lastRate == null) {
        await env.DB.prepare(
          `UPDATE rate_alerts SET last_rate = ?, last_checked = ?, updated_at = ? WHERE id = ?`
        ).bind(rate, now, now, alert.id).run();
        continue;
      }

      const withinCooldown = alert.last_triggered != null && (now - alert.last_triggered) < COOLDOWN_SECONDS;
      if (crossed && !withinCooldown) {
        triggered++;
        const subject = `${alert.from_code}→${alert.to_code} ${alert.direction === "above" ? "↑ above" : "↓ below"} ${alert.threshold}`;
        const html = renderEmail(alert, rate, rateSource, env);
        try {
          const { error } = await resend.emails.send({
            from: env.ALERT_FROM_EMAIL,
            to: alert.email,
            subject,
            html,
          });
          if (error) {
            console.error(`[cron] Resend error for alert ${alert.id}:`, error);
            errors++;
          } else {
            emailed++;
            await env.DB.prepare(
              `UPDATE rate_alerts
               SET last_triggered = ?, trigger_count = trigger_count + 1, updated_at = ?
               WHERE id = ?`
            ).bind(now, now, alert.id).run();
          }
        } catch (e) {
          console.error(`[cron] Email send failed for ${alert.id}:`, e);
          errors++;
        }
      }

      await env.DB.prepare(
        `UPDATE rate_alerts SET last_rate = ?, last_checked = ?, updated_at = ? WHERE id = ?`
      ).bind(rate, now, now, alert.id).run();
    }
  }

  const duration = Date.now() - start;
  console.log(`[cron ${nowIso}] Done in ${duration}ms — checked=${checked} triggered=${triggered} emailed=${emailed} errors=${errors}`);
  return { checked, triggered, emailed, errors, duration_ms: duration };
}

function renderEmail(alert: RateAlertRow, currentRate: number, source: string, env: Env): string {
  const unsubUrl = `${env.ALERT_BASE_URL}/api/v1/alerts/unsubscribe?token=${alert.unsubscribe_token}`;
  const direction = alert.direction === "above" ? "↑ above" : "↓ below";
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0d111a;">
  <div style="background:linear-gradient(135deg,#ece1ff,#d6e9ff);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#7257d5;margin-bottom:8px;">RATE ALERT</div>
    <h1 style="font-size:24px;font-weight:700;margin:0 0 4px 0;letter-spacing:-0.02em;">${alert.from_code} → ${alert.to_code}</h1>
    <div style="font-size:14px;color:#4a5263;">crossed ${direction} your threshold</div>
  </div>
  <div style="background:#fafbfc;border:1px solid #e1e6ec;border-radius:12px;padding:20px;margin-bottom:24px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
      <span style="font-size:11px;color:#6e7686;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Threshold</span>
      <span style="font-size:20px;font-weight:700;color:#0d111a;font-family:'JetBrains Mono',monospace;">${alert.threshold} ${alert.to_code}</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
      <span style="font-size:11px;color:#6e7686;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Current rate</span>
      <span style="font-size:24px;font-weight:700;color:#7257d5;font-family:'JetBrains Mono',monospace;">${currentRate.toFixed(4)} ${alert.to_code}</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <span style="font-size:11px;color:#6e7686;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Source</span>
      <span style="font-size:12px;color:#4a5263;">${source}</span>
    </div>
  </div>
  <p style="font-size:14px;color:#4a5263;line-height:1.6;margin-bottom:24px;">
    Your rate alert is active. We'll only email you when 1 ${alert.from_code} crosses ${alert.threshold} ${alert.to_code} (${alert.direction} your threshold).
  </p>
  <div style="text-align:center;margin-bottom:24px;">
    <a href="https://develop.timeanddatepro.pages.dev/currency" style="display:inline-block;background:#7257d5;color:white;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;">Open dashboard →</a>
  </div>
  <div style="border-top:1px solid #e1e6ec;padding-top:16px;font-size:11px;color:#6e7686;text-align:center;">
    You're getting this because you subscribed at TimeAndDatePro.<br>
    <a href="${unsubUrl}" style="color:#7257d5;text-decoration:none;font-weight:500;">Unsubscribe</a> · Alert ID: ${alert.id.slice(0, 8)}
  </div>
</body></html>`;
}
