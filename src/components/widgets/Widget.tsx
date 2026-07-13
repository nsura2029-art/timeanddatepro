// src/components/widgets/Widget.tsx
// Reusable widget container for the Today page. All widgets share this
// shell so the page stays consistent and adding a new widget is trivial.
//
// Usage:
//   <Widget title="Currency near you" icon="💱" live href="/currency">
//     <CurrencyWidget />
//   </Widget>

import React from "react";
import { LiveDot } from "../common/LiveDot";
import "./Widget.css";

export interface WidgetProps {
  title: string;
  icon?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  live?: boolean;
  loading?: boolean;
  error?: string | null;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Widget({
  title,
  icon,
  href,
  hrefLabel = "Open",
  live,
  loading,
  error,
  badge,
  children,
  className,
  size = "md",
}: WidgetProps) {
  return (
    <div className={`tdp-widget tdp-widget--${size} ${className || ""}`}>
      <div className="tdp-widget__head">
        <div className="tdp-widget__title">
          {icon && <span className="tdp-widget__icon">{icon}</span>}
          {live && <LiveDot size="sm" />}
          <span>{title}</span>
          {badge && <span className="tdp-widget__badge">{badge}</span>}
        </div>
        {href && (
          <button
            type="button"
            onClick={() => {
              window.history.pushState(null, "", href);
              window.dispatchEvent(new Event("tdp:navigate"));
            }}
            className="tdp-widget__link"
          >
            {hrefLabel} →
          </button>
        )}
      </div>
      <div className="tdp-widget__body">
        {loading ? (
          <WidgetSkeleton />
        ) : error ? (
          <WidgetError error={error} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="tdp-widget__skeleton">
      <div className="tdp-skel-line" style={{ width: "60%" }} />
      <div className="tdp-skel-line" style={{ width: "80%" }} />
      <div className="tdp-skel-line" style={{ width: "40%" }} />
    </div>
  );
}

function WidgetError({ error }: { error: string }) {
  return (
    <div className="tdp-widget__error">
      <span className="tdp-widget__error-icon">⚠️</span>
      <span className="tdp-widget__error-text">{error}</span>
    </div>
  );
}
