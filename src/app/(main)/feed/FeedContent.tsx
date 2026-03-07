"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HiSearch } from "react-icons/hi";
import PostCard, { Post } from "@/components/post-card";
import RecommendationCard from "@/components/recommendation-card";

const POST_TYPES = ["ALL", "WORKOUT", "MEAL", "WELLNESS"] as const;

const TYPE_EMOJI: Record<string, string> = {
  ALL:     "🏠",
  WORKOUT: "💪",
  MEAL:    "🥗",
  WELLNESS:"🧘",
  GENERAL: "⭐",
};

export default function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<string>(searchParams.get("filter") || "ALL");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setCurrentUserId(s?.user?.id ?? undefined))
      .catch(() => {});
  }, []);

  const handleDeletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const fetchPosts = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        if (!reset && cursor) params.set("cursor", cursor);
        if (filter !== "ALL") params.set("type", filter);

        const res = await fetch(`/api/posts?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        if (reset) {
          setPosts(data.posts);
          setError(false);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        if (reset) setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor, filter]
  );

  // Initial load and filter change
  useEffect(() => {
    setCursor(undefined);
    setHasMore(true);
    setError(false);
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(false);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchPosts]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">👑</span>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            RoyalWellness
          </h1>
          <span className="text-xs font-medium text-muted-dim">Beta</span>
        </div>
        <Link
          href="/explore"
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <HiSearch className="w-5 h-5" style={{ color: "rgba(255,255,255,0.7)" }} />
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2" style={{ scrollbarWidth: "none" }}>
        {POST_TYPES.map((type) => {
          const isActive = filter === type;
          return (
            <button
              key={type}
              onClick={() => {
                setFilter(type);
                const url = type === "ALL" ? "/feed" : `/feed?filter=${type}`;
                router.replace(url, { scroll: false });
              }}
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 flex-shrink-0"
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, #6d6af5 0%, #8b88f8 100%)",
                      color: "#ffffff",
                      boxShadow: "0 8px 24px rgba(109,106,245,0.3)",
                      border: "none",
                    }
                  : {
                      background: "rgba(255,255,255,0.045)",
                      color: "rgba(255,255,255,0.45)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }
              }
            >
              <span>{TYPE_EMOJI[type]}</span>
              {type === "ALL" ? "All" : type === "WELLNESS" ? "Wellness" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}
            </button>
          );
        })}
      </div>

      {/* Recommendation card — shown above posts, dismissible for the day */}
      <RecommendationCard />

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border h-48 animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Failed to load posts.</p>
          <button
            onClick={() => fetchPosts(true)}
            className="mt-3 text-xs underline"
            style={{ color: "#8b88f8" }}
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sub text-sm">No public posts yet.</p>
          <p className="text-muted-dim text-xs mt-1">
            Create a post set to <span style={{ color: "#34d399" }}>Public</span> to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={handleDeletePost} />
          ))}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div
                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "rgba(109,106,245,0.5)", borderTopColor: "transparent" }}
              />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </div>
      )}
    </div>
  );
}
