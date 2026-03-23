/* ── Shared catalog configuration ────────────────────────────────────── */

export const CATALOG_TABS = [
  "meals", "workouts", "supplements", "accessories", "wellness", "affiliates",
] as const;

export type CatalogTab = (typeof CATALOG_TABS)[number];

type CatalogTabConfig = {
  endpoint: string;
  labels: {
    owner: string;
    public: string;
    picker: string;
  };
  gradients: {
    owner: string;
    public: string;
  };
  emoji: string;
};

export const CATALOG_TAB_CONFIG: Record<CatalogTab, CatalogTabConfig> = {
  meals: {
    endpoint: "/api/catalog/meals",
    labels: { owner: "Meals", public: "Meals", picker: "Meals" },
    gradients: { owner: "from-orange-600/80 to-red-700/80", public: "from-amber-700/70 to-amber-900/70" },
    emoji: "🍽",
  },
  workouts: {
    endpoint: "/api/catalog/workouts",
    labels: { owner: "Workout", public: "Workouts", picker: "Workout" },
    gradients: { owner: "from-blue-600/80 to-indigo-700/80", public: "from-green-800/70 to-green-950/70" },
    emoji: "💪",
  },
  supplements: {
    endpoint: "/api/catalog/supplements",
    labels: { owner: "Supps", public: "Supps", picker: "Supps" },
    gradients: { owner: "from-green-600/80 to-emerald-700/80", public: "from-emerald-700/70 to-emerald-900/70" },
    emoji: "💊",
  },
  accessories: {
    endpoint: "/api/catalog/accessories",
    labels: { owner: "Gear", public: "Gear", picker: "Gear" },
    gradients: { owner: "from-purple-600/80 to-pink-700/80", public: "from-stone-600/70 to-stone-800/70" },
    emoji: "⚙️",
  },
  wellness: {
    endpoint: "/api/catalog/wellness",
    labels: { owner: "Wellness", public: "Wellness", picker: "Wellness" },
    gradients: { owner: "from-teal-600/80 to-cyan-700/80", public: "from-lime-700/70 to-lime-900/70" },
    emoji: "🧘",
  },
  affiliates: {
    endpoint: "/api/catalog/affiliates",
    labels: { owner: "Deals", public: "Links", picker: "Import Links" },
    gradients: { owner: "from-amber-600/80 to-yellow-700/80", public: "from-amber-600/70 to-yellow-800/70" },
    emoji: "📋",
  },
};

export const CATALOG_FETCH_ORDER: CatalogTab[] = [
  "affiliates",
  "meals",
  "workouts",
  "supplements",
  "accessories",
  "wellness",
];

export const CATALOG_ENDPOINTS: Record<CatalogTab, string> = {
  meals: CATALOG_TAB_CONFIG.meals.endpoint,
  workouts: CATALOG_TAB_CONFIG.workouts.endpoint,
  supplements: CATALOG_TAB_CONFIG.supplements.endpoint,
  accessories: CATALOG_TAB_CONFIG.accessories.endpoint,
  wellness: CATALOG_TAB_CONFIG.wellness.endpoint,
  affiliates: CATALOG_TAB_CONFIG.affiliates.endpoint,
};

/** Labels shown on the owner's catalog page */
export const CATALOG_TAB_LABELS: Record<CatalogTab, string> = {
  meals: "Meals",
  workouts: "Workouts",
  supplements: "Supps",
  accessories: "Gear",
  wellness: "Wellness",
  affiliates: "Affiliate Links",
};

/** Labels shown on public profile pages */
export const PUBLIC_TAB_LABELS: Record<CatalogTab, string> = {
  meals: "Meals",
  workouts: "Workouts",
  supplements: "Supps",
  accessories: "Gear",
  wellness: "Wellness",
  affiliates: "Affiliate Links",
};

/** Gradients used on the owner's catalog page */
export const CATALOG_PAGE_GRADIENTS: Record<CatalogTab, string> = {
  meals: CATALOG_TAB_CONFIG.meals.gradients.owner,
  workouts: CATALOG_TAB_CONFIG.workouts.gradients.owner,
  supplements: CATALOG_TAB_CONFIG.supplements.gradients.owner,
  accessories: CATALOG_TAB_CONFIG.accessories.gradients.owner,
  wellness: CATALOG_TAB_CONFIG.wellness.gradients.owner,
  affiliates: CATALOG_TAB_CONFIG.affiliates.gradients.owner,
};

/** Gradients used on public profile pages */
export const PUBLIC_PAGE_GRADIENTS: Record<CatalogTab, string> = {
  meals: CATALOG_TAB_CONFIG.meals.gradients.public,
  workouts: CATALOG_TAB_CONFIG.workouts.gradients.public,
  supplements: CATALOG_TAB_CONFIG.supplements.gradients.public,
  accessories: CATALOG_TAB_CONFIG.accessories.gradients.public,
  wellness: CATALOG_TAB_CONFIG.wellness.gradients.public,
  affiliates: CATALOG_TAB_CONFIG.affiliates.gradients.public,
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

export const AFFILIATE_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "SUPPLEMENTS", label: "Supps" },
  { value: "NUTRITION", label: "Meals" },
  { value: "GYM_ACCESSORIES", label: "Gear" },
  { value: "WELLNESS_ACCESSORIES", label: "Wellness" },
  { value: "OTHER", label: "Other" },
];

export const CATALOG_CATEGORY_PICKER_OPTIONS: { key: CatalogTab; label: string; emoji: string }[] =
  CATALOG_TABS.map((tab) => ({
    key: tab,
    label: CATALOG_TAB_CONFIG[tab].labels.picker,
    emoji: CATALOG_TAB_CONFIG[tab].emoji,
  }));

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

export const getUserCatalogEndpoint = (username: string, tab: CatalogTab) =>
  `/api/users/${encodeURIComponent(username)}/catalogs/${tab}`;
