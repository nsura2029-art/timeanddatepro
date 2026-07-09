// src/components/admin/AdminLogin.tsx

import * as React from "react";
// One-purpose component. Bcrypt-verified credentials → JWT cookie session.

import { useState } from "react";
import { ShieldCheck, KeyRound, User as UserIcon, AlertCircle } from "lucide-react";

interface AdminLoginProps {
  onSuccess: (user: { id: number; username: string; role: string }) => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const j = await res.json();
      if (!j.success) {
        setError(j.error?.message || "Login failed");
        return;
      }
      onSuccess(j.data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <h1>
          <ShieldCheck size={18} className="text-[color:var(--adm-accent)]" />
          Admin sign in
        </h1>
        <p>TimeAndDatePro control room. Default user: <code style={{ background: "rgba(56,189,248,0.1)", color: "var(--adm-accent)", fontFamily: "var(--adm-font-mono)", padding: "1px 6px", borderRadius: 4 }}>admin</code></p>

        {error && (
          <div className="admin-error">
            <AlertCircle size={12} className="inline mr-1" /> {error}
          </div>
        )}

        <div className="admin-field">
          <label htmlFor="username">Username</label>
          <div style={{ position: "relative" }}>
            <UserIcon size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--adm-text-faint)" }} />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              style={{ paddingLeft: 32, width: "100%" }}
              required
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="password">Password</label>
          <div style={{ position: "relative" }}>
            <KeyRound size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--adm-text-faint)" }} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: 32, width: "100%" }}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="admin-button primary"
          disabled={submitting}
          style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--adm-border-soft)", fontSize: 11, color: "var(--adm-text-faint)" }}>
          <p style={{ margin: "0 0 4px" }}>
            First boot: if no <code style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-muted)" }}>ADMIN_PASS</code> env var is set, a random password is written to <code style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-muted)" }}>.admin-credentials</code>.
          </p>
          <p style={{ margin: 0 }}>
            Rotate by setting <code style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-muted)" }}>ADMIN_USER</code> / <code style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-muted)" }}>ADMIN_PASS</code> in <code style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-text-muted)" }}>.env</code>.
          </p>
        </div>
      </form>
    </div>
  );
}
