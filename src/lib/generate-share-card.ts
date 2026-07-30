// Client-only — uses browser Canvas API (no npm dep, consistent with compress-image.ts).
// Fonts are pre-loaded via the Google Fonts <link> in layout.tsx:
//   Cormorant Garamond (serif display / wordmark)
//   Plus Jakarta Sans  (body text)
// Both are available to Canvas once document.fonts.ready resolves.
//
// Composition rules:
//   1. CROP, DON'T FIT. The photo fills a fixed region (cover crop, centre-weighted)
//      instead of being scaled to fit inside a margin, so the composition no longer
//      moves with the image's aspect ratio.
//   2. FIXED COMPOSITION. Photo region + cream plate. The plate height is derived from
//      its own content, measured before the photo is drawn, so text never floats.
//   3. FOUR RATIOS, ONE ENGINE. story 9:16, feed 4:5, cover 1:1, link 1.91:1.
//      Everything is expressed in units of S = W / 1080, so type and padding scale.
//   4. Posts with no usable photo get the badge card — same gradient and emoji as
//      WorkoutBadgeCard in the feed — instead of an almost-empty cream page.

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShareRatio = "story" | "feed" | "cover" | "link";

export interface ShareMetric {
  /** e.g. "52" */
  value: string;
  /** e.g. "min" — rendered small and muted after the value */
  unit?: string;
  /** e.g. "Duration" — uppercase tracked label under the value */
  label: string;
}

/** Shape of the badge returned by lib/workout-badges.ts. */
export interface ShareBadge {
  name: string;
  subtitle: string;
  emoji?: string | null;
  /** CSS gradient string, e.g. "linear-gradient(135deg, #0D1F8C, #C04870)" */
  gradient?: string | null;
}

export interface PostCardData {
  type: "post";
  caption: string | null;
  mediaUrl: string | null;
  authorHandle: string;
  /** Eyebrow above the caption, e.g. "Sauna · 20 min" */
  eyebrow?: string | null;
  /** Up to 3. Omitted on `cover` and `link`, and when empty. */
  metrics?: ShareMetric[];
  /** Shown when mediaUrl is null — from lib/workout-badges.ts */
  badge?: ShareBadge | null;
}

export interface CatalogCardData {
  type: "catalog_item";
  productName: string;
  brand: string | null;
  mediaUrl?: string | null;
  authorHandle?: string;
}

export type ShareCardData = PostCardData | CatalogCardData;

// ── Tokens (canvas can't read CSS vars — mirrors globals.css) ─────────────────

const CREAM = "#F6F1E9";
const INK = "#18190F";
const BRAND = "#243F16";
const MUTED = "#7A7560";
const GOLD = "#9A7B2E";
const COBALT = "#0D1F8C";
const HAIRLINE = "rgba(36,63,22,0.12)";

const RATIOS: Record<ShareRatio, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  feed: { w: 1080, h: 1350 },
  cover: { w: 1080, h: 1080 },
  link: { w: 1200, h: 628 },
};

const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';
const SERIF = '"Cormorant Garamond", Georgia, serif';

/** ctx.letterSpacing is Chromium + Safari 17+; typed loosely so the build doesn't
 *  depend on the TS lib.dom version shipping it. Older Safari renders untracked. */
type TrackedCtx = CanvasRenderingContext2D & { letterSpacing?: string };

function setTracking(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as TrackedCtx).letterSpacing = `${px}px`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// The sheet regenerates the card on every ratio tap — cache decoded images so the
// photo is fetched once per session.
const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

  // Don't cache failures — a retry should be able to succeed.
  promise.catch(() => imageCache.delete(src));
  imageCache.set(src, promise);
  return promise;
}

/** Fill (x,y,w,h) completely with img, cropping the overflow. Centre-weighted,
 *  biased slightly toward the top third so faces and plated food survive. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) * 0.4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Pull the hex stops out of a CSS gradient string and paint the real thing.
 *  Falls back to solid cobalt when the string isn't parseable. */
function badgeFill(
  ctx: CanvasRenderingContext2D,
  gradient: string | null | undefined,
  W: number,
  H: number,
): string | CanvasGradient {
  const stops = gradient?.match(/#[0-9a-f]{3,8}/gi);
  if (!stops || stops.length === 0) return COBALT;
  if (stops.length === 1) return stops[0];
  // 135deg — top-left to bottom-right, matching WorkoutBadgeCard.
  const grad = ctx.createLinearGradient(0, 0, W, H);
  stops.forEach((stop, i) => grad.addColorStop(i / (stops.length - 1), stop));
  return grad;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  // Ellipsise if we truncated mid-caption
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(text).width > maxWidth * maxLines) {
      let trimmed = last;
      while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1);
      }
      lines[maxLines - 1] = `${trimmed.trimEnd()}…`;
    }
  }
  return lines;
}

