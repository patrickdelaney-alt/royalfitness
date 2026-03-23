/* ── Shared catalog configuration ────────────────────────────────────── */

export const CATALOG_TABS = [
  "meals", "workouts", "supplements", "accessories", "wellness", "affiliates",
] as const;

export type CatalogTab = (typeof CATALOG_TABS)[number];

export const CATALOG_ENDPOINTS: Record<CatalogTab, string> = {
  meals: "/api/catalog/meals",
  workouts: "/api/catalog/workouts",
  supplements: "/api/catalog/supplements",
  accessories: "/api/catalog/accessories",
  wellness: "/api/catalog/wellness",
  affiliates: "/api/catalog/affiliates",
};

/** Labels shown on the owner's catalog page */
export const CATALOG_TAB_LABELS: Record<CatalogTab, string> = {
  meals: "Meals",
  workouts: "Workout",
  supplements: "Supps",
  accessories: "Gear",
  wellness: "Wellness",
  affiliates: "Deals",
};

/** Labels shown on public profile pages */
export const PUBLIC_TAB_LABELS: Record<CatalogTab, string> = {
  meals: "Meals",
  workouts: "Workouts",
  supplements: "Supps",
  accessories: "Gear",
  wellness: "Wellness",
  affiliates: "Links",
};

/** Gradients used on the owner's catalog page */
export const CATALOG_PAGE_GRADIENTS: Record<CatalogTab, string> = {
  meals: "from-orange-600/80 to-red-700/80",
  workouts: "from-blue-600/80 to-indigo-700/80",
  supplements: "from-green-600/80 to-emerald-700/80",
  accessories: "from-purple-600/80 to-pink-700/80",
  wellness: "from-teal-600/80 to-cyan-700/80",
  affiliates: "from-amber-600/80 to-yellow-700/80",
};

/** Gradients used on public profile pages */
export const PUBLIC_PAGE_GRADIENTS: Record<CatalogTab, string> = {
  meals: "from-amber-700/70 to-amber-900/70",
  workouts: "from-green-800/70 to-green-950/70",
  supplements: "from-emerald-700/70 to-emerald-900/70",
  accessories: "from-stone-600/70 to-stone-800/70",
  wellness: "from-lime-700/70 to-lime-900/70",
  affiliates: "from-amber-600/70 to-yellow-800/70",
};

/* ── Affiliate category mappings ────────────────────────────────────── */

export const AFFILIATE_CATEGORY_LABELS: Record<string, string> = {
  SUPPLEMENTS: "Supplements",
  WELLNESS_ACCESSORIES: "Wellness",
  GYM_ACCESSORIES: "Gym Gear",
  RECOVERY_TOOLS: "Recovery",
  APPAREL: "Apparel",
  NUTRITION: "Nutrition",
  TECH_WEARABLES: "Tech",
};

export const normalizeTagLabel = (value: string) =>
  value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const dedupeTags = (tags: string[]) => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  tags.forEach((tag) => {
    const normalized = normalizeTagLabel(tag);
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    deduped.push(normalized);
  });

  return deduped;
};

export const parseTagsText = (tagsText: string) =>
  tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

/** Maps AffiliateCategory → user-friendly display label matching the 5 main categories */
export const AFFILIATE_CATEGORY_TO_DISPLAY: Record<string, string> = {
  SUPPLEMENTS: "Supps",
  NUTRITION: "Supps",
  GYM_ACCESSORIES: "Gear",
  APPAREL: "Gear",
  WELLNESS_ACCESSORIES: "Wellness",
  RECOVERY_TOOLS: "Wellness",
  TECH_WEARABLES: "Wellness",
  OTHER: "Other",
};

/** Maps AffiliateCategory → internal CatalogTab key for gradient/routing */
export const AFFILIATE_TO_CATALOG_TYPE: Record<string, string> = {
  SUPPLEMENTS: "supplements",
  NUTRITION: "supplements",
  GYM_ACCESSORIES: "accessories",
  APPAREL: "accessories",
  WELLNESS_ACCESSORIES: "wellness",
  RECOVERY_TOOLS: "wellness",
  TECH_WEARABLES: "wellness",
  OTHER: "accessories",
};

export const getCatalogDisplayTags = ({
  tags,
  subcategoryTags,
  brand,
  type,
  activityType,
  categoryLabel,
}: {
  tags?: string[] | null;
  subcategoryTags?: string[] | null;
  brand?: string | null;
  type?: string | null;
  activityType?: string | null;
  categoryLabel?: string | null;
}) => {
  const explicitTags = dedupeTags([...(tags ?? []), ...(subcategoryTags ?? [])]);

  if (explicitTags.length > 0) {
    return explicitTags;
  }

  return dedupeTags([
    brand ?? "",
    type ?? "",
    activityType ?? "",
    categoryLabel ?? "",
  ]);
};

/* ── Shared affiliate helpers ───────────────────────────────────────── */

/** Resolve a user-friendly display label for an affiliate category */
export const getAffiliateDisplayLabel = (category: string): string =>
  AFFILIATE_CATEGORY_TO_DISPLAY[category] ?? "Other";

/** Resolve the gradient class for an affiliate category using the given gradient map */
export const getAffiliateGradient = (
  category: string,
  gradients: Record<CatalogTab, string>,
): string => {
  const mapped = AFFILIATE_TO_CATALOG_TYPE[category] as CatalogTab | undefined;
  return gradients[mapped ?? "accessories"];
};
