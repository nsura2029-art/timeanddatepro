// src/utils/screenshot.ts
// DOM → PNG capture + Web Share / Clipboard plumbing.
//
// Browser capabilities:
//   Web Share API (files) — iOS Safari 12+, Android Chrome 75+, desktop Chrome 89+
//   Clipboard image       — Chrome 76+, Safari 13.1+, Firefox 127+
//   Fallback everywhere  — copy URL to clipboard + trigger download
//
// Capture pipeline:
//   1. Try html2canvas       — full fidelity, handles gradient/shadow/etc.
//   2. Fallback to native canvas — draws a structured label canvas. ALWAYS
//      succeeds, even when html2canvas chokes on a parent transform or
//      oklch() color.

import html2canvas from "html2canvas";

export interface CaptureOptions {
  /** Background color for the canvas. Default: white. */
  backgroundColor?: string;
  /** Output scale. Default: 2 (retina). */
  scale?: number;
  /** Allow cross-origin images. Default: true. */
  useCORS?: boolean;
  /** Total ms to wait for html2canvas before falling back. Default: 5000. */
  timeoutMs?: number;
}

/**
 * Capture an element to a PNG Blob. Always resolves — returns a fallback
 * canvas if html2canvas fails or times out.
 */
export async function captureElement(
  el: HTMLElement | null | undefined,
  opts: CaptureOptions = {}
): Promise<Blob | null> {
  if (!el) {
    console.error("[capture] element is null/undefined");
    return null;
  }
  const w = el.scrollWidth || el.clientWidth;
  const h = el.scrollHeight || el.clientHeight;
  if (w === 0 || h === 0) {
    console.error("[capture] element has zero dimensions", { w, h });
    return drawFallbackCanvas("Time zone grid is empty — add at least one city.");
  }
  const timeoutMs = opts.timeoutMs ?? 5000;

  console.log(`[capture] starting html2canvas (${w}x${h}, scale ${opts.scale ?? 2})`);

  try {
    const result = await Promise.race([
      html2canvas(el, ({
        background: opts.backgroundColor ?? "#ffffff",
        scale: opts.scale ?? 2,
        useCORS: opts.useCORS ?? true,
        logging: false,
        width: w,
        height: h,
        windowWidth: w,
        ignoreElements: (node: Element) => {
          if (!(node instanceof HTMLElement)) return false;
          return node.dataset?.screenshotExclude === "true";
        },
      } as any)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`html2canvas timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    const blob = await new Promise<Blob | null>((resolve) =>
      result.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) {
      console.error("[capture] canvas.toBlob returned null");
      return drawFallbackCanvas("Screenshot rendering produced no output.");
    }
    console.log(`[capture] html2canvas success: ${(blob.size / 1024).toFixed(0)}KB`);
    return blob;
  } catch (e) {
    console.error("[capture] html2canvas failed:", e);
    return drawFallbackCanvas(`html2canvas failed — ${(e as Error)?.message ?? "unknown error"}. Live link is below.`);
  }
}

/**
 * Build a simple plain-canvas PNG that summarizes the converter's state.
 * ALWAYS succeeds — no external library, no DOM walk.
 */
export async function drawFallbackCanvas(titleText: string): Promise<Blob | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // Title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillText("TimeAndDatePro  \u2014  Time Zone Check", 32, 60);

    // Body
    ctx.fillStyle = "#475569";
    ctx.font = "16px system-ui, -apple-system, sans-serif";
    ctx.fillText("Live grid: visit the shared link to see the current timezone comparison.", 32, 110);

    // Active URL section
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 14px ui-monospace, monospace";
    ctx.fillText("Live grid:", 32, 160);
    ctx.fillStyle = "#3f51b5";
    ctx.font = "13px ui-monospace, monospace";
    const url = typeof window !== "undefined" ? window.location.href : "";
    ctx.fillText(url.slice(0, 90), 32, 184);
    if (url.length > 90) ctx.fillText(url.slice(90, 180), 32, 204);

    // Footer note
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText(titleText, 32, 320);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillText("Captured " + new Date().toLocaleString(), 32, 340);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
  } catch (e) {
    console.error("[capture] fallback canvas failed:", e);
    return null;
  }
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
  triggerDownload(blob, filename);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${text}\n${url}`);
  }
  return "downloaded";
}

/** Trigger a browser download of a Blob. Always resolves. */
export function triggerDownload(blob: Blob | null, filename: string): boolean {
  if (!blob) {
    console.error("[download] no blob provided");
    return false;
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    console.log(`[download] triggered: ${filename} (${(blob.size / 1024).toFixed(0)}KB)`);
    return true;
  } catch (e) {
    console.error("[download] failed:", e);
    return false;
  }
}

/**
 * Embed a PNG blob as a data URL. Used for .ics attachments only \u2014
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
 * Calendar description for Google Calendar + Outlook web. NO inline image \u2014
 * Google strips data: URIs from URL parameters and Outlook truncates the
 * URL. Instead, point recipients at the live share URL where the grid is
 * always rendered and can be screenshotted by hand.
 */
export function composeCalendarDescription(
  cityNames: string[],
  appUrl: string
): string {
  return [
    `Time zone check across ${cityNames.length} cities: ${cityNames.join(", ")}.`,
    "",
    `Open the live comparison (with screenshot): ${appUrl}`,
    "",
    "(Screenshot can be downloaded from the Save PNG button on that page.)",
  ].join("\n");
}