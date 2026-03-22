"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HiLockOpen } from "react-icons/hi2";
import { HiExternalLink, HiX, HiLink, HiClipboardCopy, HiUpload, HiPencil } from "react-icons/hi";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import { AFFILIATE_CATEGORY_TO_DISPLAY, getCatalogDisplayTags } from "@/lib/catalog-tags";
import { isCapacitorNative, openExternalLink } from "@/lib/link-handler";

interface CatalogItem {
  id: string;
  createdAt?: string;
  name: string;
  photoUrl?: string | null;
  link?: string | null;
  referralCode?: string | null;
  notes?: string | null;
  description?: string | null;
  ctaLabel?: string | null;
  logoUrl?: string | null;
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
  category?: string | null;
  subcategoryTags?: string[];
  [key: string]: unknown;
}

interface UserCatalogSectionProps {
  username: string;
  isOwnProfile: boolean;
}

type CatalogType = "meals" | "workouts" | "supplements" | "accessories" | "wellness" | "affiliates";

const CATALOG_TYPES: { type: CatalogType; label: string }[] = [
  { type: "meals", label: "Meals" },
  { type: "workouts", label: "Workouts" },
  { type: "supplements", label: "Supps" },
  { type: "accessories", label: "Gear" },
  { type: "wellness", label: "Wellness" },
  { type: "affiliates", label: "Links" }, // kept for API fetching; display resolved per-item
];

/** For affiliate items, resolve display label from their category field */
const getPublicItemLabel = (item: CatalogItem, type: CatalogType): string => {
  if (type === "affiliates" && item.category) {
    return AFFILIATE_CATEGORY_TO_DISPLAY[item.category as string] ?? "Other";
  }
  const info = CATALOG_TYPES.find((c) => c.type === type);
  return info?.label ?? type;
};

const CATEGORY_GRADIENTS: Record<CatalogType, string> = {
  meals: "from-amber-700/70 to-amber-900/70",
  workouts: "from-green-800/70 to-green-950/70",
  supplements: "from-emerald-700/70 to-emerald-900/70",
  accessories: "from-stone-600/70 to-stone-800/70",
  wellness: "from-lime-700/70 to-lime-900/70",
  affiliates: "from-amber-600/70 to-yellow-800/70",
};

const getPublicCtaLabel = (item: CatalogItem): string => {
  if (item.ctaLabel) return item.ctaLabel;
  if (item.videoUrl && !item.link) return "Watch Video";
  if (item.recipeSourceUrl && !item.link) return "View Recipe";
  if (item.referralCode && item.link) return "Shop with Code";
  if (item.link) return "Open Link";
  return "View Deal";
};

const buildDisplayTags = (item: CatalogItem, type: CatalogType) => {
  return getCatalogDisplayTags({
    tags: item.tags,
    subcategoryTags: type === "affiliates" ? item.subcategoryTags : null,
    brand: item.brand,
    type: type === "accessories" ? item.type : null,
    activityType: type === "wellness" ? item.activityType : null,
  });
};

