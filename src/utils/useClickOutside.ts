// src/utils/useClickOutside.ts
// Reusable hook for dropdown / popover / modal "click outside to close" behavior.
//
// Usage:
//   const ref = useRef<HTMLDivElement>(null);
//   useClickOutside(ref, () => setOpen(false));
//
// Also handles Escape key by default (set `closeOnEscape: false` to disable).

import React, { useEffect } from "react";

export interface UseClickOutsideOptions {
  /** Close when the Escape key is pressed. Default: true. */
  closeOnEscape?: boolean;
  /** Optional additional refs that should ALSO count as "inside" (for portals, etc.) */
  additionalRefs?: React.RefObject<HTMLElement | null>[];
  /** Skip the listener when this returns true (e.g. while another modal is open). */
  enabled?: boolean;
}

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutside: () => void,
  options: UseClickOutsideOptions = {}
) {
  const { closeOnEscape = true, additionalRefs, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      // Inside the main ref?
      if (ref.current && ref.current.contains(target)) return;
      // Inside any of the additional refs?
      if (additionalRefs) {
        for (const r of additionalRefs) {
          if (r.current && r.current.contains(target)) return;
        }
      }
      onOutside();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onOutside();
      }
    };

    // mousedown not click — fires before focus changes, so we close the
    // dropdown before the user sees a flash of "still open" state.
    document.addEventListener("mousedown", handleMouseDown, true);
    if (closeOnEscape) {
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      if (closeOnEscape) document.removeEventListener("keydown", handleKey);
    };
  }, [ref, onOutside, closeOnEscape, additionalRefs, enabled]);
}