// One place that decides how anything leaves the app.
//
// The native shell (capacitor.config.ts) loads the site in a WKWebView, where
// `navigator.share` with files is absent and `<a download>` is ignored outright —
// so the web-only path fails silently there. Native gets the Capacitor Share
// plugin; the browser gets Web Share; everything else degrades to a clipboard
// copy or a download. Every branch reports what it did, so a share can never
// look like nothing happened.
//
// Web Share needs transient user activation: `shareCardImage` is deliberately
// NOT async, so `navigator.share` is reached in the same tick as the click when
// the card blob is already in hand. Await it, don't await before it.

import { isCapacitorNative } from "@/lib/link-handler";

export type ShareOutcome =
  /** The OS share sheet opened and the user picked a target. */
  | "shared"
  /** The user dismissed the share sheet. */
  | "cancelled"
  /** No share sheet available — the link is on the clipboard instead. */
  | "copied"
  /** No share sheet available — the image was downloaded (link copied too). */
  | "downloaded"
  /** Nothing worked. */
  | "failed";

interface CardShareOptions {
  blob?: Blob | null;
  url?: string;
  text?: string;
  title?: string;
  fileName?: string;
}

const DEFAULT_FILE_NAME = "royal.png";

// ── helpers ───────────────────────────────────────────────────────────────────

/** The iOS plugin rejects with "Share canceled" rather than an AbortError. */
function isDismissal(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === "AbortError" || /cancel/i.test(err.message);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      // Filesystem.writeFile wants raw base64, without the data: prefix.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the card"));
    reader.readAsDataURL(blob);
  });
}

/** Best-effort clipboard write. Call it inside the click handler — the async
 *  clipboard API needs the user gesture too. */
export async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Older WKWebViews and non-secure contexts don't have the async clipboard.
    try {
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(field);
      return ok;
    } catch {
      return false;
    }
  }
}

function downloadBlob(blob: Blob, fileName: string): boolean {
  try {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    // Firefox ignores a click on an anchor that isn't in the document.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  } catch {
    return false;
  }
}

/** Nothing can open a share sheet — save what we can and tell the truth. */
async function withoutShareSheet(opts: CardShareOptions): Promise<ShareOutcome> {
  const copied = opts.url ? await copyLink(opts.url) : false;
  if (opts.blob && !isCapacitorNative()) {
    if (downloadBlob(opts.blob, opts.fileName ?? DEFAULT_FILE_NAME)) return "downloaded";
  }
  return copied ? "copied" : "failed";
}

// ── native ────────────────────────────────────────────────────────────────────

/** Dynamically imported so the plugins stay out of the browser's critical path,
 *  and so an app binary without them fails at the import rather than at launch. */
async function nativeShare(opts: CardShareOptions): Promise<ShareOutcome> {
  const { Share } = await import("@capacitor/share");

  let files: string[] | undefined;
  if (opts.blob) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { uri } = await Filesystem.writeFile({
      path: `royal-${Date.now()}.png`,
      data: await blobToBase64(opts.blob),
      directory: Directory.Cache,
    });
    files = [uri];
  }

  try {
    await Share.share({
      ...(opts.title ? { title: opts.title } : {}),
      ...(opts.text ? { text: opts.text } : {}),
      ...(opts.url ? { url: opts.url } : {}),
      ...(files ? { files } : {}),
      dialogTitle: opts.title ?? "Share",
    });
    return "shared";
  } catch (err) {
    if (isDismissal(err)) return "cancelled";
    throw err;
  }
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Share the card image, with the referral link attached wherever the target
 * supports it. NOT async on purpose — see the note at the top of the file.
 */
export function shareCardImage(opts: CardShareOptions): Promise<ShareOutcome> {
  if (isCapacitorNative()) {
    return nativeShare(opts).catch(() => withoutShareSheet(opts));
  }

  const file = opts.blob
    ? new File([opts.blob], opts.fileName ?? DEFAULT_FILE_NAME, { type: "image/png" })
    : null;

  if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    // WebKit refuses some file+url combinations outright — check before asking,
    // and drop the url rather than the image if it won't take both.
    const withUrl = opts.url
      ? { files: [file], url: opts.url, ...(opts.text ? { text: opts.text } : {}) }
      : null;
    const payload =
      withUrl && navigator.canShare?.(withUrl) ? withUrl : { files: [file] };

    return navigator
      .share(payload)
      .then<ShareOutcome>(() => "shared")
      .catch((err: unknown) =>
        isDismissal(err) ? "cancelled" : withoutShareSheet(opts),
      );
  }

  if (opts.url && typeof navigator !== "undefined" && navigator.share) {
    return navigator
      .share({ url: opts.url, ...(opts.text ? { text: opts.text } : {}) })
      .then<ShareOutcome>(() => "shared")
      .catch((err: unknown) =>
        isDismissal(err) ? "cancelled" : withoutShareSheet(opts),
      );
  }

  return withoutShareSheet(opts);
}

/** Share a bare link — the same ladder without the image steps. */
export function shareLink(opts: {
  url: string;
  text?: string;
  title?: string;
}): Promise<ShareOutcome> {
  if (isCapacitorNative()) {
    return nativeShare(opts).catch(() => withoutShareSheet(opts));
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    return navigator
      .share({
        url: opts.url,
        ...(opts.text ? { text: opts.text } : {}),
        ...(opts.title ? { title: opts.title } : {}),
      })
      .then<ShareOutcome>(() => "shared")
      .catch((err: unknown) =>
        isDismissal(err) ? "cancelled" : withoutShareSheet(opts),
      );
  }

  return withoutShareSheet(opts);
}
