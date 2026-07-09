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

/**
 * True if the browser supports sharing FILES alone via the Web Share API.
 * (Some browsers reject text + files combined, so we probe separately.)
 */
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

/** True if the browser can call navigator.share with text alone. */
export function canShareText(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("share" in navigator)) return false;
  try {
    return navigator.canShare({ text: "test" });
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

/**
 * Open the OS share sheet, falling through gracefully.
 *
 * Order of attempts:
 *   1. navigator.share with files only  (Chrome desktop, iOS Safari)
 *   2. navigator.share with text only   (Firefox, Android Chrome)
 *   3. clipboard.write image + text     (Chromium, Safari 13.1+)
 *   4. triggerDownload(blob) + copy URL  (anything else)
 */
export async function shareImageWithUrl(
  blob: Blob,
  filename: string,
  title: string,
  text: string,
  url: string
): Promise<"shared" | "shared-url" | "copied" | "downloaded" | "url-copied"> {
  // 1. File share (preferred when supported)
  if (canShareFiles()) {
    try {
      const file = new File([blob], filename, { type: "image/png" });
      await navigator.share({ title, files: [file] });
      return "shared";
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") return "shared";
      console.warn("[share] file share failed:", err);
    }
  }
  // 2. Text share (always include the URL so the recipient can view live)
  if (canShareText()) {
    try {
      await navigator.share({ title, text: `${text}\n${url}` });
      return "shared-url";
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") return "shared-url";
      console.warn("[share] text share failed:", err);
    }
  }
  // 3. Clipboard image (paired with text so paste-target always lands something)
  if (await canClipboardImage()) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
          "text/plain": new Blob([`${text}\n${url}`], { type: "text/plain" }),
        }),
      ]);
      return "copied";
    } catch (e) {
      console.warn("[share] clipboard image failed:", e);
    }
  }
  // 4. Final fallback — trigger a download AND copy the URL
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
 * Embed a PNG blob as a data URL. Used for .ics attachments only —
 * DO NOT pass to Google Calendar or Outlook URL composition: those
 * clients (a) truncate URLs > ~2 MB, and (b) strip "data:" URIs for
 * security. The base64 of a 2x-screenshot typically blows past 2 MB.
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Calendar description for Google Calendar + Outlook web. NO inline image —
 * Google strips data: URIs from URL parameters and Outlook truncates the
 * URL. Instead, point recipients at the live share URL where the grid is
 * always rendered and can be screenshotted by hand.
 */
export function composeCalendarDescription(
  cityNames: string[],
  appUrl: string,
  _unused?: unknown
): string {
  return [
    `Time zone check across ${cityNames.length} cities: ${cityNames.join(", ")}.`,
    "",
    `Open the live comparison (with screenshot): ${appUrl}`,
    "",
    "(Screenshot can be downloaded from the Share button on that page.)",
  ].join("\n");
}