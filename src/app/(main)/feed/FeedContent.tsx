"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { HiSearch } from "react-icons/hi";
import PostCard, { Post } from "@/components/post-card";
import RecommendationCard from "@/components/recommendation-card";
import OnboardingModal, { shouldShowOnboarding } from "@/components/onboarding-modal";

const POST_TYPES = ["ALL", "WORKOUT", "MEAL", "WELLNESS"] as const;


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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setCurrentUserId(s?.user?.id ?? undefined))
      .catch(() => {});
  }, []);

  // Show onboarding modal for new users arriving via ?welcome=1
  useEffect(() => {
    if (searchParams.get("welcome") === "1" && shouldShowOnboarding()) {
      setShowOnboarding(true);
    }
  }, [searchParams]);

  const handleDeletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleEditPost = useCallback((id: string, fields: { caption: string | null; visibility: string; workoutName?: string; mealName?: string; activityType?: string }) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        caption: fields.caption,
        visibility: fields.visibility,
        workoutDetail: fields.workoutName && p.workoutDetail ? { ...p.workoutDetail, workoutName: fields.workoutName } : p.workoutDetail,
        mealDetail: fields.mealName && p.mealDetail ? { ...p.mealDetail, mealName: fields.mealName } : p.mealDetail,
        wellnessDetail: fields.activityType && p.wellnessDetail ? { ...p.wellnessDetail, activityType: fields.activityType } : p.wellnessDetail,
      };
    }));
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
      } catch (err) {
        if (reset) {
          setError(true);
          toast.error("Failed to load posts. Please try again.");
        } else {
          toast.error("Failed to load more posts.");
        }
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
    <>
    {showOnboarding && (
      <OnboardingModal onClose={() => setShowOnboarding(false)} />
    )}
    <div className="max-w-lg mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">👑</span>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Royal
          </h1>
          <span className="text-xs font-medium text-muted-dim">Beta</span>
        </div>
        {/* Search shortcut — always visible at top-right so Explore is reachable
            even if the bottom nav is reshuffled in future changes. */}
        <Link href="/explore" aria-label="Search people and gyms" className="p-1.5 -mr-1">
          <HiSearch className="w-5 h-5" style={{ color: "rgba(255,255,255,0.45)" }} />
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
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center flex-shrink-0 hover:scale-105 active:scale-95"
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, #6360e8, #9b98ff)",
                      color: "#ffffff",
                      boxShadow: "0 0 40px rgba(120,117,255,0.15), 0 8px 24px rgba(0,0,0,0.5)",
                      border: "none",
                      transform: "scale(1.04)",
                    }
                  : {
                      background: "rgba(255,255,255,0.045)",
                      color: "rgba(255,255,255,0.45)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }
              }
            >
              {type === "ALL" ? "All" : type === "WORKOUT" ? "Workouts" : type === "MEAL" ? "Meals" : "Wellness"}
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
              className="rounded-xl border overflow-hidden"
              style={{ background: "#13141f", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className="w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded-full skeleton-shimmer" />
                  <div className="h-2.5 w-16 rounded-full skeleton-shimmer" />
                </div>
              </div>
              <div className="px-4 pb-4 space-y-2.5">
                <div className="h-3 w-full rounded-full skeleton-shimmer" />
                <div className="h-3 w-4/5 rounded-full skeleton-shimmer" />
                <div className="h-24 w-full rounded-xl skeleton-shimmer mt-3" />
              </div>
              <div className="flex gap-4 px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="h-4 w-12 rounded-full skeleton-shimmer" />
                <div className="h-4 w-12 rounded-full skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Failed to load posts.</p>
          <button
            onClick={() => fetchPosts(true)}
            className="mt-3 text-xs underline"
            style={{ color: "#a8a6ff" }}
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-3xl mb-3">👑</p>
          <p className="font-semibold text-white text-base mb-1">Your feed is quiet</p>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Log a workout, meal, or wellness activity to get started.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/create"
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6360e8, #9b98ff)", boxShadow: "0 4px 20px rgba(120,117,255,0.3)" }}
            >
              Log Activity →
            </Link>
            <Link
              href="/explore"
              className="px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
            >
              Find People →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={handleDeletePost} onEdit={handleEditPost} />
          ))}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div
                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "rgba(120,117,255,0.5)", borderTopColor: "transparent" }}
              />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </div>
      )}
    </div>
    </>
  );
}
