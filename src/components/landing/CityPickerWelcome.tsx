// src/components/landing/CityPickerWelcome.tsx
// First-visit attention widget — a one-time popup that surfaces the
// city picker to users who might miss the small "Change city" button
// in the hero top-right.
//
// UX:
//   - Renders 2.5 seconds after mount (so the hero is visible first)
//   - Only on the user's first-ever visit (or after localStorage wipe)
//     — controlled by the `tdp_cities_welcomed_v1` flag in localStorage
//   - Shows 3 actions: "Yes, use this city" / "Pick another" / "Maybe later"
//   - Backdrop click and X button dismiss with the welcome flag set
//   - "Pick another" closes this widget AND opens the main city picker
//   - Animates in (fade + scale) for a polished first impression

import { useEffect, useState } from "react";
import { X, MapPin, Sparkles, Globe2 } from "lucide-react";
import type { TrackedCity } from "../../data/defaultCities";

const WELCOME_FLAG = "tdp_cities_welcomed_v1";
const SHOW_DELAY_MS = 2500;

interface CityPickerWelcomeProps {
  /** The active city to feature in the prompt (e.g. "Are you in {Wesley Chapel}?") */
  activeCity: TrackedCity;
  /** The default 5 cities to surface as quick-pick chips */
  defaultCities: TrackedCity[];
  /** Open the main picker (closes the welcome) */
  onOpenPicker: () => void;
  /** Called when the user confirms the active city ("Yes, use this") */
  onConfirmActive: () => void;
  /** Optional callback when the welcome is dismissed for any reason */
  onDismiss?: () => void;
}

function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

export function CityPickerWelcome({
  activeCity,
  defaultCities,
  onOpenPicker,
  onConfirmActive,
  onDismiss,
}: CityPickerWelcomeProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Schedule the welcome to appear after the hero has rendered
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip if the user has already seen the welcome
    try {
      if (localStorage.getItem(WELCOME_FLAG) === "1") return;
    } catch {
      // localStorage might be blocked — show the welcome anyway
    }
    setMounted(true);
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(WELCOME_FLAG, "1");
    } catch {
      // best effort
    }
    onDismiss?.();
  }

  function handleOpenPicker() {
    dismiss();
    onOpenPicker();
  }

  function handleConfirm() {
    onConfirmActive();
    dismiss();
  }

  if (!mounted || !open) return null;

  return (
    <div
      className="tdp-city-welcome"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tdp-city-welcome-title"
    >
      {/* Backdrop */}
      <div
        className="tdp-city-welcome-backdrop"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="tdp-city-welcome-card">
        <button
          type="button"
          className="tdp-city-welcome-close"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X size={16} aria-hidden />
        </button>

        <div className="tdp-city-welcome-icon">
          <Globe2 size={28} aria-hidden />
        </div>

        <h2 id="tdp-city-welcome-title" className="tdp-city-welcome-title">
          Are you in <strong>{activeCity.name}</strong>?
        </h2>
        <p className="tdp-city-welcome-subtitle">
          We can show the time for any of these cities — or search for your own.
        </p>

        <div className="tdp-city-welcome-chips" role="list">
          {defaultCities.map((city) => {
            const isActive = city.code === activeCity.code;
            return (
              <button
                key={city.code}
                type="button"
                role="listitem"
                className={`tdp-city-welcome-chip ${
                  isActive ? "tdp-city-welcome-chip--active" : ""
                }`}
                onClick={() => {
                  onConfirmActive();
                  // Override the active city to this one
                  dismiss();
                }}
                data-testid={`welcome-chip-${city.code}`}
              >
                <span className="tdp-city-welcome-chip-flag" aria-hidden>
                  {flagEmoji(city.countryCode)}
                </span>
                <span className="tdp-city-welcome-chip-name">{city.name}</span>
                {isActive && (
                  <span className="tdp-city-welcome-chip-badge">
                    <Sparkles size={10} aria-hidden /> Current
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="tdp-city-welcome-actions">
          <button
            type="button"
            className="tdp-btn tdp-btn--primary tdp-btn--md"
            onClick={handleConfirm}
            data-testid="welcome-confirm"
          >
            <MapPin size={14} aria-hidden style={{ marginRight: 6 }} />
            Yes, this is me
          </button>
          <button
            type="button"
            className="tdp-btn tdp-btn--secondary tdp-btn--md"
            onClick={handleOpenPicker}
            data-testid="welcome-pick"
          >
            Pick another
          </button>
          <button
            type="button"
            className="tdp-btn tdp-btn--ghost tdp-btn--md"
            onClick={dismiss}
            data-testid="welcome-later"
          >
            Maybe later
          </button>
        </div>

        <p className="tdp-city-welcome-foot">
          You can change this anytime · press <kbd>⌘K</kbd> to open the picker
        </p>
      </div>
    </div>
  );
}
