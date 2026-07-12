// src/components/tools/shared/ToolDisclaimer.tsx
// Standard legal disclaimer block for all tool pages. Lavender soft card
// with a "!" mark, the disclaimer text, and links to Terms/Privacy.

import React from "react";

interface Props {
  /** Tool name, included in the disclaimer sentence for context */
  toolName: string;
  /** Optional override for the heading — defaults to "Disclaimer" */
  title?: string;
  /** Optional override for the body — defaults to a generic legal disclaimer */
  body?: React.ReactNode;
}

const DEFAULT_BODY = (
  <>
    <p className="disclaimer-text">
      This tool is provided for convenience and reference only. It is{" "}
      <strong>not legal advice</strong> and does not constitute a professional
      opinion on the validity, enforceability, or formatting of any document.
      For legal documents, financial instruments, immigration papers, and
      government filings, always have the result{" "}
      <strong>verified by a qualified professional</strong> (attorney, notary,
      banker) before signing or submission. Date formatting conventions vary
      by jurisdiction, institution, and document type — the formats shown here
      are general conventions and may not match your specific requirement.
    </p>
    <p className="disclaimer-text">
      Conversion runs in your browser; no data is sent to a server. Free tier
      is provided as-is with no warranty. See <a href="#">Terms</a> and{" "}
      <a href="#">Privacy</a> for full terms.
    </p>
  </>
);

export const ToolDisclaimer: React.FC<Props> = ({
  toolName,
  title = "Disclaimer",
  body,
}) => {
  return (
    <div className="disclaimer" aria-label={`${toolName} disclaimer`}>
      <div className="disclaimer-icon">!</div>
      <div className="disclaimer-body">
        <div className="disclaimer-title">{title}</div>
        {body ?? DEFAULT_BODY}
      </div>
    </div>
  );
};

export default ToolDisclaimer;