function DetailModal({
  item,
  type,
  onClose,
  isOwnProfile,
}: {
  item: CatalogItem;
  type: CatalogType;
  onClose: () => void;
  isOwnProfile?: boolean;
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

  const categoryLabel = getPublicItemLabel(item, type);
  const displayTags = buildDisplayTags(item, type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(24,25,15,0.5)" }} />
      <div
        className="relative w-full sm:max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-y-contain rounded-t-2xl sm:rounded-2xl pb-[env(safe-area-inset-bottom)]"
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
        {item.photoUrl || item.logoUrl ? (
          <div className="w-full aspect-square">
            <img
              src={item.photoUrl || item.logoUrl || ""}
              alt={item.name}
              className="w-full h-full object-cover rounded-t-2xl sm:rounded-t-2xl"
            />
          </div>
        ) : (
          <div
            className={`w-full aspect-[4/3] bg-gradient-to-br ${CATEGORY_GRADIENTS[type]} flex items-center justify-center rounded-t-2xl sm:rounded-t-2xl`}
          >
            <span className="text-6xl">{categoryLabel}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 pb-8 space-y-4" style={{ paddingBottom: "calc(2.75rem + env(safe-area-inset-bottom))" }}>
          {/* Title + brand + category */}
          <div>
            <h3 className="text-xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>{item.name}</h3>
            {item.brand && (
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                by {item.brand}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(36,63,22,0.08)", color: "var(--brand)" }}
              >
                {categoryLabel}
              </span>
              {item.type && (
                <span className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(36,63,22,0.06)", color: "var(--text-muted)" }}>
                  {item.type}
                </span>
              )}
              {item.activityType && (
                <span className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(36,63,22,0.06)", color: "var(--text-muted)" }}>
                  {item.activityType}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {displayTags.length > 0 && (
            <SubcategoryChips tags={displayTags} />
          )}

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

          {/* Description (affiliates use description, others use notes) */}
          {item.description && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {item.description}
            </p>
          )}

          {/* Notes */}
          {item.notes && item.notes !== item.description && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {item.notes}
            </p>
          )}

          {/* Referral Code — large CTA for code-only items, inline for code+link */}
          {item.referralCode && !item.link && (
            <div
              className="p-4 rounded-xl text-center"
              style={{ background: "var(--gold-subtle)", border: "1px solid var(--border-gold)" }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                Use this code for a special offer
              </p>
              <p className="text-lg font-bold tracking-wider break-all my-1" style={{ color: "var(--gold)" }}>
                {item.referralCode}
              </p>
              <button
                onClick={copyCode}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all mt-2"
                style={{
                  background: copied ? "rgba(34,197,94,0.12)" : "rgba(36,63,22,0.08)",
                  color: copied ? "#16a34a" : "var(--brand)",
                }}
              >
                <HiClipboardCopy className="inline w-4 h-4 mr-1.5" />
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          )}
          {item.referralCode && item.link && (
            <div>
              <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                Use this code for a special offer
              </p>
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "var(--gold-subtle)", border: "1px solid var(--border-gold)" }}
              >
                <div className="min-w-0 overflow-hidden mr-3">
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Promo Code
                  </p>
                  <p className="text-base font-bold tracking-wider break-all" style={{ color: "var(--gold)" }}>
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
            </div>
          )}

          {/* Shop / Link button + own profile actions */}
          <div
            className="sticky bottom-0 -mx-5 mt-2 px-5 pt-3 space-y-3"
            style={{
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
            }}
          >
            {(item.link || item.recipeSourceUrl || item.videoUrl) && (
              <a
                href={item.link || item.recipeSourceUrl || item.videoUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  const url = item.link || item.recipeSourceUrl || item.videoUrl;
                  if (url && isCapacitorNative()) {
                    e.preventDefault();
                    openExternalLink(url);
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold btn-gradient transition-all"
                style={{ color: "#FDFAF5" }}
              >
                <HiExternalLink className="w-4 h-4" />
                {getPublicCtaLabel(item)}
              </a>
            )}

            {/* Edit / Delete shortcut for own profile */}
            {isOwnProfile && (
              <Link
                href="/catalog"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(82,133,49,0.08)", color: "#528531", border: "1px solid rgba(82,133,49,0.18)" }}
              >
                <HiPencil className="w-4 h-4" />
                Edit or Delete in My Catalog
              </Link>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function UserCatalogSection({
  username,
  isOwnProfile,
}: UserCatalogSectionProps) {
  const [items, setItems] = useState<Array<CatalogItem & { catalogType: CatalogType }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<(CatalogItem & { catalogType: CatalogType }) | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const requests = CATALOG_TYPES.map(async ({ type }) => {
        const params = new URLSearchParams({ limit: "30" });
        const res = await fetch(
          `/api/users/${encodeURIComponent(username)}/catalogs/${type}?${params}`
        );

        if (res.status === 403) {
          throw new Error("PRIVATE_ACCOUNT");
        }

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();
        const key = type === "accessories" ? "accessories" : type;
        const itemsList = data[key] || [];

        if (!Array.isArray(itemsList)) {
          throw new Error("Invalid response format");
        }

        return itemsList.map((item: CatalogItem) => ({
          ...item,
          catalogType: type,
        }));
      });

      const results = await Promise.all(requests);
      const mergedItems = results
        .flat()
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

      setItems(mergedItems);
    } catch (err) {
      if (err instanceof Error && err.message === "PRIVATE_ACCOUNT") {
        setError("This account is private.");
      } else {
        console.error("Failed to fetch catalog:", err);
        setError("Failed to load catalog items");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

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
        <div className="text-center py-10">
          {isOwnProfile ? (
            <>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>No catalog items yet</p>
              <Link
                href="/catalog?upload=true"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-gradient"
                style={{ color: "#ffffff" }}
              >
                <HiUpload className="w-4 h-4" />
                Upload Affiliate Links
              </Link>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Discount codes, referral links &amp; more
              </p>
              <Link
                href="/catalog"
                className="block text-xs mt-2 underline"
                style={{ color: "var(--text-muted)" }}
              >
                Browse all catalog options
              </Link>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No catalog items saved yet.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Instagram Grid */}
          <div className="grid grid-cols-3 gap-0.5">
            {items.map((item) => (
              (() => {
                const tileTags = buildDisplayTags(item, item.catalogType);
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="relative aspect-square overflow-hidden rounded-sm group"
                  >
                    {item.photoUrl || item.logoUrl ? (
                      <img
                        src={item.photoUrl || item.logoUrl || ""}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[item.catalogType as CatalogType]} flex items-center justify-center`}
                      />
                    )}

                    {/* Bottom gradient overlay with name + brand */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                      <p className="text-[10px] font-medium text-white truncate leading-tight">
                        {item.name}
                      </p>
                      {item.brand && (
                        <p className="text-[9px] text-white/70 truncate leading-tight">
                          {item.brand}
                        </p>
                      )}
                    </div>

                    <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1">
                      <span
                        className="text-[9px] leading-none px-1.5 py-1 rounded-full"
                        style={{ background: "rgba(36,63,22,0.8)", color: "#FDFAF5" }}
                      >
                        {getPublicItemLabel(item, item.catalogType)}
                      </span>
                    {/* Compact tag hint */}
                    {tileTags.length > 0 && (
                      <SubcategoryChips
                        tags={tileTags}
                        compact
                        limit={1}
                        className="[&>span]:!bg-black/55 [&>span]:!text-white"
                      />
                    )}
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

                    {/* Pencil badge — visible on own profile to signal editability */}
                    {isOwnProfile && (
                      <div className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-black/50">
                        <HiPencil className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </button>
                );
              })()
            ))}
          </div>

        </>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          type={selectedItem.catalogType}
          onClose={() => setSelectedItem(null)}
          isOwnProfile={isOwnProfile}
        />
      )}
    </div>
  );
}
