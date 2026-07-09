// src/admin/seed.ts
// First-boot defaults. Reads ADMIN_USER / ADMIN_PASS from env, and if no
// admin user exists, writes a default. If ADMIN_PASS is missing it generates
// a random one and writes it to .admin-credentials (so the operator can copy
// it once, then rotate).

import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

const CRED_FILE = path.join(process.cwd(), ".admin-credentials");

function generatePassword(): string {
  // 16 chars, base64url-safe, no ambiguous chars
  return crypto.randomBytes(12).toString("base64url").replace(/[Il0]/g, "x").slice(0, 18);
}

export function ensureAdminSeed(): { username: string; generated: boolean; passwordFile?: string } {
  const existing = db
    .prepare("SELECT id, username FROM users LIMIT 1")
    .get() as { id: number; username: string } | undefined;
  if (existing) {
    return { username: existing.username, generated: false };
  }

  const username = process.env.ADMIN_USER || "admin";
  let password = process.env.ADMIN_PASS;
  let generated = false;
  if (!password) {
    password = generatePassword();
    generated = true;
  }
  const passHash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (username, pass_hash, role, created_at) VALUES (?, ?, 'admin', ?)"
  ).run(username, passHash, Date.now());

  if (generated) {
    const banner = `# TimeAndDatePro Admin\n# Generated credentials on ${new Date().toISOString()}\n# username: ${username}\n# password: ${password}\n# delete this file after first login + rotate\nADMIN_USER=${username}\nADMIN_PASS=${password}\n`;
    fs.writeFileSync(CRED_FILE, banner, { mode: 0o600 });
  }

  return { username, generated, passwordFile: generated ? CRED_FILE : undefined };
}

/** Test-only: clear all data */
export function _devReset(): void {
  db.exec(`
    DELETE FROM api_requests;
    DELETE FROM api_triggers;
    DELETE FROM cache_invalidation;
    DELETE FROM admin_audit;
    DELETE FROM users;
  `);
}
