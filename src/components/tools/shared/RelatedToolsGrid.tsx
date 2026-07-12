// src/components/tools/shared/RelatedToolsGrid.tsx
// Pastel NotebookLM-style "related tools" grid. Extracted from the hero's
// HeroExploreLinks so every tool page reuses the exact same component.
// Each card gets one of four pastel variants (lavender/mint/amber/sky) on
// a 12-card rotation so the rainbow is visible at a glance.

import React from "react";

export type PastelVariant = "lavender" | "mint" | "amber" | "sky";

export interface RelatedTool {
  /** Display label, e.g. "Word to Date" */
  label: string;
  /** URL or route, e.g. "/word-to-date" */
  href: string;
  /** Emoji or short string used in the white-glass icon overlay */
  icon: string;
  /** Optional description shown on hover (tooltip-like) */
  description?: string;
  /** Override the auto-assigned variant */
  variant?: PastelVariant;
}

interface Props {
  /** Tool list, max 12 typically */
  tools: RelatedTool[];
  /** Eyebrow text, defaults to "Related tools" */
  eyebrow?: string;
  /** Meta text, defaults to "X more" */
  meta?: string;
}

const VARIANT_ROTATION: PastelVariant[] = ["lavender", "mint", "amber", "sky"];

function autoVariant(index: number): PastelVariant {
  return VARIANT_ROTATION[index % VARIANT_ROTATION.length];
}

export const RelatedToolsGrid: React.FC<Props> = ({
  tools,
  eyebrow = "Related tools",
  meta,
}) => {
  return (
    <section
      className="tdp-hero-explore-links"
      aria-label="Related tools"
    >
      <header className="tdp-hero-explore-links-header">
        <h3 className="tdp-hero-explore-links-eyebrow">{eyebrow}</h3>
        <span className="tdp-hero-explore-links-meta">
          {meta ?? `${tools.length} more`}
        </span>
      </header>
      <ul className="tdp-hero-explore-links-grid">
        {tools.map((tool, index) => {
          const variant = tool.variant ?? autoVariant(index);
          return (
            <li key={tool.href} className="tdp-hero-explore-links-item">
              <a
                href={tool.href}
                className={`tdp-hero-explore-links-link tdp-hero-explore-links-link--${variant}`}
                title={tool.description}
              >
                <span className="tdp-hero-explore-links-icon" aria-hidden>
                  {tool.icon}
                </span>
                <span className="tdp-hero-explore-links-text">{tool.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default RelatedToolsGrid;
