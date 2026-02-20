"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PostCard, { Post } from "@/components/post-card";

const POST_TYPES = ["ALL", "WORKOUT", "MEAL", "WELLNESS", "GENERAL"] as const;

const TYPE_EMOJI: Record<string, string> = {
  ALL: "🏠",
  WORKOUT: "💪",
  MEAL: "🥗",
  WELLNESS: "🧘",
  GENERAL: "⭐",
};

export default function FeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        // silent fail
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
        <h1 className="text-xl font-bold text-foreground">
          <span className="text-primary">Royal</span>Wellness <span className="text-xs font-normal text-muted">Beta</span>
        </h1>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
        {POST_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => {
              setFilter(type);
              const url = type === "ALL" ? "/feed" : `/feed?filter=${type}`;
              router.replace(url, { scroll: false });
            }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
              filter === type
                ? "bg-primary text-white scale-105 shadow-sm"
                : "bg-gray-100 text-muted hover:bg-gray-200 hover:scale-105"
            }`}
          >
            <span className={`transition-transform duration-300 ${filter === type ? "scale-110" : ""}`}>
              {TYPE_EMOJI[type]}
            </span>
            {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border h-48 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No posts yet.</p>
          <p className="text-muted text-xs mt-1">
            Follow people or create your first post!
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={handleDeletePost} />
          ))}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </div>
      )}
    </div>
  );
}
