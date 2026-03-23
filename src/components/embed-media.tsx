import React from "react";
import { isCapacitorNative, openExternalLink } from "@/lib/link-handler";

export interface ExternalContentItem {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

type Provider = "instagram" | "tiktok" | "youtube";

function getEmbedMeta(item: ExternalContentItem): { provider: Provider | null; contentId: string | null } {
  if (item.description?.startsWith("embed:")) {
    const [, provider, contentId] = item.description.split(":");
    if (
      (provider === "instagram" || provider === "tiktok" || provider === "youtube") &&
      contentId
    ) {
      return { provider, contentId };
    }
  }

  try {
    const parsed = new URL(item.url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0] || null;
      return { provider: "youtube", contentId: id };
    }
    if (host === "youtube.com" && parsed.pathname === "/watch") {
      return { provider: "youtube", contentId: parsed.searchParams.get("v") };
    }
  } catch {
    return { provider: null, contentId: null };
  }

  return { provider: null, contentId: null };
}

export default function EmbedMedia({ item }: { item: ExternalContentItem }) {
  const meta = getEmbedMeta(item);

  if (meta.provider === "youtube" && meta.contentId) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="relative" style={{ paddingBottom: "56.25%", height: 0 }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${meta.contentId}`}
            title={item.title || "YouTube video"}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  const label = (meta.provider || item.siteName || "Link").toString();

  const externalLinkProps = {
    href: item.url,
    target: "_blank" as const,
    rel: "noreferrer",
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isCapacitorNative()) {
        e.preventDefault();
        openExternalLink(item.url);
      }
    },
  };

  // TikTok / Instagram: show thumbnail with external link-out
  if ((meta.provider === "tiktok" || meta.provider === "instagram") && item.imageUrl) {
    return (
      <a
        {...externalLinkProps}
        className="mt-2 block rounded-lg overflow-hidden relative"
        style={{ border: "1px solid var(--border)" }}
      >
        <img
          src={item.imageUrl}
          alt={item.title || label}
          className="w-full object-cover"
        />
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.65))" }}
        >
          <p className="text-xs font-semibold uppercase" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</p>
          {item.title && (
            <p className="text-sm truncate" style={{ color: "#fff" }}>{item.title}</p>
          )}
        </div>
      </a>
    );
  }

  // Fallback: plain link card (no thumbnail available)
  return (
    <a
      {...externalLinkProps}
      className="mt-2 block rounded-lg p-3"
      style={{ background: "rgba(36,63,22,0.04)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs uppercase" style={{ color: "var(--brand)" }}>{label}</p>
      <p className="text-sm" style={{ color: "var(--text)" }}>
        {item.title || item.url}
      </p>
    </a>
  );
}
