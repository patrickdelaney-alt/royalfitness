"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HiHeart, HiOutlineHeart, HiChat, HiClock, HiFire, HiTrash, HiDotsVertical, HiChevronDown, HiChevronUp, HiShare, HiX, HiExternalLink, HiClipboardCopy } from "react-icons/hi";
import { lightImpact } from "@/lib/haptics";
import { AFFILIATE_CATEGORY_LABELS } from "@/lib/catalog-tags";
import { isCapacitorNative, openExternalLink } from "@/lib/link-handler";
import { getPostBadge, type BadgeData } from "@/lib/workout-badges";
import EmbedMedia, { type ExternalContentItem } from "@/components/embed-media";
import { useLikesStore } from "@/store/likes";

// ── helpers ──────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div
      className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin"
      style={{ animation: "spin 0.8s linear infinite" }}
    />
  );
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── types ────────────────────────────────────────────────────────────────────

interface Author {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

interface ExerciseSet {
  id: string;
  reps: number | null;
  weight: number | null;
  unit: string;
  rpe: number | null;
  sortOrder: number;
}

interface Exercise {
  id: string;
  name: string;
  sortOrder: number;
  sets: ExerciseSet[];
}

interface WorkoutDetail {
  id: string;
  workoutName: string;
  isClass: boolean;
  muscleGroups: string[];
  durationMinutes: number | null;
  perceivedExertion: number | null;
  moodAfter: number | null;
  notes: string | null;
  postTiming: string;
  exercises: Exercise[];
}

interface MealDetail {
  id: string;
  mealName: string;
  mealType: string;
  ingredients: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  recipeSourceUrl: string | null;
}

interface WellnessDetail {
  id: string;
  activityType: string;
  durationMinutes: number | null;
  intensity: number | null;
  moodAfter: number | null;
  notes: string | null;
}

interface AffiliateDetail {
  id: string;
  title: string;
  brand: string | null;
  link: string | null;
  referralCode: string | null;
  category: string;
  affiliateItemId: string | null;
}

interface CatalogShareDetail {
  id: string;
  catalogItemId: string;
  catalogItemType: string;
  title: string;
  brand: string | null;
  description: string | null;
  photoUrl: string | null;
  link: string | null;
  referralCode: string | null;
  category: string | null;
  ctaLabel: string | null;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: Author;
}

interface Gym {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  type: "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL" | "CHECKIN" | "AFFILIATE" | "CATALOG_SHARE";
  caption: string | null;
  mediaUrl: string | null;
  visibility: string;
  tags: string[];
  createdAt: string;
  author: Author;
  workoutDetail: WorkoutDetail | null;
  mealDetail: MealDetail | null;
  wellnessDetail: WellnessDetail | null;
  affiliateDetail: AffiliateDetail | null;
  catalogShareDetail: CatalogShareDetail | null;
  externalContent?: ExternalContentItem[];
  gym: Gym | null;
  likedByMe: boolean;
  _count: {
    likes: number;
    comments: number;
  };
}

// ── badge colours (warm light theme) ──────────────────────────────────────────

const TYPE_BADGE: Record<Post["type"], { bg: string; text: string; label: string; emoji: string }> = {
  WORKOUT:       { bg: "rgba(13,31,140,0.10)",   text: "#0D1F8C", label: "Workout",      emoji: "💪" },
  MEAL:          { bg: "rgba(42,184,208,0.12)",   text: "#1A7B8A", label: "Meal",         emoji: "🥗" },
  WELLNESS:      { bg: "rgba(26,107,42,0.12)",    text: "#1A6B2A", label: "Wellness",     emoji: "🧘" },
  GENERAL:       { bg: "rgba(36,63,22,0.10)",     text: "#7A7560", label: "General",      emoji: "⭐" },
  CHECKIN:       { bg: "rgba(212,115,90,0.12)",   text: "#A85A42", label: "Check-in",     emoji: "📍" },
  AFFILIATE:     { bg: "rgba(154,123,46,0.12)",   text: "#9A7B2E", label: "Referral",     emoji: "🔗" },
  CATALOG_SHARE: { bg: "rgba(154,123,46,0.15)",   text: "#9A7B2E", label: "Shared Item",  emoji: "✨" },
};

// ── mood label ────────────────────────────────────────────────────────────────

function moodLabel(val: number | null): string | null {
  if (val == null) return null;
  if (val <= 2) return "Rough";
  if (val <= 4) return "Meh";
  if (val <= 6) return "OK";
  if (val <= 8) return "Good";
  return "Great";
}

// ── sub-components ───────────────────────────────────────────────────────────

const EXERCISE_PREVIEW_COUNT = 4;

function WorkoutSection({ detail, hideTitle = false }: { detail: WorkoutDetail; hideTitle?: boolean }) {
  const [showAllExercises, setShowAllExercises] = useState(false);
  const hasMore = detail.exercises.length > EXERCISE_PREVIEW_COUNT;
  const visibleExercises = showAllExercises
    ? detail.exercises
    : detail.exercises.slice(0, EXERCISE_PREVIEW_COUNT);

  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center gap-3 flex-wrap">
        {!hideTitle && <span className="font-semibold text-foreground">{detail.workoutName}</span>}
        {detail.isClass && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(36,63,22,0.10)", color: "#528531" }}
          >
            Class
          </span>
        )}
        {detail.durationMinutes && (
          <span className="flex items-center gap-1 text-muted-dim">
            <HiClock className="w-3.5 h-3.5" />
            {detail.durationMinutes} min
          </span>
        )}
      </div>