let wordmarkPromise: Promise<HTMLImageElement | null> | null = null;
/** Optional: drop a wordmark at public/royal-wordmark.png and every card picks it
 *  up. Until then this resolves null and the serif fallback below is used. */
function loadWordmark(): Promise<HTMLImageElement | null> {
  if (!wordmarkPromise) {
    wordmarkPromise = loadImage("/royal-wordmark.png").catch(() => null);
  }
  return wordmarkPromise;
}

function drawWordmark(
  ctx: CanvasRenderingContext2D,
  mark: HTMLImageElement | null,
  rightX: number,
  baselineY: number,
  height: number,
  light = false,
) {
  if (mark) {
    const w = (mark.width / mark.height) * height;
    ctx.save();
    if (light) ctx.globalAlpha = 0.95;
    ctx.drawImage(mark, rightX - w, baselineY - height, w, height);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.font = `400 ${height * 1.3}px ${SERIF}`;
  ctx.fillStyle = light ? CREAM : BRAND;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Royal", rightX, baselineY);
  ctx.restore();
}

// ── The photo + plate card ───────────────────────────────────────────────────

async function buildPhotoCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  ratio: ShareRatio,
  d: {
    mediaUrl: string;
    caption: string | null;
    eyebrow?: string | null;
    handle: string;
    metrics?: ShareMetric[];
  },
) {
  const S = W / 1080;
  const PAD = 66 * S;
  const isLink = ratio === "link";
  const isCover = ratio === "cover";

  const metrics = isCover || isLink ? [] : (d.metrics ?? []).slice(0, 3);
  const captionSize = (isCover ? 40 : 50) * S;
  const captionLead = captionSize * 1.42;
  const maxCaptionLines = isCover ? 1 : ratio === "feed" ? 2 : 3;

  // ── Measure the plate before drawing anything ──
  const plateInnerW = (isLink ? W * 0.58 : W) - PAD * 2;
  ctx.font = `400 ${captionSize}px ${SANS}`;
  const captionLines = d.caption ? wrap(ctx, d.caption, plateInnerW, maxCaptionLines) : [];

  const eyebrowH = d.eyebrow && !isCover ? 26 * S + 30 * S : 0;
  const captionH = captionLines.length * captionLead;
  const metricsH = metrics.length ? 46 * S + 112 * S : 0;
  const footerH = 34 * S + 52 * S; // rule + handle/wordmark row
  const plateH = PAD * 0.85 + eyebrowH + captionH + metricsH + footerH + PAD * 0.7;

  // ── Photo ──
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  try {
    const img = await loadImage(d.mediaUrl);
    if (isLink) {
      drawCover(ctx, img, 0, 0, W * 0.42, H);
    } else {
      drawCover(ctx, img, 0, 0, W, H - plateH);
    }
  } catch {
    // Photo unavailable — the plate simply sits on the ink field.
  }

  // ── Plate ──
  const plateX = isLink ? W * 0.42 : 0;
  const plateY = isLink ? 0 : H - plateH;
  ctx.fillStyle = CREAM;
  ctx.fillRect(plateX, plateY, W - plateX, H - plateY);

  const left = plateX + PAD;
  const right = W - PAD;
  let y = plateY + PAD * 0.85;

  if (d.eyebrow && !isCover) {
    ctx.save();
    ctx.font = `600 ${24 * S}px ${SANS}`;
    ctx.fillStyle = MUTED;
    ctx.textBaseline = "top";
    setTracking(ctx, 4.3 * S);
    ctx.fillText(d.eyebrow.toUpperCase(), left, y);
    ctx.restore();
    y += eyebrowH;
  }

  if (captionLines.length) {
    ctx.save();
    ctx.font = `400 ${captionSize}px ${SANS}`;
    ctx.fillStyle = INK;
    ctx.textBaseline = "top";
    captionLines.forEach((line, i) => ctx.fillText(line, left, y + i * captionLead));
    ctx.restore();
    y += captionH;
  }

  if (metrics.length) {
    y += 46 * S;
    ctx.save();
    ctx.strokeStyle = HAIRLINE;
    ctx.lineWidth = Math.max(1, 2 * S);
    ctx.beginPath();
    ctx.moveTo(left, y - 24 * S);
    ctx.lineTo(right, y - 24 * S);
    ctx.stroke();
    const colW = (right - left) / metrics.length;
    metrics.forEach((m, i) => {
      const x = left + i * colW;
      ctx.textBaseline = "top";
      ctx.font = `500 ${66 * S}px ${SANS}`;
      ctx.fillStyle = BRAND;
      ctx.fillText(m.value, x, y);
      if (m.unit) {
        const vw = ctx.measureText(m.value).width;
        ctx.font = `500 ${32 * S}px ${SANS}`;
        ctx.fillStyle = MUTED;
        ctx.fillText(` ${m.unit}`, x + vw, y + 30 * S);
      }
      ctx.font = `600 ${22 * S}px ${SANS}`;
      ctx.fillStyle = MUTED;
      ctx.fillText(m.label.toUpperCase(), x, y + 84 * S);
    });
    ctx.restore();
  }

  // ── Footer: hairline + @handle + wordmark ──
  const footY = H - PAD * 0.7;
  ctx.save();
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = Math.max(1, 2 * S);
  ctx.beginPath();
  ctx.moveTo(left, footY - 52 * S);
  ctx.lineTo(right, footY - 52 * S);
  ctx.stroke();
  ctx.font = `500 ${32 * S}px ${SANS}`;
  ctx.fillStyle = MUTED;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`@${d.handle}`, left, footY);
  ctx.restore();
  drawWordmark(ctx, await loadWordmark(), right, footY + 2 * S, 44 * S);
}

