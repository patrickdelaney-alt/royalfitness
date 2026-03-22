"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HiLockOpen } from "react-icons/hi2";
import type { CatalogItem, CatalogType } from "@/lib/catalog";
import { CATALOG_TYPES, getCatalogAction } from "@/lib/catalog";
import {
  CatalogDetailModal,
  CatalogEmptyState,
  CatalogGridCard,
  CatalogSectionIntro,
} from "@/components/catalog/catalog-ui";

interface UserCatalogSectionProps {
  username: string;
  isOwnProfile: boolean;
}

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
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
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
        const key = activeTab === "accessories" ? "accessories" : activeTab;
        const itemsList = data[key] || [];

        if (!Array.isArray(itemsList)) {
          throw new Error("Invalid response format");
        }

        setItems((prev) => (reset ? itemsList : [...prev, ...itemsList]));
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

  useEffect(() => {
    setItems([]);
    setCursor(undefined);
    setHasMore(true);
    setError(null);
    fetchCatalog(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, username]);

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

  const actionReadyCount = items.filter((item) => getCatalogAction(item, activeTab).kind !== "none").length;

  return (
    <div className="mt-8">
      <CatalogSectionIntro
        title="Catalog"
        subtitle="Curated items, recipes, and workouts with clear next steps."
        countLabel={actionReadyCount > 0 ? `${actionReadyCount} ready to use` : null}
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-2">
        {CATALOG_TYPES.map(({ type, label, emoji }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all"
            style={
              activeTab === type
                ? { background: "linear-gradient(135deg, #6360e8, #9b98ff)", color: "#ffffff" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
            }
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm animate-pulse"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <div className="mb-3">
            <HiLockOpen className="mx-auto h-12 w-12 text-muted" />
          </div>
          <p className="text-sm text-muted">{error}</p>
          {!isOwnProfile && (
            <p className="mt-1 text-xs text-muted">
              Follow this user to see their catalogs
            </p>
          )}
        </div>
      ) : items.length === 0 ? (
        <CatalogEmptyState
          type={activeTab}
          title={`No ${activeTab} saved yet`}
          description="This section is for curated items, links, codes, and useful recommendations."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-0.5">
            {items.map((item) => (
              <CatalogGridCard
                key={item.id}
                item={item}
                type={activeTab}
                onSelect={() => setSelectedItem(item)}
              />
            ))}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </>
      )}

      {selectedItem && (
        <CatalogDetailModal
          item={selectedItem}
          type={activeTab}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
