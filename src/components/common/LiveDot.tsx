// src/components/common/LiveDot.tsx
// Unified live indicator. Single source of truth for "this data is live".
// Three sizes: sm (6px), md (8px), lg (10px).
//
// Usage:
//   <LiveDot />
//   <LiveDot size="sm" />
//   <LiveDot size="lg" pulse={false} />

import React from "react";
import "./LiveDot.css";

export interface LiveDotProps {
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

export function LiveDot({ size = "md", pulse = true, className }: LiveDotProps) {
  return (
    <span
      className={`tdp-live-dot tdp-live-dot--${size} ${pulse ? "tdp-live-dot--pulse" : ""} ${className || ""}`}
      aria-label="Live"
      role="status"
    />
  );
}
