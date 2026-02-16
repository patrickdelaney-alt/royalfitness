/**
 * External Content Integration (MVP: link-based)
 *
 * Phase 2: Add real IG/TikTok API integrations.
 */

export interface ContentMetadata {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

export interface ContentImporter {
  name: string;
  canHandle(url: string): boolean;
  fetchMetadata(url: string): Promise<ContentMetadata>;
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
      };
    } catch {
      return { url, title: null, description: null, imageUrl: null, siteName: null };
    }
  }
}

function extractMeta(html: string, property: string): string | null {
  // Match both property="" and name="" attributes
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(regex);
  if (match) return match[1];

  // Try reverse attribute order
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
 * Instagram-specific stub — Phase 2 will use IG oEmbed API.
 */
export class InstagramImporter implements ContentImporter {
  name = "instagram";

  canHandle(url: string): boolean {
    return /instagram\.com/.test(url);
  }

  async fetchMetadata(url: string): Promise<ContentMetadata> {
    // Phase 2: Use Instagram oEmbed API
    // For now, fall back to OpenGraph
    const og = new OpenGraphImporter();
    const metadata = await og.fetchMetadata(url);
    return { ...metadata, siteName: "Instagram" };
  }
}

/**
 * TikTok-specific stub — Phase 2 will use TikTok oEmbed API.
 */
export class TikTokImporter implements ContentImporter {
  name = "tiktok";

  canHandle(url: string): boolean {
    return /tiktok\.com/.test(url);
  }

  async fetchMetadata(url: string): Promise<ContentMetadata> {
    // Phase 2: Use TikTok oEmbed API
    const og = new OpenGraphImporter();
    const metadata = await og.fetchMetadata(url);
    return { ...metadata, siteName: "TikTok" };
  }
}

// Registry — add new importers here
const importers: ContentImporter[] = [
  new InstagramImporter(),
  new TikTokImporter(),
  new OpenGraphImporter(), // fallback, must be last
];

export function getImporterForUrl(url: string): ContentImporter {
  return importers.find((i) => i.canHandle(url)) || importers[importers.length - 1];
}
