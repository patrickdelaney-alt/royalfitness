import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url } = body;

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

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let html: string;
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
        return NextResponse.json(
          { error: `Failed to fetch URL: ${response.status}` },
          { status: 422 }
        );
      }

      html = await response.text();
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out" },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 422 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const title =
      extractMetaTag(html, "og:title") || extractTitle(html) || null;
    const description =
      extractMetaTag(html, "og:description") ||
      extractMetaTag(html, "description") ||
      null;
    const imageUrl = extractMetaTag(html, "og:image") || null;
    const siteName = extractMetaTag(html, "og:site_name") || null;

    return NextResponse.json({
      title,
      description,
      imageUrl,
      siteName,
    });
  } catch (error) {
    console.error("POST /api/unfurl error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
