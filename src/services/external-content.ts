/**
 * External Content Integration
 *
 * Supports Instagram and TikTok via their oEmbed APIs (no auth required for
 * public posts). Falls back to generic OpenGraph scraping for all other URLs.
 */

export interface ContentMetadata {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  embedHtml: string | null;
}

export interface ContentImporter {
  name: string;
  canHandle(url: string): boolean;
  fetchMetadata(url: string): Promise<ContentMetadata>;
}

/**
 * Strip <script> tags from oEmbed HTML before storage/rendering.
 * The blockquote body is safe; scripts are handled by the platform's embed.js
 * loaded separately when needed.
 */
function stripScriptTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .trim();
}

function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(regex);
  if (match) return match[1];

  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  );
  const match2 = html.match(regex2);
  return match2 ? match2[1] : null;
}

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Generic OpenGraph unfurl — works for most URLs.
 */
export class OpenGraphImporter implements ContentImporter {
  name = "opengraph";

  canHandle(_url: string): boolean {
    return true; // fallback handler
  }

  async fetchMetadata(url: string): Promise<ContentMetadata> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "RoyalFitness/1.0 (Link Preview)",
        },
      });
      clearTimeout(timeout);

      const html = await res.text();

      return {
        url,
        title: extractMeta(html, "og:title") || extractTag(html, "title"),
        description:
          extractMeta(html, "og:description") ||
          extractMeta(html, "description"),
        imageUrl: extractMeta(html, "og:image"),
        siteName: extractMeta(html, "og:site_name"),
        embedHtml: null,
      };
    } catch {
      return {
        url,
        title: null,
        description: null,
        imageUrl: null,
        siteName: null,
        embedHtml: null,
      };
    }
  }
}

/**
 * Instagram oEmbed — uses api.instagram.com/oembed for public posts/reels.
 * Falls back to OpenGraph on error.
 */
export class InstagramImporter implements ContentImporter {
  name = "instagram";

  canHandle(url: string): boolean {
    return /instagram\.com\/(p|reel|tv)\//.test(url);
  }

  async fetchMetadata(url: string): Promise<ContentMetadata> {
    try {
      const oEmbedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(oEmbedUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        const og = new OpenGraphImporter();
        const meta = await og.fetchMetadata(url);
        return { ...meta, siteName: meta.siteName ?? "Instagram" };
      }

      const data = await res.json();
      return {
        url,
        title: data.title ?? null,
        description: null,
        imageUrl: data.thumbnail_url ?? null,
        siteName: data.provider_name ?? "Instagram",
        embedHtml: data.html ? stripScriptTags(data.html) : null,
      };
    } catch {
      const og = new OpenGraphImporter();
      const meta = await og.fetchMetadata(url);
      return { ...meta, siteName: meta.siteName ?? "Instagram" };
    }
  }
}

/**
 * TikTok oEmbed — uses tiktok.com/oembed for public videos.
 * Falls back to OpenGraph on error.
 */
export class TikTokImporter implements ContentImporter {
  name = "tiktok";

  canHandle(url: string): boolean {
    return /tiktok\.com\/@[\w.]+\/video\//.test(url);
  }

  async fetchMetadata(url: string): Promise<ContentMetadata> {
    try {
      const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(oEmbedUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        const og = new OpenGraphImporter();
        const meta = await og.fetchMetadata(url);
        return { ...meta, siteName: meta.siteName ?? "TikTok" };
      }

      const data = await res.json();
      return {
        url,
        title: data.title ?? null,
        description: null,
        imageUrl: data.thumbnail_url ?? null,
        siteName: data.provider_name ?? "TikTok",
        embedHtml: data.html ? stripScriptTags(data.html) : null,
      };
    } catch {
      const og = new OpenGraphImporter();
      const meta = await og.fetchMetadata(url);
      return { ...meta, siteName: meta.siteName ?? "TikTok" };
    }
  }
}

// Registry — add new importers here; OpenGraph must be last (fallback)
const importers: ContentImporter[] = [
  new InstagramImporter(),
  new TikTokImporter(),
  new OpenGraphImporter(),
];

export function getImporterForUrl(url: string): ContentImporter {
  return (
    importers.find((i) => i.canHandle(url)) || importers[importers.length - 1]
  );
}