// ── The badge card, for posts with no usable photo ────────────────────────────

async function buildBadgeCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  d: {
    badgeName: string;
    subtitle: string;
    emoji?: string | null;
    gradient?: string | null;
    eyebrow?: string | null;
    handle: string;
    metrics?: ShareMetric[];
  },
) {
  const S = W / 1080;
  const PAD = 100 * S;

  ctx.fillStyle = badgeFill(ctx, d.gradient, W, H);
  ctx.fillRect(0, 0, W, H);

  if (d.eyebrow) {
    ctx.save();
    ctx.font = `600 ${24 * S}px ${SANS}`;
    ctx.fillStyle = "rgba(246,241,233,0.55)";
    ctx.textBaseline = "top";
    setTracking(ctx, 4.8 * S);
    ctx.fillText(d.eyebrow.toUpperCase(), PAD, PAD);
    ctx.restore();
  }

  // ── Measure the block, then centre it — a badge name and a caption-only post
  // are wildly different lengths, so the type size fits the text. ──
  const len = d.badgeName.length;
  const nameSize = (len <= 24 ? 132 : len <= 44 ? 104 : len <= 80 ? 80 : 64) * S;
  const maxNameLines = len <= 24 ? 2 : len <= 44 ? 3 : 4;
  const nameLead = nameSize * 1.06;

  ctx.font = `300 ${nameSize}px ${SERIF}`;
  const nameLines = wrap(ctx, d.badgeName, W - PAD * 2, maxNameLines);

  ctx.font = `400 ${42 * S}px ${SANS}`;
  const subtitleLines = d.subtitle
    ? wrap(ctx, d.subtitle, (W - PAD * 2) * 0.72, 2)
    : [];

  const emojiH = d.emoji ? 180 * S : 0;
  const blockH =
    emojiH +
    nameLines.length * nameLead +
    66 * S + // gap to the gold rule
    58 * S + // rule to subtitle
    subtitleLines.length * 60 * S;

  const eyebrowBottom = PAD + (d.eyebrow ? 70 * S : 0);
  const footerTop = H - PAD * 0.9 - 130 * S;
  // Optically centred — biased slightly above true centre.
  let y = Math.max(eyebrowBottom, (H - blockH) * 0.46);
  if (y + blockH > footerTop) y = Math.max(eyebrowBottom, footerTop - blockH);

  // Emoji — the same glyph the feed badge card shows
  if (d.emoji) {
    ctx.save();
    ctx.font = `400 ${132 * S}px ${SANS}`;
    ctx.textBaseline = "top";
    ctx.fillText(d.emoji, PAD, y);
    ctx.restore();
    y += emojiH;
  }

  ctx.save();
  ctx.font = `300 ${nameSize}px ${SERIF}`;
  ctx.fillStyle = CREAM;
  ctx.textBaseline = "top";
  nameLines.forEach((line, i) => ctx.fillText(line, PAD, y + i * nameLead));
  ctx.restore();
  y += nameLines.length * nameLead + 66 * S;

  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(1, 3 * S);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(PAD + 146 * S, y);
  ctx.stroke();
  ctx.restore();
  y += 58 * S;

  if (subtitleLines.length) {
    ctx.save();
    ctx.font = `400 ${42 * S}px ${SANS}`;
    ctx.fillStyle = "rgba(246,241,233,0.72)";
    ctx.textBaseline = "top";
    subtitleLines.forEach((line, i) => ctx.fillText(line, PAD, y + i * 60 * S));
    ctx.restore();
  }

  const footY = H - PAD * 0.9;
  const lead = d.metrics?.[0];
  ctx.save();
  ctx.textBaseline = "alphabetic";
  if (lead) {
    ctx.font = `500 ${62 * S}px ${SANS}`;
    ctx.fillStyle = CREAM;
    ctx.fillText(lead.value, PAD, footY - 56 * S);
    if (lead.unit) {
      const vw = ctx.measureText(lead.value).width;
      ctx.font = `500 ${30 * S}px ${SANS}`;
      ctx.fillStyle = "rgba(246,241,233,0.6)";
      ctx.fillText(` ${lead.unit}`, PAD + vw, footY - 56 * S);
    }
  }
  ctx.font = `500 ${32 * S}px ${SANS}`;
  ctx.fillStyle = "rgba(246,241,233,0.6)";
  ctx.fillText(`@${d.handle}`, PAD, footY);
  ctx.restore();
  drawWordmark(ctx, await loadWordmark(), W - PAD, footY + 2 * S, 46 * S, true);
}

