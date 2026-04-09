// Client-only — uses browser Canvas API (no npm dep, consistent with compress-image.ts).
// Fonts are pre-loaded via the Google Fonts <link> in layout.tsx:
//   Cormorant Garamond (serif display / wordmark)
//   Plus Jakarta Sans  (body text)
// Both are available to Canvas once document.fonts.ready resolves.

export interface PostCardData {
  type: "post";
  caption: string | null;
  mediaUrl: string | null;
  authorHandle: string;
}

export interface CatalogCardData {
  type: "catalog_item";
  productName: string;
  brand: string | null;
}

export type ShareCardData = PostCardData | CatalogCardData;

// Card dimensions — 9:16 for Instagram Stories
const W = 1080;
const H = 1920;

const CREAM = "#f5f2ec";
const GREEN = "#2d5a27";
const GOLD = "#c8a951";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Wrap text to a maximum pixel width, returning an array of lines.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Draw "Royal" wordmark — small serif, bottom-right.
function drawWordmark(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.font = `300 42px "Cormorant Garamond", Georgia, serif`;
  ctx.fillStyle = GREEN;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Royal", W - 80, H - 80);
  ctx.restore();
}

async function buildPostCard(
  ctx: CanvasRenderingContext2D,
  data: PostCardData
): Promise<void> {
  // Background
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);

  let textStartY = H * 0.55;

  // Photo — centred in the upper 50% of the frame with generous padding
  if (data.mediaUrl) {
    try {
      const img = await loadImage(data.mediaUrl);
      const maxImgW = W - 160; // 80px margin each side
      const maxImgH = H * 0.48;
      const scale = Math.min(maxImgW / img.width, maxImgH / img.height);
      const imgW = img.width * scale;
      const imgH = img.height * scale;
      const imgX = (W - imgW) / 2;
      const imgY = H * 0.08;
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
      textStartY = imgY + imgH + 72;
    } catch {
      // Image failed to load — skip it, text will start higher
      textStartY = H * 0.38;
    }
  } else {
    textStartY = H * 0.42;
  }

  // Caption
  if (data.caption) {
    ctx.save();
    ctx.font = `300 52px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = GREEN;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const maxTextW = W - 160;
    const lines = wrapText(ctx, data.caption, maxTextW);
    // Cap at 4 lines to preserve negative space
    const visibleLines = lines.slice(0, 4);
    const lineHeight = 72;
    visibleLines.forEach((line, i) => {
      ctx.fillText(line, 80, textStartY + i * lineHeight);
    });
    textStartY += visibleLines.length * lineHeight + 48;
    ctx.restore();
  }

  // @handle — smaller, muted green
  ctx.save();
  ctx.font = `300 34px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = `${GREEN}99`; // 60% opacity via hex alpha
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`@${data.authorHandle}`, 80, textStartY);
  ctx.restore();

  drawWordmark(ctx);
}

function buildCatalogCard(
  ctx: CanvasRenderingContext2D,
  data: CatalogCardData
): void {
  // Background
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);

  // Vertical centre anchor — product name sits slightly above true centre
  const centreY = H * 0.42;

  // Brand name (if present) — small, regular, above the product name
  let nameY = centreY;
  if (data.brand) {
    ctx.save();
    ctx.font = `400 36px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = `${GREEN}99`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(data.brand.toUpperCase(), 80, centreY - 80);
    ctx.restore();
    nameY = centreY;
  }

  // Product name — large Cormorant Garamond serif, forest green
  ctx.save();
  ctx.font = `400 96px "Cormorant Garamond", Georgia, serif`;
  ctx.fillStyle = GREEN;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const maxNameW = W - 160;
  const nameLines = wrapText(ctx, data.productName, maxNameW);
  const visibleNameLines = nameLines.slice(0, 3);
  const nameLineHeight = 112;
  visibleNameLines.forEach((line, i) => {
    ctx.fillText(line, 80, nameY + i * nameLineHeight);
  });
  const lastNameLineY = nameY + (visibleNameLines.length - 1) * nameLineHeight;
  ctx.restore();

  // Gold accent line — 2px, flush left, below the product name
  const accentY = lastNameLineY + 40;
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, accentY);
  ctx.lineTo(80 + 120, accentY); // short deliberate rule, not full width
  ctx.stroke();
  ctx.restore();

  drawWordmark(ctx);
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  // Wait for fonts to be available to Canvas
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  if (data.type === "post") {
    await buildPostCard(ctx, data);
  } else {
    buildCatalogCard(ctx, data);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Share card generation failed"));
          return;
        }
        resolve(blob);
      },
      "image/png"
    );
  });
}
