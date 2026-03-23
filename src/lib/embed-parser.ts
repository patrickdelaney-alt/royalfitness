export type EmbedProvider = "instagram" | "tiktok" | "youtube";

export interface ParsedEmbed {
  provider: EmbedProvider;
  url: string;
  contentId: string;
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function normalizeUrl(url: URL): string {
  return url.toString();
}

function parseInstagram(url: URL): ParsedEmbed | null {
  const host = normalizeHostname(url.hostname);
  if (host !== "instagram.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const kind = parts[0];
  if (kind !== "p" && kind !== "reel") return null;

  const contentId = parts[1];
  if (!contentId) return null;

  return {
    provider: "instagram",
    url: normalizeUrl(url),
    contentId,
  };
}

function parseTikTok(url: URL): ParsedEmbed | null {
  const host = normalizeHostname(url.hostname);
  if (host !== "tiktok.com" && host !== "vm.tiktok.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);

  // Standard format: /@username/video/{id}
  const videoIndex = parts.indexOf("video");
  if (videoIndex >= 0 && parts[videoIndex + 1]) {
    return { provider: "tiktok", url: normalizeUrl(url), contentId: parts[videoIndex + 1] };
  }

  // Short link: vm.tiktok.com/{code}
  if (host === "vm.tiktok.com" && parts[0]) {
    return { provider: "tiktok", url: normalizeUrl(url), contentId: parts[0] };
  }

  // Share link: tiktok.com/t/{code}
  const tIndex = parts.indexOf("t");
  if (tIndex >= 0 && parts[tIndex + 1]) {
    return { provider: "tiktok", url: normalizeUrl(url), contentId: parts[tIndex + 1] };
  }

  return null;
}

function parseYouTube(url: URL): ParsedEmbed | null {
  const host = normalizeHostname(url.hostname);

  if (host === "youtu.be") {
    const contentId = url.pathname.split("/").filter(Boolean)[0];
    if (!contentId) return null;
    return {
      provider: "youtube",
      url: normalizeUrl(url),
      contentId,
    };
  }

  if (host !== "youtube.com" && host !== "m.youtube.com") return null;

  if (url.pathname === "/watch") {
    const contentId = url.searchParams.get("v");
    if (!contentId) return null;
    return {
      provider: "youtube",
      url: normalizeUrl(url),
      contentId,
    };
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "shorts" && parts[1]) {
    return {
      provider: "youtube",
      url: normalizeUrl(url),
      contentId: parts[1],
    };
  }

  return null;
}

export function parseEmbedUrl(rawUrl: string): ParsedEmbed | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return null;
  }

  return parseInstagram(parsed) ?? parseTikTok(parsed) ?? parseYouTube(parsed);
}
