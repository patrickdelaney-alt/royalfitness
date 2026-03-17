"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HiLockOpen } from "react-icons/hi2";
import { HiExternalLink, HiX, HiLink, HiClipboardCopy } from "react-icons/hi";

interface CatalogItem {
  id: string;
  name: string;
  photoUrl?: string | null;
  link?: string | null;
  referralCode?: string | null;
  notes?: string | null;
  brand?: string | null;
  dose?: string | null;
  schedule?: string | null;
  type?: string | null;
  activityType?: string | null;
  durationMinutes?: number | null;
  ingredients?: string[];
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  recipeSourceUrl?: string | null;
  videoUrl?: string | null;
  exercisesJson?: string;
  tags?: string[];
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
  { type: "supplements", label: "Supps" },
  { type: "accessories", label: "Gear" },
  { type: "wellness", label: "Wellness" },
];

const CATEGORY_GRADIENTS: Record<CatalogType, string> = {
  meals: "from-orange-600/80 to-red-700/80",
  workouts: "from-blue-600/80 to-indigo-700/80",
  supplements: "from-green-600/80 to-emerald-700/80",
  accessories: "from-purple-600/80 to-pink-700/80",
  wellness: "from-teal-600/80 to-cyan-700/80",
};

function DetailModal({
  item,
  type,
  onClose,
}: {
  item: CatalogItem;
  type: CatalogType;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const copyCode = () => {
    if (item.referralCode) {
      navigator.clipboard.writeText(item.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categoryInfo = CATALOG_TYPES.find((c) => c.type === type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto overscroll-y-contain rounded-t-2xl sm:rounded-2xl"
        style={{
          background: "#13141f",
          border: "1px solid rgba(255,255,255,0.08)",
          WebkitOverflowScrolling: "touch",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}
        >
          <HiX className="w-5 h-5" />
        </button>

        {/* Image */}
        {item.photoUrl ? (
          <div className="w-full aspect-square">
            <img
              src={item.photoUrl}
              alt={item.name}
              className="w-full h-full object-cover rounded-t-2xl sm:rounded-t-2xl"
            />
          </div>
        ) : (
          <div
            className={`w-full aspect-[4/3] bg-gradient-to-br ${CATEGORY_GRADIENTS[type]} flex items-center justify-center rounded-t-2xl sm:rounded-t-2xl`}
          >
            <span className="text-6xl">{categoryInfo?.label}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 pb-8 space-y-4" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          {/* Title + category */}
          <div>
            <h3 className="text-xl font-bold text-white">{item.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(120,117,255,0.12)", color: "#a8a6ff" }}
              >
                {categoryInfo?.label}
              </span>
              {item.brand && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                >
                  {item.brand}
                </span>
              )}
              {item.type && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                >
                  {item.type}
                </span>
              )}
              {item.activityType && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                >
                  {item.activityType}
                </span>
              )}
            </div>
          </div>

          {/* Supplement details */}
          {(item.dose || item.schedule) && (
            <div className="flex gap-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {item.dose && <span>Dose: {item.dose}</span>}
              {item.schedule && <span>Schedule: {item.schedule}</span>}
            </div>
          )}

          {/* Meal macros */}
          {(item.calories || item.protein || item.carbs || item.fat) && (
            <div className="flex gap-3 text-xs flex-wrap" style={{ color: "rgba(255,255,255,0.5)" }}>
              {item.calories != null && <span>{item.calories} cal</span>}
              {item.protein != null && <span>{item.protein}g protein</span>}
              {item.carbs != null && <span>{item.carbs}g carbs</span>}
              {item.fat != null && <span>{item.fat}g fat</span>}
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {item.ingredients.join(", ")}
            </p>
          )}

          {/* Duration */}
          {item.durationMinutes != null && (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {item.durationMinutes} minutes
            </p>
          )}

          {/* Workout exercises */}
          {item.exercisesJson && (() => {
            try {
              const exercises = JSON.parse(item.exercisesJson);
              if (Array.isArray(exercises) && exercises.length > 0) {
                return (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {exercises.map((e: { name: string }) => e.name).join(", ")}
                  </p>
                );
              }
            } catch { /* ignore */ }
            return null;
          })()}

          {/* Notes */}
          {item.notes && (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              {item.notes}
            </p>
          )}

          {/* Referral Code */}
          {item.referralCode && (
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(120,117,255,0.08)", border: "1px solid rgba(120,117,255,0.2)" }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Referral Code
                </p>
                <p className="text-base font-bold tracking-wider" style={{ color: "#a8a6ff" }}>
                  {item.referralCode}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: copied ? "rgba(34,197,94,0.2)" : "rgba(120,117,255,0.15)",
                  color: copied ? "#22c55e" : "#a8a6ff",
                }}
              >
                <HiClipboardCopy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          {/* Shop / Link button */}
          {(item.link || item.recipeSourceUrl || item.videoUrl) && (
            <a
              href={item.link || item.recipeSourceUrl || item.videoUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold btn-gradient transition-all"
              style={{ color: "#ffffff" }}
            >
              <HiExternalLink className="w-4 h-4" />
              {item.link ? "Shop Now" : item.videoUrl ? "Watch Video" : "View Source"}
            </a>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {item.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

  // Count items with links for the tab badge
  const linkedCount = items.filter((i) => i.link || i.referralCode).length;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Catalog</h2>
        {linkedCount > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(120,117,255,0.12)", color: "#a8a6ff" }}
          >
            {linkedCount} product {linkedCount === 1 ? "link" : "links"}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2">
        {CATALOG_TYPES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={
              activeTab === type
                ? { background: "linear-gradient(135deg, #6360e8, #9b98ff)", color: "#ffffff" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
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
        <>
          {/* Instagram Grid */}
          <div className="grid grid-cols-3 gap-0.5">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="relative aspect-square overflow-hidden rounded-sm group"
              >
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[activeTab]} flex items-center justify-center`}
                  />
                )}

                {/* Bottom gradient overlay with name */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                  <p className="text-[10px] font-medium text-white truncate leading-tight">
                    {item.name}
                  </p>
                </div>

                {/* Link/referral badge */}
                {(item.link || item.referralCode) && (
                  <div
                    className="absolute top-1.5 right-1.5 p-1 rounded-full"
                    style={{ background: "rgba(120,117,255,0.85)" }}
                  >
                    <HiLink className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          type={activeTab}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
