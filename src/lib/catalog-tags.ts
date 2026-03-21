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
  brand,
  type,
  activityType,
  categoryLabel,
}: {
  tags?: string[] | null;
  brand?: string | null;
  type?: string | null;
  activityType?: string | null;
  categoryLabel?: string | null;
}) => {
  const explicitTags = dedupeTags(tags ?? []);

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
