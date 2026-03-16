"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { HiHeart, HiOutlineHeart, HiChat, HiClock, HiFire, HiTrash, HiDotsVertical, HiChevronDown, HiChevronUp, HiShare, HiX } from "react-icons/hi";
import { lightImpact } from "@/lib/haptics";
import { getPostBadge, type BadgeData } from "@/lib/workout-badges";

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
  type: "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL";
  caption: string | null;
  mediaUrl: string | null;
  visibility: string;
  tags: string[];
  createdAt: string;
  author: Author;
  workoutDetail: WorkoutDetail | null;
  mealDetail: MealDetail | null;
  wellnessDetail: WellnessDetail | null;
  gym: Gym | null;
  likedByMe: boolean;
  _count: {
    likes: number;
    comments: number;
  };
}

// ── badge colours (dark theme) ────────────────────────────────────────────────

const TYPE_BADGE: Record<Post["type"], { bg: string; text: string; label: string; emoji: string }> = {
  WORKOUT: { bg: "rgba(120,117,255,0.10)", text: "#a8a6ff", label: "Workout", emoji: "💪" },
  MEAL:    { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", label: "Meal",    emoji: "🥗" },
  WELLNESS:{ bg: "rgba(168,85,247,0.12)",  text: "#c084fc", label: "Wellness",emoji: "🧘" },
  GENERAL: { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.45)", label: "General", emoji: "⭐" },
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

function WorkoutSection({ detail }: { detail: WorkoutDetail }) {
  const [showAllExercises, setShowAllExercises] = useState(false);
  const hasMore = detail.exercises.length > EXERCISE_PREVIEW_COUNT;
  const visibleExercises = showAllExercises
    ? detail.exercises
    : detail.exercises.slice(0, EXERCISE_PREVIEW_COUNT);

  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-foreground">{detail.workoutName}</span>
        {detail.isClass && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(120,117,255,0.10)", color: "#a8a6ff" }}
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
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
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
              style={{ color: "#a8a6ff", background: "rgba(120,117,255,0.08)", border: "1px solid rgba(120,117,255,0.20)" }}
            >
              <HiChevronDown className="w-3.5 h-3.5" />
              Show all {detail.exercises.length} exercises
            </button>
          )}

          {hasMore && showAllExercises && (
            <button
              onClick={() => setShowAllExercises(false)}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
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
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${detail.perceivedExertion * 10}%`,
                  background: "linear-gradient(90deg, #6360e8, #9b98ff)",
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

function MealSection({ detail }: { detail: MealDetail }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-foreground">{detail.mealName}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full capitalize"
          style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}
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
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.12)" }}
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

function WellnessSection({ detail }: { detail: WellnessDetail }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-foreground capitalize">
          {detail.activityType}
        </span>
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
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${detail.intensity * 10}%`,
                  background: "linear-gradient(90deg, #a855f7, #c084fc)",
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

// ── WorkoutBadgeCard ─────────────────────────────────────────────────────────

function WorkoutBadgeCard({ badge }: { badge: BadgeData }) {
  return (
    <div
      className="mt-2 rounded-xl overflow-hidden flex flex-col items-center justify-center py-8 px-4 gap-2"
      style={{ background: badge.gradient, minHeight: "180px" }}
    >
      <span style={{ fontSize: "64px", lineHeight: 1, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}>
        {badge.emoji}
      </span>
      <p
        className="font-bold tracking-wide text-center mt-2"
        style={{ color: "#fff", fontSize: "20px", textShadow: "0 1px 4px rgba(0,0,0,0.4)", letterSpacing: "0.04em" }}
      >
        {badge.name.toUpperCase()}
      </p>
      <p
        className="text-center"
        style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}
      >
        {badge.subtitle}
      </p>
    </div>
  );
}

// ── main PostCard ────────────────────────────────────────────────────────────

export default function PostCard({
  post,
  currentUserId,
  onDelete,
  onEdit,
}: {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, fields: { caption: string | null; visibility: string; workoutName?: string; mealName?: string; activityType?: string }) => void;
}) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [likeLoading, setLikeLoading] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(post._count.comments);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
  const isOwner = !!currentUserId && currentUserId === post.author.id;

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
  }, [liked, likeLoading, post.id]);

  // ── load comments ──

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/comments?limit=3`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
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
        post.type === "WORKOUT"  ? "type-border-workout"  :
        post.type === "MEAL"     ? "type-border-meal"     :
        post.type === "WELLNESS" ? "type-border-wellness" :
                                   "type-border-general"
      }`}
      style={{ background: "#13141f", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* ── header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* avatar */}
        <Link href={`/profile/${post.author.username}`} className="flex-shrink-0">
          <div
            className="p-[2px] rounded-full"
            style={{
              background: post.type === "WORKOUT"
                ? "linear-gradient(135deg, rgba(120,117,255,0.6), rgba(168,166,255,0.3))"
                : post.type === "MEAL"
                ? "linear-gradient(135deg, rgba(74,222,128,0.6), rgba(52,211,153,0.3))"
                : post.type === "WELLNESS"
                ? "linear-gradient(135deg, rgba(192,132,252,0.6), rgba(168,85,247,0.3))"
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
                style={{ color: "rgba(255,255,255,0.25)" }}
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
                  style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <button
                    onClick={() => { setShowEditModal(true); setShowOwnerMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    Edit post
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setShowOwnerMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5"
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
              style={{ color: "rgba(255,255,255,0.25)" }}
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
                  style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <button
                    onClick={() => { setShowReportModal(true); setShowModerationMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    Report post
                  </button>
                  <button
                    onClick={() => { setShowBlockConfirm(true); setShowModerationMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5"
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
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8"
            style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h3 className="text-base font-bold text-white mb-1">Report this post</h3>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              Why are you reporting this post?
            </p>
            <div className="space-y-2">
              {["Spam or fake", "Inappropriate content", "Harassment or bullying", "False health information", "Other"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  disabled={moderationLoading}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-between"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {reason}
                  {moderationLoading && <LoadingSpinner />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="mt-4 w-full py-2 rounded-xl text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.4)" }}
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
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBlockConfirm(false); }}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8 text-center"
            style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-base font-bold text-white mb-2">Block @{post.author.username}?</p>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Their posts won&apos;t appear in your feed. You can unblock from their profile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockConfirm(false)}
                disabled={moderationLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
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
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8 space-y-4"
            style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h3 className="text-base font-bold text-white">Edit post</h3>

            {/* Type-specific name field */}
            {post.type !== "GENERAL" && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {post.type === "WORKOUT" ? "Workout name" : post.type === "MEAL" ? "Meal name" : "Activity"}
                </label>
                <input
                  type="text"
                  value={editDetailName}
                  onChange={(e) => setEditDetailName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Caption
              </label>
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
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
                        ? { background: "linear-gradient(135deg,#6360e8,#9b98ff)", color: "#fff" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }
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
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#6360e8,#9b98ff)" }}
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
        {post.caption && (
          <p className="text-sm text-foreground whitespace-pre-wrap mt-1 mb-1">
            {post.caption}
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
        ) : (
          (() => {
            const badge = getPostBadge(post);
            return badge ? <WorkoutBadgeCard badge={badge} /> : null;
          })()
        )}

        {post.type === "WORKOUT"  && post.workoutDetail  && <WorkoutSection  detail={post.workoutDetail}  />}
        {post.type === "MEAL"     && post.mealDetail      && <MealSection     detail={post.mealDetail}      />}
        {post.type === "WELLNESS" && post.wellnessDetail  && <WellnessSection detail={post.wellnessDetail}  />}
      </div>

      {/* ── actions ── */}
      <div
        className="flex items-center gap-5 px-4 py-3.5 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
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

        <button
          onClick={() => {
            const url = `https://royalwellness.app/p/${post.id}`;
            navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
          }}
          className="ml-auto flex items-center gap-1.5 text-sm text-muted-dim hover:text-foreground transition-colors"
          title="Copy share link"
        >
          <HiShare className="w-4 h-4" />
        </button>
      </div>

      {/* ── comments section ── */}
      {showComments && (
        <div
          className="border-t px-4 py-3 space-y-3"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
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
        </div>
      )}
    </article>
  );
}
