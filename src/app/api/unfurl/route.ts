import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";

type ParsedMetadata = {
  ogImage: string | null;
  twitterImage: string | null;
  iconCandidates: string[];
};

type ImageSource = "screenshot" | "og" | "twitter" | "icon" | null;

function extractMetaTag(html: string, property: string): string | null {
  // Match both property="og:xxx" and name="og:xxx" variants
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${property}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || null;
}

function normalizeUrl(candidate: string | null, baseUrl: string): string | null {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

function parseLinkAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attrRegex = /([a-zA-Z:-]+)\s*=\s*["']([^"']*)["']/g;
  let match: RegExpExecArray | null = null;

  while ((match = attrRegex.exec(tag)) !== null) {
    attributes[match[1].toLowerCase()] = match[2];
  }

  return attributes;
}

function extractMetadata(html: string): ParsedMetadata {
  const iconCandidates: string[] = [];
  const seen = new Set<string>();
  const linkTagRegex = /<link\b[^>]*>/gi;
  let linkMatch: RegExpExecArray | null = null;

  while ((linkMatch = linkTagRegex.exec(html)) !== null) {
    const attributes = parseLinkAttributes(linkMatch[0]);
    const rel = (attributes.rel || "").toLowerCase();
    const href = attributes.href;
    if (!href) continue;

    const relValues = rel.split(/\s+/).filter(Boolean);
    const isIconCandidate =
      relValues.includes("icon") ||
      (relValues.includes("shortcut") && relValues.includes("icon")) ||
      relValues.includes("apple-touch-icon");

    if (isIconCandidate && !seen.has(href)) {
      seen.add(href);
      iconCandidates.push(href);
    }
  }

  return {
    ogImage: extractMetaTag(html, "og:image"),
    twitterImage: extractMetaTag(html, "twitter:image"),
    iconCandidates,
  };
}

async function getScreenshotFallbackUrl(targetUrl: string): Promise<string | null> {
  const screenshotProvider = process.env.UNFURL_SCREENSHOT_SERVICE_URL;
  if (!screenshotProvider) return null;

  try {
    const screenshotRequestUrl = new URL(screenshotProvider);
    screenshotRequestUrl.searchParams.set("url", targetUrl);
    const response = await fetch(screenshotRequestUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { imageUrl?: unknown };
    return typeof payload.imageUrl === "string" ? payload.imageUrl : null;
  } catch {
    return null;
  }
}

async function fetchTikTokOEmbed(url: string): Promise<{ title: string | null; imageUrl: string | null }> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "RoyalFitness-Unfurl/1.0" },
    });
    clearTimeout(timeoutId);
    if (!res.ok) return { title: null, imageUrl: null };
    const data = await res.json() as { title?: string; thumbnail_url?: string };
    return {
      title: typeof data.title === "string" ? data.title : null,
      imageUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
    };
  } catch {
    return { title: null, imageUrl: null };
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url, preferScreenshot } = body as {
      url?: unknown;
      preferScreenshot?: unknown;
    };
    const shouldPreferScreenshot = preferScreenshot === true;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing url in request body" },
        { status: 400 }
      );
    }

    // Validate the URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP and HTTPS URLs are supported" },
        { status: 400 }
      );
    }

    // For TikTok, use the public oEmbed API for reliable thumbnail + title
    const isTikTok = /tiktok\.com/.test(parsedUrl.hostname);
    if (isTikTok && !shouldPreferScreenshot) {
      const oembed = await fetchTikTokOEmbed(url);
      if (oembed.imageUrl) {
        return NextResponse.json({
          title: oembed.title,
          description: null,
          imageUrl: oembed.imageUrl,
          siteName: "TikTok",
          imageSource: null,
        });
      }
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let html: string;
    let fetchedPageUrl = parsedUrl.href;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "RoyalFitness-Unfurl/1.0",
          Accept: "text/html",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return NextResponse.json({
          title: null,
          description: null,
          imageUrl: null,
          siteName: null,
          imageSource: null,
        });
      }

      fetchedPageUrl = response.url || parsedUrl.href;
      html = await response.text();
    } catch (fetchError) {
      console.warn("POST /api/unfurl fetch warning:", fetchError);
      return NextResponse.json({
        title: null,
        description: null,
        imageUrl: null,
        siteName: null,
        imageSource: null,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const title =
      extractMetaTag(html, "og:title") || extractTitle(html) || null;
    const description =
      extractMetaTag(html, "og:description") ||
      extractMetaTag(html, "description") ||
      null;
    const siteName = extractMetaTag(html, "og:site_name") || null;
    const parsedMetadata = extractMetadata(html);
    const normalizedOgImage = normalizeUrl(parsedMetadata.ogImage, fetchedPageUrl);
    const normalizedTwitterImage = normalizeUrl(
      parsedMetadata.twitterImage,
      fetchedPageUrl
    );
    const normalizedIconCandidate =
      parsedMetadata.iconCandidates
        .map((candidate) => normalizeUrl(candidate, fetchedPageUrl))
        .find((candidate): candidate is string => Boolean(candidate)) || null;
    let resolvedImageUrl: string | null = null;
    let imageSource: ImageSource = null;

    if (shouldPreferScreenshot) {
      const screenshotUrl = await getScreenshotFallbackUrl(fetchedPageUrl);
      if (screenshotUrl) {
        resolvedImageUrl = screenshotUrl;
        imageSource = "screenshot";
      }
    }

    if (!resolvedImageUrl && normalizedOgImage) {
      resolvedImageUrl = normalizedOgImage;
      imageSource = "og";
    }

    if (!resolvedImageUrl && normalizedTwitterImage) {
      resolvedImageUrl = normalizedTwitterImage;
      imageSource = "twitter";
    }

    if (!resolvedImageUrl && normalizedIconCandidate) {
      resolvedImageUrl = normalizedIconCandidate;
      imageSource = "icon";
    }

    if (!resolvedImageUrl) {
      const screenshotUrl = await getScreenshotFallbackUrl(fetchedPageUrl);
      if (screenshotUrl) {
        resolvedImageUrl = screenshotUrl;
        imageSource = "screenshot";
      }
    }

    return NextResponse.json({
      title,
      description,
      imageUrl: resolvedImageUrl,
      siteName,
      imageSource,
    });
  } catch (error) {
    console.error("POST /api/unfurl error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
