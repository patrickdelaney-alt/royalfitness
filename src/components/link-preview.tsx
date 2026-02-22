"use client";

import { HiExternalLink } from "react-icons/hi";

export interface LinkPreviewContent {
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  embedHtml?: string | null;
}

const SITE_COLORS: Record<string, { bg: string; text: string }> = {
  Instagram: { bg: "rgba(225,48,108,0.15)", text: "#e1306c" },
  TikTok: { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.8)" },
};

function SiteBadge({ siteName }: { siteName: string }) {
  const colors = SITE_COLORS[siteName] ?? {
    bg: "rgba(255,255,255,0.08)",
    text: "rgba(255,255,255,0.6)",
  };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: colors.bg, color: colors.text }}
    >
      {siteName}
    </span>
  );
}

export default function LinkPreview({ content }: { content: LinkPreviewContent }) {
  const domain = (() => {
    try {
      return new URL(content.url).hostname.replace(/^www\./, "");
    } catch {
      return content.url;
    }
  })();

  const displaySite = content.siteName || domain;

  // ── oEmbed embed branch ───────────────────────────────────────────────────
  if (content.embedHtml) {
    return (
      <div
        className="rounded-xl overflow-hidden border"
        style={{ background: "#0d0e19", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <SiteBadge siteName={displaySite} />
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-dim hover:text-foreground transition-colors"
            aria-label="Open original post"
          >
            <HiExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div
          className="p-3 [&>blockquote]:!max-w-full [&>blockquote]:!margin-0"
          dangerouslySetInnerHTML={{ __html: content.embedHtml }}
        />
      </div>
    );
  }

  // ── OpenGraph card branch ─────────────────────────────────────────────────
  return (
    <a
      href={content.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden border transition-colors hover:border-white/20"
      style={{ background: "#0d0e19", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {content.imageUrl && (
        <img
          src={content.imageUrl}
          alt={content.title ?? "Link preview"}
          className="w-full max-h-48 object-cover"
        />
      )}
      <div className="px-3 py-2.5 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {content.title && (
              <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                {content.title}
              </p>
            )}
            {content.description && (
              <p className="text-xs text-sub line-clamp-2 mt-0.5">
                {content.description}
              </p>
            )}
          </div>
          <HiExternalLink className="w-4 h-4 text-muted-dim flex-shrink-0 mt-0.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <SiteBadge siteName={displaySite} />
        </div>
      </div>
    </a>
  );
}
