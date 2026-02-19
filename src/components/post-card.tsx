"use client";

import { useState, useCallback } from "react";
import { HiHeart, HiOutlineHeart, HiChat, HiClock, HiFire, HiTrash, HiDotsVertical } from "react-icons/hi";

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

// ── badge colours ────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<Post["type"], { bg: string; text: string; label: string; emoji: string; animation: string }> = {
  WORKOUT: { bg: "bg-[#2563EB]/10", text: "text-[#2563EB]", label: "Workout", emoji: "💪", animation: "animate-workout" },
  MEAL: { bg: "bg-green-100", text: "text-green-700", label: "Meal", emoji: "🥗", animation: "animate-meal" },
  WELLNESS: { bg: "bg-purple-100", text: "text-purple-700", label: "Wellness", emoji: "🧘", animation: "animate-wellness" },
  GENERAL: { bg: "bg-gray-100", text: "text-gray-600", label: "General", emoji: "⭐", animation: "animate-general" },
};

// ── mood emoji helper ────────────────────────────────────────────────────────

function moodLabel(val: number | null): string | null {
  if (val == null) return null;
  if (val <= 2) return "Rough";
  if (val <= 4) return "Meh";
  if (val <= 6) return "OK";
  if (val <= 8) return "Good";
  return "Great";
}

// ── sub-components ───────────────────────────────────────────────────────────

function WorkoutSection({ detail }: { detail: WorkoutDetail }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-foreground">{detail.workoutName}</span>
        {detail.isClass && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Class
          </span>
        )}
        {detail.durationMinutes && (
          <span className="flex items-center gap-1 text-muted">
            <HiClock className="w-3.5 h-3.5" />
            {detail.durationMinutes} min
          </span>
        )}
      </div>

      {/* Exercises */}
      {detail.exercises.length > 0 && (
        <div className="space-y-1.5">
          {detail.exercises.map((ex) => (
            <div key={ex.id} className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="font-medium text-foreground">{ex.name}</p>
              {ex.sets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {ex.sets.map((s, idx) => (
                    <span
                      key={s.id}
                      className="text-xs text-muted bg-white border border-border rounded px-1.5 py-0.5"
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
        </div>
      )}

      {/* Exertion bar + mood */}
      <div className="flex items-center gap-4 flex-wrap">
        {detail.perceivedExertion != null && (
          <div className="flex items-center gap-2">
            <HiFire className="w-4 h-4 text-[#2563EB]" />
            <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2563EB]"
                style={{ width: `${detail.perceivedExertion * 10}%` }}
              />
            </div>
            <span className="text-xs text-muted">{detail.perceivedExertion}/10</span>
          </div>
        )}
        {detail.moodAfter != null && (
          <span className="text-xs text-muted">
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
        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full capitalize">
          {detail.mealType}
        </span>
      </div>

      {/* Ingredients */}
      {detail.ingredients.length > 0 && (
        <p className="text-muted">
          {detail.ingredients.join(", ")}
        </p>
      )}

      {/* Macros grid */}
      {(detail.calories != null ||
        detail.protein != null ||
        detail.carbs != null ||
        detail.fat != null) && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Cal", value: detail.calories, unit: "" },
            { label: "Protein", value: detail.protein, unit: "g" },
            { label: "Carbs", value: detail.carbs, unit: "g" },
            { label: "Fat", value: detail.fat, unit: "g" },
          ].map((m) => (
            <div
              key={m.label}
              className="text-center bg-green-50 rounded-lg py-2 px-1"
            >
              <p className="text-xs text-muted">{m.label}</p>
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
          <span className="flex items-center gap-1 text-muted">
            <HiClock className="w-3.5 h-3.5" />
            {detail.durationMinutes} min
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {detail.intensity != null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Intensity:</span>
            <div className="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${detail.intensity * 10}%` }}
              />
            </div>
            <span className="text-xs text-muted">{detail.intensity}/10</span>
          </div>
        )}
        {detail.moodAfter != null && (
          <span className="text-xs text-muted">
            Mood: {moodLabel(detail.moodAfter)} ({detail.moodAfter}/10)
          </span>
        )}
      </div>

      {detail.notes && (
        <p className="text-muted italic">{detail.notes}</p>
      )}
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
        // Revert
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
        setComments((prev) => [newComment, ...prev]);
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
    <article className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* ── header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* avatar */}
        {post.author.avatarUrl ? (
          <img
            src={post.author.avatarUrl}
            alt={post.author.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold">
            {initials(post.author.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">
              {post.author.username}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${badge.bg} ${badge.text}`}>
              <span className="inline-block transition-transform hover:scale-125 duration-200">{badge.emoji}</span>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
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
                  className="text-xs text-muted hover:text-foreground px-2 py-1 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-2 py-1 rounded transition-colors"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-full text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
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
        {/* caption */}
        {post.caption && (
          <p className="text-sm text-foreground whitespace-pre-wrap mt-1 mb-1">
            {post.caption}
          </p>
        )}

        {/* tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-[#2563EB] bg-[#2563EB]/10 rounded-full px-2 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* media */}
        {post.mediaUrl && (
          <div className="mt-2 rounded-lg overflow-hidden">
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* type-specific detail */}
        {post.type === "WORKOUT" && post.workoutDetail && (
          <WorkoutSection detail={post.workoutDetail} />
        )}
        {post.type === "MEAL" && post.mealDetail && (
          <MealSection detail={post.mealDetail} />
        )}
        {post.type === "WELLNESS" && post.wellnessDetail && (
          <WellnessSection detail={post.wellnessDetail} />
        )}
      </div>

      {/* ── actions ── */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-border">
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          className="flex items-center gap-1.5 text-sm transition-colors hover:text-[#2563EB]"
        >
          {liked ? (
            <HiHeart className="w-5 h-5 text-red-500" />
          ) : (
            <HiOutlineHeart className="w-5 h-5" />
          )}
          <span className={liked ? "text-red-500 font-medium" : "text-muted"}>
            {likeCount}
          </span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <HiChat className="w-5 h-5" />
          <span>{commentCount}</span>
        </button>
      </div>

      {/* ── comments section ── */}
      {showComments && (
        <div className="border-t border-border px-4 py-3 space-y-3">
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
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] bg-background"
            />
            <button
              onClick={handleAddComment}
              disabled={commentSubmitting || !commentText.trim()}
              className="text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-3 py-2 transition-colors"
            >
              Post
            </button>
          </div>

          {/* comments list */}
          {comments.length === 0 && commentsLoaded && (
            <p className="text-xs text-muted text-center py-2">
              No comments yet. Be the first!
            </p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              {c.author.avatarUrl ? (
                <img
                  src={c.author.avatarUrl}
                  alt={c.author.username}
                  className="w-7 h-7 rounded-full object-cover mt-0.5"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white mt-0.5">
                  {initials(c.author.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">
                    {c.author.username}
                  </span>{" "}
                  <span className="text-foreground">{c.text}</span>
                </p>
                <p className="text-xs text-muted mt-0.5">
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
