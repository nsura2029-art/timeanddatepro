// src/routes/feedback.ts
// Feedback router: community feedback + tool suggestions (T6 backend).
// V1 stub. The full port (B7) will use D1 for storage + upvote ranking.

import { Hono } from "hono";
import { ok, err } from "../lib/responses";

const feedback = new Hono();

/** GET /api/v1/feedback — list all feedback (paginated). */
feedback.get("/", (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10) || 20, 100);
  const offset = Math.max(parseInt(c.req.query("offset") ?? "0", 10) || 0, 0);
  return ok(c, { count: 0, total: 0, limit, offset, feedback: [], note: "V1 stub. B7 will use D1." });
});

/** GET /api/v1/feedback/top — top-voted feedback. */
feedback.get("/top", (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "10", 10) || 10, 50);
  return ok(c, { count: 0, limit, feedback: [], note: "V1 stub." });
});

/** GET /api/v1/feedback/:id — get one feedback. */
feedback.get("/:id", (c) => {
  const id = c.req.param("id");
  return err(c, 404, `Feedback not found: ${id}`, "not_found");
});

/** POST /api/v1/feedback — submit new feedback. */
feedback.post("/", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return err(c, 400, "Invalid JSON body", "invalid_body");
  }
  if (!body || typeof body.text !== "string" || body.text.trim().length === 0) {
    return err(c, 400, "text field is required and must be a non-empty string", "missing_text");
  }
  if (body.text.length > 5000) {
    return err(c, 400, "text must be 5000 characters or less", "text_too_long");
  }
  return ok(c, { id: "stub-" + Date.now(), text: body.text, votes: 0, created: new Date().toISOString(), note: "V1 stub." });
});

/** POST /api/v1/feedback/:id/vote — upvote/downvote. */
feedback.post("/:id/vote", async (c) => {
  const id = c.req.param("id");
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const direction = body?.direction ?? "up";
  if (direction !== "up" && direction !== "down") {
    return err(c, 400, "direction must be 'up' or 'down'", "invalid_direction");
  }
  return err(c, 404, `Feedback not found: ${id}`, "not_found");
});

/** DELETE /api/v1/feedback/:id — delete feedback. */
feedback.delete("/:id", (c) => {
  return err(c, 501, "DELETE not implemented in V1", "not_implemented");
});

export { feedback as feedbackRouter };
