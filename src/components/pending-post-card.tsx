"use client";

import Link from "next/link";
import type { PendingPost } from "@/store/pending-posts";

interface PendingPostCardProps {
  post: PendingPost;
  onRefresh: () => void;
  onDismiss: () => void;
}

export default function PendingPostCard({ post, onRefresh, onDismiss }: PendingPostCardProps) {
  const waiting = post.reconciliationStatus === "reconciling";

  return (
    <article
      className="rounded-xl border overflow-hidden motion-reduce:transition-none"
      style={{ background: "#FDFAF5", borderColor: "rgba(36,63,22,0.10)" }}
      aria-label={`Pending post by ${post.author.username}`}
    >
      {waiting && (
        <div
          role="progressbar"
          aria-label="Waiting for the feed to refresh"
          className="h-[3px] w-full overflow-hidden"
          style={{ background: "rgba(36,63,22,0.08)" }}
        >
          <div className="h-full w-1/3 bg-[var(--brand)] animate-pulse motion-reduce:animate-none" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{post.author.username}</p>
            <p className="mt-1 text-xs" aria-live="polite" style={{ color: "var(--text-muted)" }}>
              {waiting
                ? "Adding to your feed…"
                : "Your post was saved, but the feed hasn’t refreshed yet."}
            </p>
          </div>
          <button type="button" onClick={onDismiss} aria-label="Dismiss saved post notice" className="min-h-11 min-w-11 text-sm">
            Dismiss
          </button>
        </div>
        {post.caption && <p className="mt-3 text-sm" style={{ color: "var(--text)" }}>{post.caption}</p>}
        {!waiting && (
          <div
            className="flex flex-wrap gap-2 mt-4 pb-[max(0px,env(safe-area-inset-bottom))]"
            role="group"
            aria-label="Post recovery actions"
          >
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh feed and try to find your saved post"
              className="btn-secondary min-h-11 px-4 rounded-full text-sm"
            >
              Refresh feed
            </button>
            <Link
              href={`/posts/${post.id}`}
              aria-label="View your saved post"
              className="btn-primary min-h-11 px-4 rounded-full text-sm inline-flex items-center"
            >
              View post
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