// ── Catalog item (product recommendation) ────────────────────────────────────

async function buildCatalogCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  ratio: ShareRatio,
  d: CatalogCardData,
) {
  const handle = d.authorHandle ?? "royal";
  if (d.mediaUrl) {
    await buildPhotoCard(ctx, W, H, ratio, {
      mediaUrl: d.mediaUrl,
      caption: d.productName,
      eyebrow: d.brand ?? "Recommended",
      handle,
      metrics: [],
    });
    return;
  }
  await buildBadgeCard(ctx, W, H, {
    badgeName: d.productName,
    subtitle: d.brand ? `${d.brand} — one I actually use.` : "One I actually use.",
    eyebrow: "Recommended",
    handle,
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Make sure both families are rasterisable before we measure text. */
async function ensureFonts() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load(`400 50px "Plus Jakarta Sans"`),
    document.fonts.load(`500 66px "Plus Jakarta Sans"`),
    document.fonts.load(`600 24px "Plus Jakarta Sans"`),
    document.fonts.load(`300 150px "Cormorant Garamond"`),
  ]).catch(() => {});
  await document.fonts.ready;
}

export async function generateShareCard(
  data: ShareCardData,
  ratio: ShareRatio = "story",
): Promise<Blob> {
  await ensureFonts();

  const { w: W, h: H } = RATIOS[ratio];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  if (data.type === "catalog_item") {
    await buildCatalogCard(ctx, W, H, ratio, data);
  } else if (data.mediaUrl) {
    await buildPhotoCard(ctx, W, H, ratio, {
      mediaUrl: data.mediaUrl,
      caption: data.caption,
      eyebrow: data.eyebrow,
      handle: data.authorHandle,
      metrics: data.metrics,
    });
  } else if (data.badge) {
    await buildBadgeCard(ctx, W, H, {
      badgeName: data.badge.name,
      subtitle: data.badge.subtitle || data.caption || "",
      emoji: data.badge.emoji,
      gradient: data.badge.gradient,
      eyebrow: data.eyebrow,
      handle: data.authorHandle,
      metrics: data.metrics,
    });
  } else {
    // Caption-only post: treat the caption as the editorial statement.
    await buildBadgeCard(ctx, W, H, {
      badgeName: data.caption ?? "Logged",
      subtitle: "",
      eyebrow: data.eyebrow,
      handle: data.authorHandle,
      metrics: data.metrics,
    });
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Share card generation failed"))),
      "image/png",
    );
  });
}

/** Hand the card to the OS share sheet with the file attached, so Instagram /
 *  Messages / TikTok are one tap. Falls back to a download where Web Share with
 *  files isn't supported (desktop Safari, older Android browsers). */
export async function shareCard(
  data: ShareCardData,
  opts: { ratio?: ShareRatio; url?: string; text?: string } = {},
): Promise<"shared" | "downloaded" | "cancelled"> {
  const blob = await generateShareCard(data, opts.ratio ?? "story");
  const file = new File([blob], "royal.png", { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        ...(opts.url ? { url: opts.url } : {}),
        ...(opts.text ? { text: opts.text } : {}),
      });
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return "cancelled";
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "royal.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
