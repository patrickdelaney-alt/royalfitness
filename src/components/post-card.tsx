"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { HiHeart, HiOutlineHeart, HiChat, HiClock, HiFire, HiTrash, HiDotsVertical, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { getPostBadge, type BadgeData } from "@/lib/workout-badges";

// ── helpers ──────────────────────────────────────────────────────────────────

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
  WORKOUT: { bg: "rgba(109,106,245,0.15)", text: "#8b88f8", label: "Workout", emoji: "💪" },
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

const EXERCISE_PREVIEW = 3;

function WorkoutSection({ detail }: { detail: WorkoutDetail }) {
  const [showAll, setShowAll] = useState(false);
  const exercises = detail.exercises;
  const visible = showAll ? exercises : exercises.slice(0, EXERCISE_PREVIEW);
  const hasMore = exercises.length > EXERCISE_PREVIEW;

  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-foreground">{detail.workoutName}</span>
        {detail.isClass && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(109,106,245,0.15)", color: "#8b88f8" }}
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
      {exercises.length > 0 && (
        <div className="space-y-1.5">
          {visible.map((ex) => (
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
          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium mt-0.5 transition-all active:scale-[0.98]"
              style={{
                background: "rgba(109,106,245,0.08)",
                border: "1px solid rgba(109,106,245,0.2)",
                color: "#8b88f8",
              }}
            >
              {showAll ? (
                <><HiChevronUp className="w-3.5 h-3.5" /> Show less</>
              ) : (
                <><HiChevronDown className="w-3.5 h-3.5" /> {exercises.length - EXERCISE_PREVIEW} more exercises</>
              )}
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
                  background: "linear-gradient(90deg, #6d6af5, #8b88f8)",
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

      {detail.notes && (
        <p className="text-sub italic">{detail.notes}</p>
      )}
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
}: {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: string) => void;
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

  const badge = TYPE_BADGE[post.type];
  const isOwner = !!currentUserId && currentUserId === post.author.id;

  // ── like toggle ──

  const toggleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    // Optimistic update
    const wasLiked = liked;
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

  // ── render ──

  return (
    <article
      className="rounded-xl overflow-hidden border"
      style={{ background: "#13141f", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* ── header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* avatar */}
        <Link href={`/profile/${post.author.username}`} className="flex-shrink-0">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center text-white text-sm font-bold"
            >
              {initials(post.author.name)}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${post.author.username}`} className="font-semibold text-sm text-foreground truncate hover:underline">
              {post.author.username}
            </Link>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
              style={{ background: badge.bg, color: badge.text }}
            >
              <span>{badge.emoji}</span>
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

        {/* delete menu for post owner */}
        {isOwner && (
          <div className="relative">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-muted-dim hover:text-foreground px-2 py-1 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2 py-1 rounded transition-colors"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-full text-muted-dim hover:text-red-400 transition-colors"
                aria-label="Delete post"
              >
                <HiDotsVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── body ── */}
      <div className="px-4 pb-3">
        {post.caption && (
          <p className="text-sm text-foreground whitespace-pre-wrap mt-1 mb-1">
            {post.caption}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs rounded-full px-2 py-0.5 font-medium"
                style={{ color: "#8b88f8", background: "rgba(109,106,245,0.12)" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {post.mediaUrl ? (
          <div className="mt-2 rounded-lg overflow-hidden">
            {post.mediaUrl.match(/\.(mp4|mov|webm)($|\?)/i) ? (
              <video src={post.mediaUrl} controls className="w-full max-h-96 object-cover" />
            ) : (
              <img src={post.mediaUrl} alt="Post media" className="w-full max-h-96 object-cover" />
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
        className="flex items-center gap-4 px-4 py-3 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          className="flex items-center gap-1.5 text-sm transition-colors"
        >
          {liked ? (
            <HiHeart className="w-5 h-5 text-red-500" />
          ) : (
            <HiOutlineHeart className="w-5 h-5 text-muted-dim" />
          )}
          <span className={liked ? "text-red-500 font-medium" : "text-muted-dim"}>
            {likeCount}
          </span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-muted-dim hover:text-foreground transition-colors"
        >
          <HiChat className="w-5 h-5" />
          <span>{commentCount}</span>
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
              className="input-dark flex-1"
            />
            <button
              onClick={handleAddComment}
              disabled={commentSubmitting || !commentText.trim()}
              className="text-sm font-medium text-white btn-gradient disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-3 py-2 transition-opacity"
            >
              Post
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