      {/* Exercises */}
      {detail.exercises.length > 0 && (
        <div className="space-y-1.5">
          {visibleExercises.map((ex) => (
            <div key={ex.id} className="bg-surface rounded-lg px-3 py-2 border border-surface">
              <p className="font-medium text-foreground">{ex.name}</p>
              {ex.sets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {ex.sets.map((s, idx) => (
                    <span
                      key={s.id}
                      className="text-xs text-muted-dim rounded px-1.5 py-0.5"
                      style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
                    >
                      Set {idx + 1}
                      {s.reps != null ? `: ${s.reps} reps` : ""}
                      {s.weight != null ? ` @ ${s.weight}${s.unit}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {hasMore && !showAllExercises && (
            <button
              onClick={() => setShowAllExercises(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition-colors"
              style={{ color: "#528531", background: "rgba(36,63,22,0.08)", border: "1px solid rgba(36,63,22,0.20)" }}
            >
              <HiChevronDown className="w-3.5 h-3.5" />
              Show all {detail.exercises.length} exercises
            </button>
          )}

          {hasMore && showAllExercises && (
            <button
              onClick={() => setShowAllExercises(false)}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition-colors"
              style={{ color: "#7A7560", background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
            >
              <HiChevronUp className="w-3.5 h-3.5" />
              Show less
            </button>
          )}
        </div>
      )}

      {/* Exertion bar + mood */}
      <div className="flex items-center gap-4 flex-wrap">
        {detail.perceivedExertion != null && (
          <div className="flex items-center gap-2">
            <HiFire className="w-4 h-4 text-primary" />
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(36,63,22,0.10)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${detail.perceivedExertion * 10}%`,
                  background: "linear-gradient(90deg, #243F16, #528531)",
                }}
              />
            </div>
            <span className="text-xs text-muted-dim">{detail.perceivedExertion}/10</span>
          </div>
        )}
        {detail.moodAfter != null && (
          <span className="text-xs text-muted-dim">
            Mood: {moodLabel(detail.moodAfter)} ({detail.moodAfter}/10)
          </span>
        )}
      </div>
    </div>
  );
}

function MealSection({ detail, hideTitle = false }: { detail: MealDetail; hideTitle?: boolean }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center gap-3 flex-wrap">
        {!hideTitle && <span className="font-semibold text-foreground">{detail.mealName}</span>}
        <span
          className="text-xs px-2 py-0.5 rounded-full capitalize"
          style={{ background: "rgba(154,123,46,0.1)", color: "#9A7B2E" }}
        >
          {detail.mealType}
        </span>
      </div>

      {detail.ingredients.length > 0 && (
        <p className="text-sub">{detail.ingredients.join(", ")}</p>
      )}

      {(detail.calories != null || detail.protein != null || detail.carbs != null || detail.fat != null) && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Cal",     value: detail.calories, unit: ""  },
            { label: "Protein", value: detail.protein,  unit: "g" },
            { label: "Carbs",   value: detail.carbs,    unit: "g" },
            { label: "Fat",     value: detail.fat,      unit: "g" },
          ].map((m) => (
            <div
              key={m.label}
              className="text-center rounded-lg py-2 px-1"
              style={{ background: "rgba(154,123,46,0.08)", border: "1px solid rgba(154,123,46,0.12)" }}
            >
              <p className="text-xs text-muted-dim">{m.label}</p>
              <p className="font-semibold text-foreground text-sm">
                {m.value != null ? `${m.value}${m.unit}` : "--"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WellnessSection({ detail, hideTitle = false }: { detail: WellnessDetail; hideTitle?: boolean }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center gap-3 flex-wrap">
        {!hideTitle && (
          <span className="font-semibold text-foreground capitalize">
            {detail.activityType}
          </span>
        )}
        {detail.durationMinutes != null && (
          <span className="flex items-center gap-1 text-muted-dim">
            <HiClock className="w-3.5 h-3.5" />
            {detail.durationMinutes} min
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {detail.intensity != null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-dim">Intensity:</span>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(36,63,22,0.10)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${detail.intensity * 10}%`,
                  background: "linear-gradient(90deg, #243F16, #528531)",
                }}
              />
            </div>
            <span className="text-xs text-muted-dim">{detail.intensity}/10</span>
          </div>
        )}
        {detail.moodAfter != null && (
          <span className="text-xs text-muted-dim">
            Mood: {moodLabel(detail.moodAfter)} ({detail.moodAfter}/10)
          </span>
        )}
      </div>

    </div>
  );
}

function AffiliateSection({ detail, hideTitle = false }: { detail: AffiliateDetail; hideTitle?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (detail.referralCode) {
      navigator.clipboard.writeText(detail.referralCode);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-3 space-y-2.5 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        {!hideTitle && <span className="font-semibold text-foreground">{detail.title}</span>}
        {detail.brand && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(154,123,46,0.1)", color: "#9A7B2E" }}
          >
            {detail.brand}
          </span>
        )}
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: "rgba(36,63,22,0.08)", color: "#528531" }}
        >
          {AFFILIATE_CATEGORY_LABELS[detail.category] || detail.category}
        </span>
      </div>

      {detail.referralCode && (
        <button
          onClick={copyCode}
          className="flex items-center gap-2 w-full p-3 rounded-xl transition-all"
          style={{
            background: copied ? "rgba(34,197,94,0.08)" : "rgba(154,123,46,0.08)",
            border: `1px solid ${copied ? "rgba(34,197,94,0.2)" : "rgba(154,123,46,0.15)"}`,
          }}
        >
          <div className="flex-1 text-left">
            <p className="text-xs font-medium" style={{ color: "#7A7560" }}>
              {copied ? "Copied!" : "Tap to copy code"}
            </p>
            <p className="text-base font-bold tracking-wider" style={{ color: copied ? "#16a34a" : "#9A7B2E" }}>
              {detail.referralCode}
            </p>
          </div>
          <HiClipboardCopy className="w-5 h-5 flex-shrink-0" style={{ color: copied ? "#16a34a" : "#9A7B2E" }} />
        </button>
      )}

      {detail.link && (
        <a
          href={detail.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (isCapacitorNative()) {
              e.preventDefault();
              openExternalLink(detail.link!);
            }
          }}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold btn-gradient transition-all"
          style={{ color: "#FDFAF5" }}
        >
          <HiExternalLink className="w-4 h-4" />
          Shop Now
        </a>
      )}
    </div>
  );
}

// ── CatalogShareSection ──────────────────────────────────────────────────────
// Renders a shared catalog item as a rich product card within a feed post.
// Designed to be monetization-friendly: image hero → brand → title → CTA.

const CATALOG_TYPE_LABELS: Record<string, string> = {
  MEAL: "Meal", WORKOUT: "Workout", SUPPLEMENT: "Supplement",
  ACCESSORY: "Accessory", WELLNESS: "Wellness", AFFILIATE: "Product",
};

function CatalogShareSection({ detail }: { detail: CatalogShareDetail }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!detail.referralCode) return;
    try {
      await navigator.clipboard.writeText(detail.referralCode);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const el = document.createElement("textarea");
      el.value = detail.referralCode;
      el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      try { document.execCommand("copy"); } catch { /* silent */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const ctaText = detail.ctaLabel ?? "Shop Now";
  const hasLink = typeof detail.link === "string" && detail.link.trim().length > 0;
  const shareLink = hasLink ? detail.link!.trim() : undefined;
  const hasReferralCode = typeof detail.referralCode === "string" && detail.referralCode.trim().length > 0;
  const typeLabel = CATALOG_TYPE_LABELS[detail.catalogItemType] ?? detail.catalogItemType;

  return (
    <div
      className="mt-3 rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(154,123,46,0.22)" }}
    >
      {/* Product image hero */}
      {detail.photoUrl && (
        <div className="w-full overflow-hidden" style={{ maxHeight: "200px" }}>
          <img
            src={detail.photoUrl}
            alt={detail.title}
            loading="lazy"
            className="w-full object-cover"
            style={{ maxHeight: "200px" }}
          />
        </div>
      )}

      {/* Product info body */}
      <div className="p-4 space-y-2.5" style={{ background: "rgba(154,123,46,0.05)" }}>
        {/* Type chip + brand */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: "rgba(154,123,46,0.14)", color: "#9A7B2E" }}
          >
            {typeLabel}
          </span>
          {detail.brand && (
            <span className="text-xs font-semibold" style={{ color: "#9A7B2E" }}>
              {detail.brand}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="font-semibold leading-snug text-foreground" style={{ fontSize: "15px" }}>
          {detail.title}
        </p>

        {/* Description */}
        {detail.description && (
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: "var(--text-muted)" }}
          >
            {detail.description}
          </p>
        )}

        {/* CTA row */}
        {(hasLink || hasReferralCode) && (
          <div className="space-y-2 pt-0.5">
            {hasLink && (
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (shareLink && isCapacitorNative()) {
                    e.preventDefault();
                    openExternalLink(shareLink);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 btn-gradient"
                style={{ color: "#FDFAF5" }}
              >
                <HiExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                {ctaText}
              </a>
            )}
            {hasReferralCode && (
              <button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border"
                style={{
                  background: copied ? "rgba(34,197,94,0.08)" : "rgba(154,123,46,0.08)",
                  borderColor: copied ? "rgba(34,197,94,0.25)" : "rgba(154,123,46,0.22)",
                  color: copied ? "#16a34a" : "#9A7B2E",
                }}
              >
                <HiClipboardCopy className="w-3.5 h-3.5 flex-shrink-0" />
                {copied ? "Copied!" : "Copy Code"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── WorkoutBadgeCard ─────────────────────────────────────────────────────────

function WorkoutBadgeCard({ badge }: { badge: BadgeData }) {
  return (
    <div
      className="mt-2 rounded-xl overflow-hidden flex flex-col items-center justify-center py-8 px-4 gap-2"
      style={{ background: badge.gradient, minHeight: "180px", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}
    >
      <span style={{ fontSize: "64px", lineHeight: 1, filter: "drop-shadow(0 2px 8px rgba(8,18,96,0.18))" }}>
        {badge.emoji}
      </span>
      <div style={{ width: "40%", height: "1px", background: "rgba(255,255,255,0.22)", borderRadius: "999px" }} />
      <p
        className="font-bold text-center mt-2"
        style={{ color: "#FDFAF5", fontSize: "22px", fontFamily: "var(--font-display)", fontStyle: "italic",
                 letterSpacing: "0.08em", textShadow: "0 1px 6px rgba(8,18,96,0.25)" }}
      >
        {badge.name.toUpperCase()}
      </p>
      <p
        className="text-center"
        style={{ color: "rgba(253,250,245,0.75)", fontSize: "13px" }}
      >
        {badge.subtitle}
      </p>
    </div>
  );
}

// ── CheckInPostCard (compact — 1/4 the size of a full post) ──────────────────

function CheckInPostCard({
  post,
  currentUserId,
  onDelete,
  onLike,
}: {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onLike?: (id: string, liked: boolean, likesCount: number) => void;
}) {
  const { likes, setLike } = useLikesStore();
  const checkinOverride = likes[post.id];
  const [liked, setLiked] = useState(checkinOverride?.liked ?? post.likedByMe);
  const [likeCount, setLikeCount] = useState(checkinOverride?.count ?? post._count.likes);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!currentUserId && currentUserId === post.author.id;

  const toggleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    if (!wasLiked) lightImpact();
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likesCount);
        setLike(post.id, data.liked, data.likesCount);
        onLike?.(post.id, data.liked, data.likesCount);
      } else {
        setLiked(wasLiked);
        setLikeCount((c) => c + (wasLiked ? 1 : -1));
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      setLikeLoading(false);
    }
  }, [liked, likeLoading, post.id, onLike, setLike]);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) onDelete?.(post.id);
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [deleting, post.id, onDelete]);

  return (
    <article
      className="rounded-xl border card-hover overflow-hidden"
      style={{ background: "#FDFAF5", borderColor: "rgba(36,63,22,0.10)" }}
    >
      {/* Header row: avatar + username + like + time + delete */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <Link href={`/profile/${post.author.username}`} className="flex-shrink-0">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              loading="lazy"
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full btn-gradient flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials(post.author.name)}
            </div>
          )}
        </Link>

        <Link
          href={`/profile/${post.author.username}`}
          className="flex-1 min-w-0 font-semibold text-sm text-foreground hover:underline truncate"
        >
          {post.author.username}
        </Link>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={toggleLike}
            disabled={likeLoading}
            className="flex items-center gap-1 transition-colors disabled:opacity-60"
            style={{ color: liked ? "#ef4444" : "#7A7560" }}
          >
            {liked ? (
              <HiHeart className="w-3.5 h-3.5" />
            ) : (
              <HiOutlineHeart className="w-3.5 h-3.5" />
            )}
            <span className="text-xs">{likeCount}</span>
          </button>

          <span className="text-xs" style={{ color: "#7A7560" }}>
            {timeAgo(post.createdAt)}
          </span>

          {isOwner && (
            showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="text-xs px-1.5 py-0.5 rounded transition-colors"
                  style={{ color: "#7A7560" }}
                >
                  <HiX className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-medium text-white bg-red-600 px-2 py-0.5 rounded disabled:opacity-60 transition-colors"
                >
                  {deleting ? "..." : "Del"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="transition-colors"
                style={{ color: "#7A7560" }}
                aria-label="Delete post"
              >
                <HiTrash className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t" style={{ borderColor: "rgba(36,63,22,0.08)" }} />

      {/* Body: location + caption — no truncation */}
      <div className="px-3 pt-2 pb-3 space-y-1">
        <p className="text-sm leading-snug">
          <span style={{ color: "#7A7560" }}>was at </span>
          <span className="font-semibold" style={{ color: "#9A7B2E" }}>
            {post.gym ? post.gym.name : "the gym"}
          </span>
          <span className="ml-1">📍</span>
        </p>
        {post.caption && (
          <p className="text-xs leading-relaxed" style={{ color: "#7A7560" }}>
            {post.caption}
          </p>
        )}
      </div>
    </article>
  );
}

// ── FullPostCard (internal — used for WORKOUT / MEAL / WELLNESS / GENERAL) ───

function FullPostCard({
  post,
  currentUserId,
  onDelete,
  onEdit,
  onLike,
}: {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, fields: { caption: string | null; visibility: string; workoutName?: string; mealName?: string; activityType?: string }) => void;
  onLike?: (id: string, liked: boolean, likesCount: number) => void;
}) {
  const { likes, setLike } = useLikesStore();
  const fullOverride = likes[post.id];
  const [liked, setLiked] = useState(fullOverride?.liked ?? post.likedByMe);
  const [likeCount, setLikeCount] = useState(fullOverride?.count ?? post._count.likes);
  const [likeLoading, setLikeLoading] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(post._count.comments);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption ?? "");
  const [editVisibility, setEditVisibility] = useState(post.visibility);
  const [editDetailName, setEditDetailName] = useState(
    post.workoutDetail?.workoutName ?? post.mealDetail?.mealName ?? post.wellnessDetail?.activityType ?? ""
  );

  const [showModerationMenu, setShowModerationMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [moderationLoading, setModerationLoading] = useState(false);

  const badge = TYPE_BADGE[post.type];
  const router = useRouter();
  const isOwner = !!currentUserId && currentUserId === post.author.id;
  const primaryTitle =
    post.type === "WORKOUT" ? post.workoutDetail?.workoutName :
    post.type === "MEAL" ? post.mealDetail?.mealName :
    post.type === "WELLNESS" ? post.wellnessDetail?.activityType :
    post.type === "AFFILIATE" ? post.affiliateDetail?.title :
    post.type === "CATALOG_SHARE" ? post.catalogShareDetail?.title :
    null;

  // ── like toggle ──

  const toggleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    // Optimistic update
    const wasLiked = liked;
    if (!wasLiked) lightImpact();
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likesCount);
        setLike(post.id, data.liked, data.likesCount);
        onLike?.(post.id, data.liked, data.likesCount);
      } else {
        setLiked(wasLiked);
        setLikeCount((c) => c + (wasLiked ? 1 : -1));
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      setLikeLoading(false);
    }
  }, [liked, likeLoading, post.id, onLike, setLike]);

  // ── load comments ──

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/comments?limit=3`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => {
          const serverComments: Comment[] = data.comments ?? [];
          const serverIds = new Set(serverComments.map((c) => c.id));
          const localOnly = prev.filter((c) => !serverIds.has(c.id));
          return [...serverComments, ...localOnly];
        });
        setNextCursor(data.nextCursor);
        if (data.total != null) setCommentCount(data.total);
      }
    } catch {
      // silent fail
    } finally {
      setCommentsLoaded(true);
    }
  }, [commentsLoaded, post.id]);

  const handleToggleComments = useCallback(() => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      loadComments();
    }
  }, [showComments, commentsLoaded, loadComments]);

  // ── load more comments ──

  const loadMoreComments = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/posts/${post.id}/comments?limit=10&cursor=${nextCursor}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => {
          const serverComments: Comment[] = data.comments ?? [];
          const prevIds = new Set(prev.map((c) => c.id));
          return [...prev, ...serverComments.filter((c) => !prevIds.has(c.id))];
        });
        setNextCursor(data.nextCursor);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, post.id]);

  // ── add comment ──

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.ok) {
        const newComment: Comment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setCommentCount((c) => c + 1);
        setCommentText("");
      }
    } catch {
      // silent fail
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentText, commentSubmitting, post.id]);

  // ── delete post ──

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(post.id);
      }
    } catch {
      // silent fail
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [deleting, post.id, onDelete]);

  // ── edit post ──

  const handleEdit = useCallback(async () => {
    if (editSaving) return;
    setEditSaving(true);
    try {
      const body: Record<string, string | null> = {
        caption: editCaption.trim() || null,
        visibility: editVisibility,
      };
      if (post.type === "WORKOUT") body.workoutName = editDetailName.trim();
      if (post.type === "MEAL") body.mealName = editDetailName.trim();
      if (post.type === "WELLNESS") body.activityType = editDetailName.trim();

      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowEditModal(false);
        onEdit?.(post.id, {
          caption: editCaption.trim() || null,
          visibility: editVisibility,
          workoutName: post.type === "WORKOUT" ? editDetailName.trim() : undefined,
          mealName: post.type === "MEAL" ? editDetailName.trim() : undefined,
          activityType: post.type === "WELLNESS" ? editDetailName.trim() : undefined,
        });
      }
    } catch {
      // silent
    } finally {
      setEditSaving(false);
    }
  }, [editSaving, editCaption, editVisibility, editDetailName, post.id, post.type, onEdit]);

  // ── report post ──

  const handleReport = useCallback(async (reason: string) => {
    if (moderationLoading) return;
    setModerationLoading(true);
    try {
      await fetch(`/api/posts/${post.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
    } catch {
      // silent
    } finally {
      setModerationLoading(false);
      setShowReportModal(false);
      setShowModerationMenu(false);
    }
  }, [moderationLoading, post.id]);

  // ── block user ──

  const handleBlock = useCallback(async () => {
    if (moderationLoading) return;
    setModerationLoading(true);
    try {
      const res = await fetch("/api/social/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: post.author.id }),
      });
      if (res.ok) {
        onDelete?.(post.id);
      }
    } catch {
      // silent
    } finally {
      setModerationLoading(false);
      setShowBlockConfirm(false);
      setShowModerationMenu(false);
    }
  }, [moderationLoading, post.author.id, post.id, onDelete]);

  // ── render ──

  return (
    <article
      className={`rounded-xl border card-hover ${
        post.type === "WORKOUT"       ? "type-border-workout"   :
        post.type === "MEAL"          ? "type-border-meal"      :
        post.type === "WELLNESS"      ? "type-border-wellness"  :
        post.type === "AFFILIATE"     ? "type-border-meal"      :
        post.type === "CATALOG_SHARE" ? "type-border-meal"      :
                                        "type-border-general"
      }`}
      style={{ background: "#FDFAF5", borderColor: "rgba(36,63,22,0.10)" }}
    >
      {/* ── header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* avatar */}
        <Link href={`/profile/${post.author.username}`} className="flex-shrink-0">
          <div
            className="p-[2px] rounded-full"
            style={{
              background: post.type === "WORKOUT"
                ? "linear-gradient(135deg, rgba(36,63,22,0.6), rgba(168,166,255,0.3))"
                : post.type === "MEAL"
                ? "linear-gradient(135deg, rgba(154,123,46,0.6), rgba(201,168,76,0.3))"
                : post.type === "WELLNESS"
                ? "linear-gradient(135deg, rgba(82,133,49,0.6), rgba(36,63,22,0.3))"
                : "transparent",
            }}
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.username}
                loading="lazy"
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
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${post.author.username}`} className="font-semibold text-sm text-foreground truncate hover:underline">
              {post.author.username}
            </Link>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-dim">
            <span>{timeAgo(post.createdAt)}</span>
            {post.gym && (
              <>
                <span>·</span>
                <span>at {post.gym.name}</span>
              </>
            )}
          </div>
        </div>

        {/* owner menu */}
        {isOwner && (
          <div className="relative">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="text-xs text-muted-dim hover:text-foreground px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-2 py-1 rounded transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <>
                      <LoadingSpinner />
                      <span>Deleting</span>
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowOwnerMenu((v) => !v)}
                className="p-1.5 rounded-full transition-colors"
                style={{ color: "#7A7560" }}
                aria-label="Post options"
              >
                <HiDotsVertical className="w-4 h-4" />
              </button>
            )}
            {showOwnerMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOwnerMenu(false)} />
                <div
                  className="absolute right-0 top-8 z-20 w-36 rounded-xl overflow-hidden shadow-xl"
                  style={{ background: "#FDFAF5", border: "1px solid rgba(36,63,22,0.10)" }}
                >
                  <button
                    onClick={() => {
                      if (post.type === "CATALOG_SHARE") {
                        setShowEditModal(true);
                      } else {
                        router.push(`/create?editPostId=${post.id}`);
                      }
                      setShowOwnerMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    style={{ color: "#18190F" }}
                  >
                    Edit post
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setShowOwnerMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    style={{ color: "#f87171" }}
                  >
                    Delete post
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* moderation menu for non-owners */}
        {!isOwner && !!currentUserId && (
          <div className="relative">
            <button
              onClick={() => setShowModerationMenu((v) => !v)}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: "#7A7560" }}
              aria-label="Post options"
            >
              <HiDotsVertical className="w-4 h-4" />
            </button>
            {showModerationMenu && (
              <>
                {/* backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowModerationMenu(false)}
                />
                <div
                  className="absolute right-0 top-8 z-20 w-44 rounded-xl overflow-hidden shadow-xl"
                  style={{ background: "#FDFAF5", border: "1px solid rgba(36,63,22,0.10)" }}
                >
                  <button
                    onClick={() => { setShowReportModal(true); setShowModerationMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    style={{ color: "#18190F" }}
                  >
                    Report post
                  </button>
                  <button
                    onClick={() => { setShowBlockConfirm(true); setShowModerationMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    style={{ color: "#f87171" }}
                  >
                    Block @{post.author.username}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── report modal ── */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: "rgba(24,25,15,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8"
            style={{ background: "#FDFAF5", border: "1px solid rgba(36,63,22,0.10)" }}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: "#18190F" }}>Report this post</h3>
            <p className="text-xs mb-4" style={{ color: "#7A7560" }}>
              Why are you reporting this post?
            </p>
            <div className="space-y-2">
              {["Spam or fake", "Inappropriate content", "Harassment or bullying", "False health information", "Other"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  disabled={moderationLoading}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-between"
                  style={{ background: "rgba(36,63,22,0.04)", color: "#18190F", border: "1px solid rgba(36,63,22,0.10)" }}
                >
                  {reason}
                  {moderationLoading && <LoadingSpinner />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="mt-4 w-full py-2 rounded-xl text-sm font-medium"
              style={{ color: "#7A7560" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── block confirm ── */}
      {showBlockConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: "rgba(24,25,15,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBlockConfirm(false); }}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8 text-center"
            style={{ background: "#FDFAF5", border: "1px solid rgba(36,63,22,0.10)" }}
          >
            <p className="text-base font-bold mb-2" style={{ color: "#18190F" }}>Block @{post.author.username}?</p>
            <p className="text-sm mb-5" style={{ color: "#7A7560" }}>
              Their posts won&apos;t appear in your feed. You can unblock from their profile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockConfirm(false)}
                disabled={moderationLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                style={{ background: "rgba(36,63,22,0.04)", color: "#7A7560" }}
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={moderationLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
                style={{ background: "#dc2626" }}
              >
                {moderationLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Blocking</span>
                  </>
                ) : (
                  "Block"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── edit modal ── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: "rgba(24,25,15,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8 space-y-4"
            style={{ background: "#FDFAF5", border: "1px solid rgba(36,63,22,0.10)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "#18190F" }}>Edit post</h3>

            {/* Catalog item preview (read-only) */}
            {post.type === "CATALOG_SHARE" && post.catalogShareDetail && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(154,123,46,0.08)", border: "1px solid rgba(154,123,46,0.18)" }}
              >
                {post.catalogShareDetail.photoUrl && (
                  <img
                    src={post.catalogShareDetail.photoUrl}
                    alt={post.catalogShareDetail.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: "#18190F" }}>
                    {post.catalogShareDetail.title}
                  </p>
                  {post.catalogShareDetail.brand && (
                    <p className="text-xs truncate" style={{ color: "#7A7560" }}>
                      {post.catalogShareDetail.brand}
                    </p>
                  )}
                  <span
                    className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ background: "rgba(154,123,46,0.15)", color: "#9A7B2E" }}
                  >
                    {CATALOG_TYPE_LABELS[post.catalogShareDetail.catalogItemType] ?? post.catalogShareDetail.catalogItemType}
                  </span>
                </div>
              </div>
            )}

            {/* Type-specific name field */}
            {post.type !== "GENERAL" && post.type !== "CATALOG_SHARE" && post.type !== "CHECKIN" && post.type !== "AFFILIATE" && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#7A7560" }}>
                  {post.type === "WORKOUT" ? "Workout name" : post.type === "MEAL" ? "Meal name" : "Activity"}
                </label>
                <input
                  type="text"
                  value={editDetailName}
                  onChange={(e) => setEditDetailName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)", color: "#18190F" }}
                />
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#7A7560" }}>
                Caption
              </label>
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)", color: "#18190F" }}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#7A7560" }}>
                Visibility
              </label>
              <div className="flex gap-2">
                {(["PUBLIC", "FOLLOWERS", "PRIVATE"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setEditVisibility(v)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={
                      editVisibility === v
                        ? { background: "#243F16", color: "#FDFAF5" }
                        : { background: "rgba(36,63,22,0.04)", color: "#7A7560" }
                    }
                  >
                    {v === "PUBLIC" ? "Public" : v === "FOLLOWERS" ? "Followers" : "Private"}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                style={{ background: "rgba(36,63,22,0.04)", color: "#7A7560" }}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
                style={{ background: "#243F16" }}
              >
                {editSaving ? (
                  <>
                    <LoadingSpinner />
                    <span>Saving</span>
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── body ── */}
      <div className="px-4 pb-3">
        {/* Title shown inline for non-catalog-share types; CATALOG_SHARE renders title inside its own card */}
        {primaryTitle && post.type !== "CATALOG_SHARE" && (
          <p className="text-sm text-foreground whitespace-pre-wrap mt-1 mb-1">
            {primaryTitle}
          </p>
        )}

        {post.mediaUrl ? (
          <div className="mt-2 rounded-lg overflow-hidden">
            {post.mediaUrl.match(/\.(mp4|mov|webm)($|\?)/i) ? (
              <video src={post.mediaUrl} controls className="w-full max-h-96 object-cover" />
            ) : (
              <img
                src={post.mediaUrl}
                alt="Post media"
                loading="lazy"
                className="w-full max-h-96 object-cover"
                style={{ maxHeight: "384px" }}
              />
            )}
          </div>
        ) : post.externalContent?.[0] ? null : (
          (() => {
            const badge = getPostBadge(post);
            return badge ? <WorkoutBadgeCard badge={badge} /> : null;
          })()
        )}

        {post.externalContent?.[0] && <EmbedMedia item={post.externalContent[0]} />}

        {post.type === "WORKOUT"       && post.workoutDetail      && <WorkoutSection detail={post.workoutDetail} hideTitle={!!primaryTitle} />}
        {post.type === "MEAL"          && post.mealDetail         && <MealSection detail={post.mealDetail} hideTitle={!!primaryTitle} />}
        {post.type === "WELLNESS"      && post.wellnessDetail     && <WellnessSection detail={post.wellnessDetail} hideTitle={!!primaryTitle} />}
        {post.type === "AFFILIATE"     && post.affiliateDetail    && <AffiliateSection detail={post.affiliateDetail} hideTitle={!!primaryTitle} />}
        {post.type === "CATALOG_SHARE" && post.catalogShareDetail && <CatalogShareSection detail={post.catalogShareDetail} />}

        {post.caption && (
          <p className="text-sm text-foreground whitespace-pre-wrap mt-3 mb-1">
            {post.caption}
          </p>
        )}
      </div>

      {/* ── actions ── */}
      <div
        className="flex items-center gap-5 px-4 py-3.5 border-t"
        style={{ borderColor: "rgba(36,63,22,0.08)" }}
      >
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          className="flex items-center gap-1.5 text-sm transition-all duration-200 disabled:opacity-70 hover:scale-105 active:scale-95"
        >
          {likeLoading ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : liked ? (
            <HiHeart className="w-5 h-5 text-red-500 transition-transform duration-300" style={{ transform: "scale(1.1)" }} />
          ) : (
            <HiOutlineHeart className="w-5 h-5 text-muted-dim hover:text-foreground transition-colors duration-200" />
          )}
          <span className={`transition-colors duration-200 ${liked ? "text-red-500 font-medium" : "text-muted-dim"}`}>
            {likeCount}
          </span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-muted-dim hover:text-foreground transition-colors duration-200"
        >
          <HiChat className="w-5 h-5" />
          <span>{commentCount}</span>
        </button>

        {/* Share — own posts only. Shares the public post URL so iMessage previews the OG card. */}
        {isOwner && (
          <button
            onClick={async () => {
              if (linkLoading) return;
              setLinkLoading(true);
              try {
                // Fire-and-forget referral attribution — don't block on it
                fetch("/api/referral-links", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sourceType: "post", sourceId: post.id }),
                }).catch(() => {});

                const url = `https://royalwellness.app/p/${post.id}`;
                if (navigator.share) {
                  await navigator.share({ url });
                } else {
                  await navigator.clipboard.writeText(url);
                  toast.success("Link copied");
                  return;
                }
                toast.success("Shared!");
              } catch (err) {
                // AbortError means the user dismissed the share sheet — not an error
                if (err instanceof Error && err.name === "AbortError") return;
                toast.error("Something went wrong");
              } finally {
                setLinkLoading(false);
              }
            }}
            disabled={linkLoading}
            className="ml-auto flex items-center gap-1.5 text-sm text-muted-dim hover:text-foreground transition-colors disabled:opacity-50"
            title="Share"
          >
            <HiShare className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── comments section ── */}
      {showComments && (
        <div
          className="border-t px-4 py-3 space-y-3"
          style={{ borderColor: "rgba(36,63,22,0.08)" }}
        >
          {/* comment input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              placeholder="Add a comment..."
              disabled={commentSubmitting}
              className="input-dark flex-1 disabled:opacity-50"
            />
            <button
              onClick={handleAddComment}
              disabled={commentSubmitting || !commentText.trim()}
              className="text-sm font-medium text-white btn-gradient disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-3 py-2 transition-all duration-200 flex items-center justify-center gap-1.5 min-w-[60px]"
            >
              {commentSubmitting ? (
                <LoadingSpinner />
              ) : (
                "Post"
              )}
            </button>
          </div>

          {comments.length === 0 && commentsLoaded && (
            <p className="text-xs text-muted-dim text-center py-2">
              No comments yet. Be the first!
            </p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Link href={`/profile/${c.author.username}`} className="flex-shrink-0">
                {c.author.avatarUrl ? (
                  <img
                    src={c.author.avatarUrl}
                    alt={c.author.username}
                    loading="lazy"
                    className="w-7 h-7 rounded-full object-cover mt-0.5"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full btn-gradient flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  >
                    {initials(c.author.name)}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <Link href={`/profile/${c.author.username}`} className="font-semibold text-foreground hover:underline">
                    {c.author.username}
                  </Link>{" "}
                  <span className="text-foreground">{c.text}</span>
                </p>
                <p className="text-xs text-muted-dim mt-0.5">
                  {timeAgo(c.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {nextCursor && (
            <button
              onClick={loadMoreComments}
              disabled={loadingMore}
              className="text-xs text-muted-dim hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more comments"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// ── PostCard (public export) — routes to compact or full card ─────────────────

export default function PostCard({
  post,
  currentUserId,
  onDelete,
  onEdit,
  onLike,
}: {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, fields: { caption: string | null; visibility: string; workoutName?: string; mealName?: string; activityType?: string }) => void;
  onLike?: (id: string, liked: boolean, likesCount: number) => void;
}) {
  if (post.type === "CHECKIN") {
    return (
      <CheckInPostCard
        post={post}
        currentUserId={currentUserId}
        onDelete={onDelete}
        onLike={onLike}
      />
    );
  }
  return (
    <FullPostCard
      post={post}
      currentUserId={currentUserId}
      onDelete={onDelete}
      onEdit={onEdit}
      onLike={onLike}
    />
  );
}
