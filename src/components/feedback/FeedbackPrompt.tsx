// src/components/feedback/FeedbackPrompt.tsx
// Bottom-of-tool contextual CTA. Sits at the end of every dedicated
// tool page (TZC, Meeting Finder, World Clock, etc.) and links to
// /feedback?type=suggestion&tool=<slug>, which pre-fills the form on
// the feedback page. Single-purpose component, no props besides
// the tool slug (and an optional human-readable label).
//
// Visual: a quiet card with a message-circle icon, a one-line prompt,
// and a single emerald pill. Matches the polish-8 width standard
// (max-w-[1120px] inside the standard app shell). Designed to
// disappear into the page, not stand out — a sticky widget would
// feel spammy on a tool page where the user is mid-task.

import { MessageSquare, ArrowRight } from "lucide-react";
import "./FeedbackPrompt.css";

export interface FeedbackPromptProps {
  tool: string;            // route slug, e.g. "time-zone-converter"
  toolLabel?: string;      // human-readable, e.g. "Time Zone Converter"
  className?: string;      // extra wrapper class for layout control
}

export function FeedbackPrompt({ tool, toolLabel, className }: FeedbackPromptProps) {
  const href = `/feedback?type=suggestion&tool=${encodeURIComponent(tool)}`;
  return (
    <aside
      className={`fb-prompt ${className || ""}`}
      aria-label="Feedback prompt"
    >
      <div className="fb-prompt__icon" aria-hidden="true">
        <MessageSquare size={20} />
      </div>
      <div className="fb-prompt__body">
        <h3 className="fb-prompt__title">Have feedback on {toolLabel || "this tool"}?</h3>
        <p className="fb-prompt__sub">
          Tell us what is missing, what feels slow, or what you wish it did.
        </p>
      </div>
      <a
        className="fb-prompt__cta"
        href={href}
        onClick={(e) => {
          // Use the SPA router's navigate event so the back button
          // works correctly and the hero state survives the trip.
          e.preventDefault();
          window.history.pushState(null, "", href);
          window.dispatchEvent(new Event("tdp:navigate"));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Suggest an improvement
        <ArrowRight size={14} />
      </a>
    </aside>
  );
}
