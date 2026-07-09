// src/admin/worker.ts
// Simple serial queue for admin trigger jobs. Polls api_triggers every
// 500ms; processes one row at a time. Emits progress events to an in-memory
// subscriber list so the SSE endpoint can stream live status.

import { db } from "./db";
import { findTrigger } from "./triggers";

interface JobEvent {
  taskId: number;
  status: "queued" | "running" | "ok" | "failed";
  output?: unknown;
  message?: string;
  created_at?: number;
  started_at?: number;
  finished_at?: number;
}

type Listener = (ev: JobEvent) => void;
const listeners: Set<Listener> = new Set();
let tickInterval: ReturnType<typeof setInterval> | null = null;

export function subscribe(f: Listener): () => void {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}

function emit(ev: JobEvent): void {
  for (const l of listeners) {
    try {
      l(ev);
    } catch {
      // ignore listener errors
    }
  }
}

interface TriggerRow {
  id: number;
  trigger_name: string;
  params: string | null;
  requested_by: number | null;
  status: string;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  output_meta: string | null;
}

async function processOne(): Promise<boolean> {
  // Find the oldest queued job
  const row = db
    .prepare(
      `SELECT id, trigger_name, params, requested_by, status, created_at, started_at, finished_at, output_meta
       FROM api_triggers WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`
    )
    .get() as unknown as TriggerRow | undefined;

  if (!row) return false;

  const t = findTrigger(row.trigger_name);
  if (!t) {
    db.prepare(
      `UPDATE api_triggers SET status = 'failed', finished_at = ?, output_meta = ? WHERE id = ?`
    ).run(Date.now(), JSON.stringify({ message: `Unknown trigger: ${row.trigger_name}` }), row.id);
    emit({ taskId: row.id, status: "failed", message: `Unknown trigger: ${row.trigger_name}`, finished_at: Date.now() });
    return true;
  }

  // Mark running
  db.prepare(`UPDATE api_triggers SET status = 'running', started_at = ? WHERE id = ?`).run(
    Date.now(),
    row.id
  );
  emit({ taskId: row.id, status: "running", started_at: Date.now() });

  try {
    const args = row.params ? JSON.parse(row.params) : {};
    const result = await t.run(args);
    const out = JSON.stringify(result);
    db.prepare(
      `UPDATE api_triggers SET status = 'ok', finished_at = ?, output_meta = ? WHERE id = ?`
    ).run(Date.now(), out, row.id);
    emit({ taskId: row.id, status: "ok", output: result, finished_at: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    db.prepare(
      `UPDATE api_triggers SET status = 'failed', finished_at = ?, output_meta = ? WHERE id = ?`
    ).run(Date.now(), JSON.stringify({ message }), row.id);
    emit({ taskId: row.id, status: "failed", message, finished_at: Date.now() });
  }
  return true;
}

export function startWorker(intervalMs = 500): void {
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    processOne().catch((e) => {
      // eslint-disable-next-line no-console
      console.warn("[admin/worker] process error:", e?.message);
    });
  }, intervalMs);
  // eslint-disable-next-line no-console
  console.log(`[admin/worker] started, polling every ${intervalMs}ms`);
}

export function stopWorker(): void {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

/** Enqueue a new trigger job. */
export function enqueueTrigger(
  name: string,
  params: Record<string, string>,
  requestedBy: number
): { id: number; trigger_name: string; created_at: number } {
  const now = Date.now();
  const result = db
    .prepare(
      `INSERT INTO api_triggers (trigger_name, params, requested_by, status, created_at)
       VALUES (?, ?, ?, 'queued', ?)`
    )
    .run(name, JSON.stringify(params), requestedBy, now);
  const id = result.lastInsertRowid as number;
  emit({ taskId: id, status: "queued", created_at: now });
  return { id, trigger_name: name, created_at: now };
}

/** Get a single job row (for re-hydrating the SSE stream). */
export function getJob(id: number): TriggerRow | undefined {
  return db
    .prepare(
      `SELECT id, trigger_name, params, requested_by, status, created_at, started_at, finished_at, output_meta
       FROM api_triggers WHERE id = ?`
    )
    .get(id) as unknown as TriggerRow | undefined;
}

/** Get recent jobs (for the history list in the UI). */
export function listJobs(limit = 50): TriggerRow[] {
  return db
    .prepare(
      `SELECT id, trigger_name, params, requested_by, status, created_at, started_at, finished_at, output_meta
       FROM api_triggers ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as unknown as TriggerRow[];
}