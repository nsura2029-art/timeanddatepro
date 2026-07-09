// src/utils/screenshot.ts
// DOM → PNG capture + Web Share / Clipboard plumbing.
//
// Browser capabilities:
//   Web Share API (files) — iOS Safari 12+, Android Chrome 75+, desktop Chrome 89+
//   Clipboard image       — Chrome 76+, Safari 13.1+, Firefox 127+
//   Fallback everywhere  — copy URL to clipboard + trigger download

import html2canvas from "html2canvas";

export interface CaptureOptions {
  /** Background color for the canvas. Default: white. */
  backgroundColor?: string;
  /** Output scale. Default: 2 (retina). */
  scale?: number;
  /** Allow cross-origin images. Default: true. */
  useCORS?: boolean;
}

export async function captureElement(
  el: HTMLElement,
  opts: CaptureOptions = {}
): Promise<Blob | null> {
  const canvas = await html2canvas(el, ({
    background: opts.backgroundColor ?? "#ffffff",
    scale: opts.scale ?? 2,
    useCORS: opts.useCORS ?? true,
    logging: false,
    // Avoid html2canvas trying to clone the entire document
    width: el.scrollWidth,
    height: el.scrollHeight,
    windowWidth: el.scrollWidth,
    ignoreElements: (node: Element) => {
      // Skip toolbars/buttons inside the capture so the screenshot is clean
      if (!(node instanceof HTMLElement)) return false;
      return node.dataset?.screenshotExclude === "true";
    },
  } as any));
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** True if the browser supports sharing files via the Web Share API. */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("share" in navigator) || !("canShare" in navigator)) return false;
  try {
    const probe = new File([new Blob()], "probe.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** True if the browser supports writing an image to the clipboard. */
export async function canClipboardImage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    if (!("write" in navigator.clipboard)) return false;
    const probe = new ClipboardItem({ "image/png": new Blob() });
    await navigator.clipboard.write([probe]);
    return true;
  } catch {
    return false;
  }
}

/** Open the OS share sheet with a file + URL. Resolves to true if shared. */
export async function shareImageWithUrl(
  blob: Blob,
  filename: string,
  title: string,
  text: string,
  url: string
): Promise<"shared" | "copied" | "downloaded" | "url-copied"> {
  if (canShareFiles()) {
    try {
      const file = new File([blob], filename, { type: "image/png" });
      await navigator.share({
        title,
        text: `${text}\n${url}`,
        files: [file],
      });
      return "shared";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "shared"; // user cancelled = intent satisfied
      // fall through to clipboard
    }
  }
  if (await canClipboardImage()) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      // Also copy the URL as text alongside the image
      if (navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      }
      return "copied";
    } catch {/* fall through */}
  }
  // Final fallback: trigger download + copy URL
  triggerDownload(blob, filename);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${text}\n${url}`);
  }
  return "downloaded";
}

/** Trigger a browser download of a Blob. */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Embed a PNG blob into a calendar-event description field. Most calendar
 * clients render <img src="data:image/png;base64,..."> snippets inline.
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Build a "Cities: ["NYC","LDN",...]" tag for a calendar description. */
export function composeCalendarDescription(
  cityNames: string[],
  appUrl: string,
  imageDataUrl?: string
): string {
  const lines = [
    `Compare time zones across ${cityNames.length} cities.`,
    "",
    `View in app: ${appUrl}`,
  ];
  if (imageDataUrl) {
    lines.splice(1, 0, "", `![Time zone screenshot](${imageDataUrl})`, "");
  }
  return lines.join("\n");
}