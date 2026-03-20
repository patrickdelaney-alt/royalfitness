/**
 * link-handler.ts
 *
 * Utilities for opening external links correctly across environments.
 *
 * - In a Capacitor native app (iOS/Android), `target="_blank"` links open
 *   inside Capacitor's in-app webview. Using `window.open(url, '_system')`
 *   routes them through the device's default system browser instead.
 * - In a standard web browser the default `_blank` behaviour is preserved.
 */

/** Internal app hostnames — links to these stay inside the app. */
const INTERNAL_HOSTS = ["royalwellness.vercel.app", "royalwellness.app"];

/**
 * Returns true when running inside a Capacitor native wrapper (iOS/Android).
 * Safe to call during SSR (returns false on the server).
 */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Returns true when `url` points to an external site (i.e. not the app itself).
 *
 * Internal: relative paths, hash anchors, non-http(s) schemes, and the app's
 * own domains (royalwellness.vercel.app / royalwellness.app).
 */
export function isExternalUrl(url: string): boolean {
  if (!url || url.startsWith("/") || url.startsWith("#")) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return !INTERNAL_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/**
 * Opens an external URL:
 * - Capacitor native → system browser via `_system` target
 * - Web browser → new tab via `_blank`
 *
 * Silently ignores empty, malformed, or non-http(s) URLs to avoid crashes.
 */
export function openExternalLink(url: string): void {
  if (!url) return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
  } catch {
    return;
  }

  if (isCapacitorNative()) {
    window.open(url, "_system");
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
