// src/components/tools/shared/ToolTopbar.tsx
// Solid-white topbar used by all tool pages. Matches the hero's navigation
// style: pill-shaped nav links, brand mark with the "T" inside a black
// rounded square, sign-in button in the primary emerald color.

import React from "react";

/**
 * SPA navigation helper — same pattern App.tsx uses. Pushes the new
 * path onto the history stack and dispatches `tdp:navigate` so the
 * App's `parseRouteFromPath` picks it up.
 */
function navigateTo(href: string, event: React.MouseEvent) {
  event.preventDefault();
  window.history.pushState(null, "", href);
  window.dispatchEvent(new Event("tdp:navigate"));
}

interface NavItem {
  label: string;
  href: string;
  /** Highlight as the active route */
  isActive?: boolean;
}

interface Props {
  /** Active tool name, e.g. "Date to Words" — highlighted in the nav */
  activeToolName?: string;
  /** Brand link href, defaults to "/" */
  homeHref?: string;
}

const DEFAULT_NAV: NavItem[] = [
  { label: "Tools", href: "/tools" },
  { label: "API", href: "/api-docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export const ToolTopbar: React.FC<Props> = ({
  activeToolName,
  homeHref = "/",
}) => {
  return (
    <div className="topbar">
      <nav className="nav">
        <a href={homeHref} className="nav-brand" onClick={(e) => navigateTo(homeHref, e)}>
          <span className="nav-mark" />
          <span>TimeAndDatePro</span>
        </a>
        <div className="nav-links">
          {DEFAULT_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link${item.label === activeToolName ? " active" : ""}`}
              onClick={(e) => navigateTo(item.href, e)}
            >
              {item.label}
            </a>
          ))}
          {activeToolName ? (
            <a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>
              {activeToolName}
            </a>
          ) : null}
          <button type="button" className="tdp-btn tdp-btn--primary tdp-btn--sm">
            Sign in
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ToolTopbar;
