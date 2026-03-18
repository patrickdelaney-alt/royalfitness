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
  meals: "from-amber-700/70 to-amber-900/70",
  workouts: "from-green-800/70 to-green-950/70",
  supplements: "from-emerald-700/70 to-emerald-900/70",
  accessories: "from-stone-600/70 to-stone-800/70",
  wellness: "from-lime-700/70 to-lime-900/70",
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
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(24,25,15,0.5)" }} />
      <div
        className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto overscroll-y-contain rounded-t-2xl sm:rounded-2xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          WebkitOverflowScrolling: "touch",
          boxShadow: "var(--shadow-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full"
          style={{ background: "rgba(24,25,15,0.1)", color: "var(--text-muted)" }}
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
            <h3 className="text-xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>{item.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(36,63,22,0.08)", color: "var(--brand)" }}
              >
                {categoryInfo?.label}
              </span>
              {item.brand && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {item.brand}
                </span>
              )}
              {item.type && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {item.type}
                </span>
              )}
              {item.activityType && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {item.activityType}
                </span>
              )}
            </div>
          </div>

          {/* Supplement details */}
          {(item.dose || item.schedule) && (
            <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              {item.dose && <span>Dose: {item.dose}</span>}
              {item.schedule && <span>Schedule: {item.schedule}</span>}
            </div>
          )}

          {/* Meal macros */}
          {(item.calories || item.protein || item.carbs || item.fat) && (
            <div className="flex gap-3 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
              {item.calories != null && <span>{item.calories} cal</span>}
              {item.protein != null && <span>{item.protein}g protein</span>}
              {item.carbs != null && <span>{item.carbs}g carbs</span>}
              {item.fat != null && <span>{item.fat}g fat</span>}
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {item.ingredients.join(", ")}
            </p>
          )}

          {/* Duration */}
          {item.durationMinutes != null && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {item.durationMinutes} minutes
            </p>
          )}

          {/* Workout exercises */}
          {item.exercisesJson && (() => {
            try {
              const exercises = JSON.parse(item.exercisesJson);
              if (Array.isArray(exercises) && exercises.length > 0) {
                return (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {exercises.map((e: { name: string }) => e.name).join(", ")}
                  </p>
                );
              }
            } catch { /* ignore */ }
            return null;
          })()}

          {/* Notes */}
          {item.notes && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {item.notes}
            </p>
          )}

          {/* Referral Code */}
          {item.referralCode && (
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "var(--gold-subtle)", border: "1px solid var(--border-gold)" }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Referral Code
                </p>
                <p className="text-base font-bold tracking-wider" style={{ color: "var(--gold)" }}>
                  {item.referralCode}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: copied ? "rgba(34,197,94,0.12)" : "rgba(36,63,22,0.08)",
                  color: copied ? "#16a34a" : "var(--brand)",
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
              style={{ color: "#FDFAF5" }}
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
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
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
        <h2 className="text-lg font-normal text-foreground" style={{ fontFamily: "var(--font-display)" }}>Catalog</h2>
        {linkedCount > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--gold-subtle)", color: "var(--gold)" }}
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
                ? { background: "var(--brand)", color: "#FDFAF5" }
                : { background: "var(--surface-2)", color: "var(--text-muted)" }
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
              style={{ background: "var(--surface-2)" }}
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
                    style={{ background: "rgba(36,63,22,0.75)" }}
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
