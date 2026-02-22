"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HiLockOpen } from "react-icons/hi2";

interface CatalogItem {
  id: string;
  name: string;
  photoUrl?: string | null;
  [key: string]: unknown;
}

interface UserCatalogSectionProps {
  username: string;
  isOwnProfile: boolean;
}

type CatalogType = "meals" | "workouts" | "supplements" | "accessories" | "wellness";

const CATALOG_TYPES: { type: CatalogType; label: string }[] = [
  { type: "meals", label: "Meals" },
  { type: "workouts", label: "Workouts" },
  { type: "supplements", label: "Supplements" },
  { type: "accessories", label: "Accessories" },
  { type: "wellness", label: "Wellness" },
];

export default function UserCatalogSection({
  username,
  isOwnProfile,
}: UserCatalogSectionProps) {
  const [activeTab, setActiveTab] = useState<CatalogType>("meals");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchCatalog = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({ limit: "30" });
        if (!reset && cursor) params.set("cursor", cursor);

        const res = await fetch(
          `/api/users/${encodeURIComponent(username)}/catalogs/${activeTab}?${params}`
        );

        if (res.status === 403) {
          setError("This account is private.");
          setItems([]);
          setHasMore(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        // Determine the key based on catalog type
        const key = activeTab === "accessories" ? "accessories" : activeTab;
        const itemsList = data[key] || [];

        if (!Array.isArray(itemsList)) {
          throw new Error("Invalid response format");
        }

        if (reset) {
          setItems(itemsList);
        } else {
          setItems((prev) => [...prev, ...itemsList]);
        }

        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        console.error(`Failed to fetch ${activeTab} catalog:`, err);
        setError("Failed to load catalog items");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [username, activeTab, cursor]
  );

  // Reset and fetch when tab changes
  useEffect(() => {
    setItems([]);
    setCursor(undefined);
    setHasMore(true);
    setError(null);
    fetchCatalog(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, username]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchCatalog(false);
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchCatalog]);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-foreground mb-4">Catalog</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {CATALOG_TYPES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              activeTab === type
                ? "bg-primary text-white"
                : "bg-card text-foreground hover:bg-card/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border h-16 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="mb-3">
            <HiLockOpen className="w-12 h-12 mx-auto text-muted" />
          </div>
          <p className="text-sm text-muted">{error}</p>
          {!isOwnProfile && (
            <p className="text-xs text-muted mt-1">
              Follow this user to see their catalogs
            </p>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted">
            No {activeTab} saved yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              {item.photoUrl ? (
                <img
                  src={item.photoUrl as string}
                  alt={item.name as string}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {item.name}
                </p>
                {("tags" in item &&
                  Array.isArray(item.tags) &&
                  (item.tags as string[]).length > 0) && (
                  <p className="text-xs text-muted truncate">
                    {(item.tags as string[]).join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </div>
      )}
    </div>
  );
}
