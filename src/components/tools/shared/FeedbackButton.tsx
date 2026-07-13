// src/components/tools/shared/FeedbackButton.tsx
// Floating bottom-right "Suggest / Feedback" button + popover form.
// Standard across all tool pages. Captures suggestions, bug reports,
// and praise. POSTs to /api/v1/captures with localStorage fallback.
// when the API is wired) and shows a friendly success state.

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import { postCapture } from "../../../lib/api/captures";

type FeedbackType = "suggestion" | "bug" | "praise";

interface CapturedFeedback {
  type: FeedbackType;
  text: string;
  email: string;
  page: string;
  timestamp: number;
}

// FEEDBACK_STORAGE_KEY retained as a legacy key for the API client's
// safe-remove on success. New captures go to /api/v1/captures.
const FEEDBACK_STORAGE_KEY = "tdp_feedback";

const FEEDBACK_TYPES: { id: FeedbackType; label: string; emoji: string }[] = [
  { id: "suggestion", label: "Suggestion", emoji: "💡" },
  { id: "bug", label: "Bug", emoji: "🐛" },
  { id: "praise", label: "Love it", emoji: "❤️" },
];

interface Props {
  /** Tool name, recorded with the feedback (e.g. "Date to Words") */
  pageName: string;
  /** Optional callback for analytics integration */
  onSubmit?: (entry: CapturedFeedback) => void;
}

export const FeedbackButton: React.FC<Props> = ({ pageName, onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      // Could surface an inline error instead
      return;
    }
    const entry: CapturedFeedback = {
      type: selectedType,
      text: trimmed,
      email: email.trim(),
      page: pageName,
      timestamp: Date.now(),
    };
    // Fire-and-forget POST to /api/v1/captures. On failure, the API
    // client falls back to localStorage automatically.
    void postCapture({
      type: selectedType,
      payload: { text: trimmed, email: email.trim() },
      page: pageName,
      tool: "date-words",
      email: email.trim() || undefined,
    });
    // Console-log for dev visibility
    // eslint-disable-next-line no-console
    console.log("[Feedback]", entry);
    onSubmit?.(entry);

    setIsSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      // Reset after the popover closes
      setTimeout(() => {
        setIsSubmitted(false);
        setMessage("");
        setEmail("");
        setSelectedType("suggestion");
      }, 250);
    }, 1800);
  };

  return (
    <div className="feedback-fab">
      <div
        ref={popoverRef}
        className={`feedback-popover${isOpen ? " open" : ""}`}
        role="dialog"
        aria-label="Suggest or report"
      >
        {!isSubmitted ? (
          <div className="feedback-popover-body">
            <div className="feedback-popover-head">
              <div className="feedback-popover-title">Suggest or report</div>
              <div className="feedback-popover-sub">
                Tell us what's missing or what broke. We read every submission.
              </div>
            </div>
            <div className="feedback-type-row">
              {FEEDBACK_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`feedback-type${selectedType === type.id ? " active" : ""}`}
                  onClick={() => setSelectedType(type.id)}
                >
                  {type.emoji} {type.label}
                </button>
              ))}
            </div>
            <textarea
              className="feedback-textarea"
              placeholder="What's on your mind?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <input
              className="feedback-input"
              type="email"
              placeholder="Email (optional, for follow-up)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="feedback-actions">
              <span className="feedback-hint">
                Or email{" "}
                <a href="mailto:hello@dateandtime.live" style={{ color: "var(--color-brand-600)" }}>
                  hello@dateandtime.live
                </a>
              </span>
              <button
                type="button"
                className="tdp-btn tdp-btn--primary tdp-btn--sm"
                onClick={handleSubmit}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="feedback-success">
            <span className="feedback-success-icon">✓</span>
            <strong>Thanks — we got it.</strong>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>
              We'll follow up if we need more info.
            </div>
          </div>
        )}
      </div>
      <button
        ref={triggerRef}
        type="button"
        className="feedback-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="feedback-trigger-icon">
          <MessageSquare size={16} strokeWidth={2.2} />
        </span>
        <span>{isOpen ? "Close" : "Suggest / Feedback"}</span>
      </button>
    </div>
  );
};

export default FeedbackButton;
