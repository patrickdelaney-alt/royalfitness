"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { HiSearch } from "react-icons/hi";
import PostCard, { Post } from "@/components/post-card";
import RecommendationCard from "@/components/recommendation-card";
import OnboardingModal, { shouldShowOnboarding } from "@/components/onboarding-modal";
import ReferralAttributionBanner from "@/components/referral-attribution-banner";
import PendingPostCard from "@/components/pending-post-card";
import { usePendingPostsStore } from "@/store/pending-posts";

const POST_TYPES = ["ALL", "WORKOUT", "MEAL", "WELLNESS"] as const;
type PostTypeFilter = typeof POST_TYPES[number];

const normalizeFilter = (value: string | null): PostTypeFilter =>
  POST_TYPES.includes((value ?? "") as PostTypeFilter) ? ((value ?? "ALL") as PostTypeFilter) : "ALL";

const POST_TYPE_LABELS: Record<string, string> = {
  ALL: "All",
  WORKOUT: "Workouts",
  MEAL: "Meals",
  WELLNESS: "Wellness",
};

type FeedPage = { posts: Post[]; nextCursor?: string };

const fetcher = (url: string): Promise<FeedPage> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

export default function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<PostTypeFilter>(normalizeFilter(searchParams.get("filter")));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? undefined;

  const pendingPosts = usePendingPostsStore((s) => s.pendingPosts);
  const removePendingPost = usePendingPostsStore((s) => s.removePendingPost);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  // Build the SWR cache key for each page of the feed.
  // When `filter` changes, getKey changes identity, so SWR treats it as a
  // new cache entry — serving any previously cached results instantly while
  // revalidating in background.
  const getKey = useCallback(
    (pageIndex: number, previousPageData: FeedPage | null): string | null => {
      if (previousPageData && !previousPageData.nextCursor) return null;
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (pageIndex > 0 && previousPageData?.nextCursor) {
        params.set("cursor", previousPageData.nextCursor);
      }
      if (filter !== "ALL") params.set("type", filter);
      return `/api/posts?${params.toString()}`;
    },
    [filter]
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<FeedPage>(getKey, fetcher, {
      // Don't refetch when the tab regains focus — the HTTP Cache-Control
      // header on the API already handles background freshness.
      revalidateOnFocus: false,
      // Don't re-fetch page 1 every time we load a subsequent page; cursor-
      // based pages are stable so re-fetching page 1 would just shift cursors.
      revalidateFirstPage: false,
      // Poll every 5s while a post is pending so the real post shows up
      // quickly even if the browser served a cached feed response.
      refreshInterval: pendingPosts.length > 0 ? 5000 : 0,
    });

  const posts: Post[] = data ? data.flatMap((page) => page.posts) : [];
  const hasMore = data ? !!data[data.length - 1]?.nextCursor : true;
  // True when we're fetching a new page (not the very first load)
  const loadingMore = isValidating && size > 1 && !data?.[size - 1];

  // When the filter changes, reset to page 1 so we don't immediately fire
  // off requests for all previously-loaded pages under the new filter.
  useEffect(() => {
    setSize(1);
  }, [filter, setSize]);

  // Show a toast only when a load-more fails (initial load failure shows the
  // inline error block instead).
  useEffect(() => {
    if (error && posts.length > 0) {
      toast.error("Failed to load more posts.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Show onboarding modal for new users arriving via ?welcome=1
  useEffect(() => {
    if (searchParams.get("welcome") === "1" && shouldShowOnboarding()) {
      setShowOnboarding(true);
    }
  }, [searchParams]);

  // Keep filter state and URL in sync, and normalize unsupported legacy filters.
  useEffect(() => {
    const normalized = normalizeFilter(searchParams.get("filter"));
    if (normalized !== filter) {
      setFilter(normalized);
    }

    if (searchParams.get("filter") && normalized === "ALL") {
      router.replace("/feed", { scroll: false });
    }
  }, [filter, router, searchParams]);

  // Force an immediate revalidation on mount when pending posts exist so the
  // real post shows up as soon as possible rather than waiting for the next poll.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pendingPosts.length > 0) mutate();
  }, []); // intentionally runs once on mount

  // When SWR returns data that contains a pending post's real ID, trigger the
  // fade-out animation. Cleanup (store removal) is handled by onFaded below.
  useEffect(() => {
    if (pendingPosts.length === 0) return;
    const liveIds = new Set(posts.map((p) => p.id));
    pendingPosts.forEach((pp) => {
      if (!fadingIds.has(pp.id) && liveIds.has(pp.id)) {
        setFadingIds((prev) => new Set(prev).add(pp.id));
      }
    });
  }, [posts, pendingPosts, fadingIds]);

  // Optimistically remove a deleted post from every page in the SWR cache.
  const handleDeletePost = useCallback(
    (id: string) => {
      mutate(
        (pages) =>
          pages?.map((page) => ({
            ...page,
            posts: page.posts.filter((p) => p.id !== id),
          })),
        { revalidate: false }
      );
    },
    [mutate]
  );

  // Optimistically apply edits to a post in the SWR cache.
  const handleEditPost = useCallback(
    (
      id: string,
      fields: {
        caption: string | null;
        visibility: string;
        workoutName?: string;
        mealName?: string;
        activityType?: string;
      }
    ) => {
      mutate(
        (pages) =>
          pages?.map((page) => ({
            ...page,
            posts: page.posts.map((p) => {
              if (p.id !== id) return p;
              return {
                ...p,
                caption: fields.caption,
                visibility: fields.visibility,
                workoutDetail:
                  fields.workoutName && p.workoutDetail
                    ? { ...p.workoutDetail, workoutName: fields.workoutName }
                    : p.workoutDetail,
                mealDetail:
                  fields.mealName && p.mealDetail
                    ? { ...p.mealDetail, mealName: fields.mealName }
                    : p.mealDetail,
                wellnessDetail:
                  fields.activityType && p.wellnessDetail
                    ? { ...p.wellnessDetail, activityType: fields.activityType }
                    : p.wellnessDetail,
              };
            }),
          })),
        { revalidate: false }
      );
    },
    [mutate]
  );

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, setSize]);

  return (
    <>
    {showOnboarding && (
      <OnboardingModal onClose={() => setShowOnboarding(false)} />
    )}
    <div className="max-w-lg mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-light tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
            Royal
          </h1>
        </div>
        {/* Search shortcut — always visible at top-right so Explore is reachable
            even if the bottom nav is reshuffled in future changes. */}
        <Link href="/explore" aria-label="Search people and gyms" className="p-1.5 -mr-1">
          <HiSearch className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        </Link>
      </div>

      {/* First-open referral attribution banner — shown once, quiet */}
      <ReferralAttributionBanner />

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
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium flex items-center flex-shrink-0"
              style={{
                ...(isActive
                  ? {
                      background: "var(--brand)",
                      color: "#FDFAF5",
                      boxShadow: "0 2px 10px rgba(36,63,22,0.22)",
                      border: "none",
                      transform: "scale(1.04)",
                    }
                  : {
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }),
                transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              {POST_TYPE_LABELS[type] ?? type}
            </button>
          );
        })}
      </div>

      {/* Recommendation card — shown above posts, dismissible for the day */}
      <RecommendationCard />

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border overflow-hidden"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
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
              <div className="flex gap-4 px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="h-4 w-12 rounded-full skeleton-shimmer" />
                <div className="h-4 w-12 rounded-full skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : error && posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Failed to load posts.</p>
          <button
            onClick={() => mutate()}
            className="mt-3 text-xs underline"
            style={{ color: "var(--brand)" }}
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 && pendingPosts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-2xl mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>Your feed is quiet</p>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
            Log a workout, meal, or wellness activity to get started.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/create"
              className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium"
            >
              Log Activity &rarr;
            </Link>
            <Link
              href="/explore"
              className="btn-secondary px-5 py-2.5 rounded-full text-sm font-medium"
            >
              Find People &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {/* Pending (in-flight) posts always render at the very top */}
          {pendingPosts.map((pp) => (
            <PendingPostCard
              key={pp.id}
              post={pp}
              isFading={fadingIds.has(pp.id)}
              onFaded={() => {
                removePendingPost(pp.id);
                setFadingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(pp.id);
                  return next;
                });
              }}
            />
          ))}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={handleDeletePost} onEdit={handleEditPost} />
          ))}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div
                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "rgba(36,63,22,0.35)", borderTopColor: "transparent" }}
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
