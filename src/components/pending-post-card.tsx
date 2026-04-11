"use client";

import { useEffect, useState } from "react";
import type { PendingPost } from "@/store/pending-posts";

// Matches TYPE_BADGE in post-card.tsx
const TYPE_BADGE: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  WORKOUT:       { bg: "rgba(13,31,140,0.10)",   text: "#0D1F8C", label: "Workout",      emoji: "💪" },
  MEAL:          { bg: "rgba(42,184,208,0.12)",   text: "#1A7B8A", label: "Meal",         emoji: "🥗" },
  WELLNESS:      { bg: "rgba(26,107,42,0.12)",    text: "#1A6B2A", label: "Wellness",     emoji: "🧘" },
  GENERAL:       { bg: "rgba(36,63,22,0.10)",     text: "#7A7560", label: "General",      emoji: "⭐" },
  CHECKIN:       { bg: "rgba(212,115,90,0.12)",   text: "#A85A42", label: "Check-in",     emoji: "📍" },
};

const TYPE_RING: Record<string, string> = {
  WORKOUT:  "linear-gradient(135deg, rgba(36,63,22,0.6), rgba(168,166,255,0.3))",
  MEAL:     "linear-gradient(135deg, rgba(154,123,46,0.6), rgba(201,168,76,0.3))",
  WELLNESS: "linear-gradient(135deg, rgba(82,133,49,0.6), rgba(36,63,22,0.3))",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface PendingPostCardProps {
  post: PendingPost;
  isFading: boolean;
  onFaded: () => void;
}

export default function PendingPostCard({ post, isFading, onFaded }: PendingPostCardProps) {
  const [progress, setProgress] = useState(5);
  const badge = TYPE_BADGE[post.type] ?? TYPE_BADGE.GENERAL;
  const ring = TYPE_RING[post.type];

  const primaryTitle =
    post.type === "WORKOUT" ? post.workoutDetail?.workoutName :
    post.type === "MEAL"    ? post.mealDetail?.mealName :
    post.type === "WELLNESS"? post.wellnessDetail?.activityType :
    null;

  // Animate progress bar: fast initial burst → slow plateau → 100% on confirm
  useEffect(() => {
    const t1 = setTimeout(() => setProgress(62), 80);
    const t2 = setTimeout(() => setProgress(88), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (isFading) setProgress(100);
  }, [isFading]);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "#FDFAF5",
        borderColor: "rgba(36,63,22,0.10)",
        opacity: isFading ? 0 : 1,
        transform: isFading ? "scale(0.97) translateY(-4px)" : "scale(1) translateY(0)",
        transition: "opacity 0.45s ease-out, transform 0.45s ease-out",
      }}
      onTransitionEnd={(e) => {
        // Only fire once — opacity transition signals the card is fully gone
        if (isFading && e.propertyName === "opacity") onFaded();
      }}
    >
      {/* Progress bar */}
      <div
        className="w-full"
        style={{ height: "3px", background: "rgba(36,63,22,0.08)" }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--brand)",
            transition: "width 0.65s ease-out",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className="p-[2px] rounded-full"
            style={{ background: ring ?? "transparent" }}
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.username}
                className="w-10 h-10 rounded-full object-cover block"
                style={{ display: "block" }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center text-white text-sm font-bold"
              >
                {initials(post.author.name)}
              </div>
            )}
          </div>
        </div>

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
              {post.author.username}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
          </div>
          {/* "Posting..." status row */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
              style={{ background: "var(--brand)" }}
            />
            <span className="text-xs" style={{ color: "var(--brand)" }}>
              Posting...
            </span>
          </div>
        </div>
      </div>

      {/* Primary title (workout name / meal name / activity) */}
      {primaryTitle && (
        <div className="px-4 pb-1">
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text)", opacity: 0.7 }}
          >
            {badge.emoji} {primaryTitle}
          </p>
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p
            className="text-sm"
            style={{ color: "var(--text)", opacity: 0.6, lineHeight: 1.55 }}
          >
            {post.caption}
          </p>
        </div>
      )}

      {/* Media thumbnail */}
      {post.mediaUrl && (
        <div className="px-4 pb-3">
          <div className="rounded-xl overflow-hidden relative" style={{ maxHeight: "280px" }}>
            <img
              src={post.mediaUrl}
              alt=""
              className="w-full object-cover"
              style={{ opacity: 0.65, display: "block" }}
            />
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 skeleton-shimmer"
              style={{ opacity: 0.35 }}
            />
          </div>
        </div>
      )}

      {/* Bottom spacer to match card feel */}
      {!post.caption && !post.mediaUrl && !primaryTitle && (
        <div className="pb-3" />
      )}
    </div>
  );
}
