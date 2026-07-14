// src/components/alerts/RateAlertForm.tsx
// Inline rate-alert subscription form for the /today mini-widget.

import { useState, useEffect, useRef } from "react";
import { LiveDot } from "../common/LiveDot";
import "./RateAlertForm.css";

interface RateAlertFormProps {
  from: string;
  to: string;
  currentRate?: number;
  fromName?: string;
  toName?: string;
  fromFlag?: string;
  toFlag?: string;
  apiBase?: string;
}

const EMAIL_KEY = "tdp_alert_email";
const API_BASE_DEFAULT = typeof window !== "undefined"
  ? "https://datetime-api-dev.nsura2029.workers.dev"
  : "";

type Status = "idle" | "submitting" | "success" | "error";

export function RateAlertForm({
  from, to, currentRate, fromName, toName, fromFlag, toFlag,
  apiBase = API_BASE_DEFAULT,
}: RateAlertFormProps) {
  const [email, setEmail] = useState("");
  const [threshold, setThreshold] = useState<number | "">("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [direction, setDirection] = useState<"below" | "above">("below");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (currentRate && currentRate > 0) {
      const defaultThreshold = direction === "below"
        ? +(currentRate * 0.95).toFixed(currentRate < 10 ? 4 : 2)
        : +(currentRate * 1.05).toFixed(currentRate < 10 ? 4 : 2);
      setThreshold(defaultThreshold);
    }
  }, [from, to, currentRate, direction]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const isValidThreshold = typeof threshold === "number" && threshold > 0;
  const canSubmit = isValidEmail && isValidThreshold && status !== "submitting";

  async function submit() {
    if (!canSubmit) return;
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(`${apiBase}/api/v1/alerts/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          from,
          to,
          direction,
          threshold,
          locale: typeof navigator !== "undefined" ? navigator.language : null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message || "✓ You're subscribed. Check your inbox for a confirmation.");
        try { localStorage.setItem(EMAIL_KEY, email.toLowerCase()); } catch {}
      } else {
        setStatus("error");
        setMessage(data.error?.message || "Something went wrong. Please try again.");
      }
    } catch (e) {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  }

  function handleEmailBlur() {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (isValidEmail) {
        try { localStorage.setItem(EMAIL_KEY, email.toLowerCase()); } catch {}
      }
    }, 500);
  }

  return (
    <div className={`tdp-alert-form ${status === "success" ? "is-success" : ""} ${status === "error" ? "is-error" : ""}`}>
      <div className="tdp-alert-form-head">
        <div className="tdp-alert-form-title">
          <span className="tdp-alert-form-bell">🔔</span>
          <span>Get notified when your rate moves</span>
        </div>
        <span className="tdp-alert-form-live"><LiveDot size="sm" /> Live</span>
      </div>

      <div className="tdp-alert-form-pair">
        <span className="tdp-alert-pair-chip">
          <span>{fromFlag || "🏳️"}</span>
          <strong>{from}</strong>
        </span>
        <span className="tdp-alert-pair-arrow">→</span>
        <span className="tdp-alert-pair-chip">
          <span>{toFlag || "🏳️"}</span>
          <strong>{to}</strong>
        </span>
        {currentRate != null && (
          <span className="tdp-alert-pair-rate">
            1 {from} = <strong>{currentRate.toFixed(currentRate < 10 ? 4 : 2)}</strong> {to}
          </span>
        )}
      </div>

      <div className="tdp-alert-form-row">
        <span className="tdp-alert-form-label">Alert me when 1 {from} goes</span>
        <div className="tdp-alert-form-toggle">
          <button
            type="button"
            className={direction === "below" ? "active" : ""}
            onClick={() => setDirection("below")}
            disabled={status === "submitting"}
          >
            ↓ below
          </button>
          <button
            type="button"
            className={direction === "above" ? "active" : ""}
            onClick={() => setDirection("above")}
            disabled={status === "submitting"}
          >
            ↑ above
          </button>
        </div>
        <div className="tdp-alert-form-threshold">
          <input
            type="number"
            step={currentRate && currentRate < 10 ? 0.0001 : 0.01}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value === "" ? "" : parseFloat(e.target.value))}
            disabled={status === "submitting"}
            placeholder="0.00"
          />
          <span className="tdp-alert-form-threshold-suffix">{to}</span>
        </div>
      </div>

      <div className="tdp-alert-form-row">
        <div className="tdp-alert-form-email">
          <span className="tdp-alert-form-email-icon">📧</span>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
            onBlur={handleEmailBlur}
            placeholder="you@email.com"
            disabled={status === "submitting"}
            autoComplete="email"
          />
        </div>
        <button
          type="button"
          className="tdp-alert-form-submit"
          onClick={submit}
          disabled={!canSubmit}
        >
          {status === "submitting" ? "..." : status === "success" ? "✓ Subscribed" : "Subscribe"}
        </button>
      </div>

      {message && (
        <div className={`tdp-alert-form-message ${status}`}>
          {message}
        </div>
      )}

      {status !== "success" && (
        <div className="tdp-alert-form-foot">
          <span>✓ 1 email per crossing</span>
          <span>·</span>
          <span>✗ No spam</span>
          <span>·</span>
          <span>1-click unsubscribe</span>
        </div>
      )}
    </div>
  );
}
