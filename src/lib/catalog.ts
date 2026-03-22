export type CatalogType = "meals" | "workouts" | "supplements" | "accessories" | "wellness";

export interface SavedMeal {
  id: string;
  name: string;
  mealType?: string | null;
  ingredients: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  recipeSourceUrl: string | null;
  photoUrl: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export interface SavedWorkout {
  id: string;
  name: string;
  exercisesJson: string;
  videoUrl: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export interface Supplement {
  id: string;
  name: string;
  brand: string | null;
  dose: string | null;
  schedule: string | null;
  notes: string | null;
  photoUrl: string | null;
  link: string | null;
  referralCode: string | null;
  tags: string[];
  createdAt: string;
}

export interface Accessory {
  id: string;
  name: string;
  type: string | null;
  link: string | null;
  photoUrl: string | null;
  referralCode: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export interface SavedWellnessItem {
  id: string;
  name: string;
  activityType: string | null;
  durationMinutes: number | null;
  link: string | null;
  photoUrl: string | null;
  referralCode: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export type CatalogItem = SavedMeal | SavedWorkout | Supplement | Accessory | SavedWellnessItem;

export const CATALOG_TYPES: { type: CatalogType; label: string; emoji: string }[] = [
  { type: "meals", label: "Meals", emoji: "🍽️" },
  { type: "workouts", label: "Workouts", emoji: "💪" },
  { type: "supplements", label: "Supps", emoji: "💊" },
  { type: "accessories", label: "Gear", emoji: "⚡" },
  { type: "wellness", label: "Wellness", emoji: "🧘" },
];

export const CATEGORY_GRADIENTS: Record<CatalogType, string> = {
  meals: "from-orange-600/80 to-red-700/80",
  workouts: "from-blue-600/80 to-indigo-700/80",
  supplements: "from-green-600/80 to-emerald-700/80",
  accessories: "from-purple-600/80 to-pink-700/80",
  wellness: "from-teal-600/80 to-cyan-700/80",
};

export interface CatalogAction {
  kind: "combined" | "copy" | "link" | "none";
  primaryLabel: string | null;
  secondaryLabel: string | null;
  helperText: string | null;
  href: string | null;
  code: string | null;
  badgeLabel: string | null;
}

function hasValue(value: string | null | undefined): value is string {
  return Boolean(value && value.trim());
}

function formatList(values: string[]): string | null {
  return values.length > 0 ? values.join(", ") : null;
}

export function getCatalogTypeInfo(type: CatalogType) {
  return CATALOG_TYPES.find((entry) => entry.type === type)!;
}

export function getCatalogPhotoUrl(item: CatalogItem): string | null {
  return "photoUrl" in item ? item.photoUrl : null;
}

export function getCatalogDestination(item: CatalogItem, type: CatalogType): string | null {
  if ("link" in item && hasValue(item.link)) return item.link;
  if (type === "meals" && hasValue((item as SavedMeal).recipeSourceUrl)) {
    return (item as SavedMeal).recipeSourceUrl;
  }
  if (type === "workouts" && hasValue((item as SavedWorkout).videoUrl)) {
    return (item as SavedWorkout).videoUrl;
  }
  return null;
}

export function getCatalogReferralCode(item: CatalogItem): string | null {
  if ("referralCode" in item && hasValue(item.referralCode)) return item.referralCode;
  return null;
}

export function getCatalogPrimaryDescriptor(item: CatalogItem, type: CatalogType): string | null {
  if (type === "supplements" && hasValue((item as Supplement).brand)) {
    return (item as Supplement).brand;
  }
  if (type === "accessories" && hasValue((item as Accessory).type)) {
    return (item as Accessory).type;
  }
  if (type === "wellness" && hasValue((item as SavedWellnessItem).activityType)) {
    return (item as SavedWellnessItem).activityType;
  }
  if (type === "meals" && hasValue((item as SavedMeal).mealType)) {
    return (item as SavedMeal).mealType!;
  }
  return getCatalogTypeInfo(type).label.slice(0, -1);
}

export function getCatalogAction(item: CatalogItem, type: CatalogType): CatalogAction {
  const href = getCatalogDestination(item, type);
  const code = getCatalogReferralCode(item);

  if (href && code) {
    return {
      kind: "combined",
      primaryLabel: "Shop with code",
      secondaryLabel: "Copy code",
      helperText: `Use code ${code} when you shop`,
      href,
      code,
      badgeLabel: "Deal",
    };
  }

  if (code) {
    return {
      kind: "copy",
      primaryLabel: "Copy code",
      secondaryLabel: null,
      helperText: "Copy code to use at checkout",
      href: null,
      code,
      badgeLabel: "Code",
    };
  }

  if (href) {
    const primaryLabel =
      type === "meals"
        ? "View recipe"
        : type === "workouts"
          ? "Watch workout"
          : type === "supplements" || type === "accessories"
            ? "Shop link"
            : "Open link";

    const helperText =
      type === "meals"
        ? "Open link to view the recipe"
        : type === "workouts"
          ? "Open link to watch the workout"
          : "Open link to shop or learn more";

    return {
      kind: "link",
      primaryLabel,
      secondaryLabel: null,
      helperText,
      href,
      code: null,
      badgeLabel: type === "workouts" ? "Video" : "Link",
    };
  }

  return {
    kind: "none",
    primaryLabel: null,
    secondaryLabel: null,
    helperText: null,
    href: null,
    code: null,
    badgeLabel: null,
  };
}

export function getCatalogDetailBadges(item: CatalogItem, type: CatalogType): string[] {
  const badges = [getCatalogTypeInfo(type).label];
  const descriptor = getCatalogPrimaryDescriptor(item, type);

  if (descriptor && descriptor !== badges[0]) {
    badges.push(descriptor);
  }

  if (type === "supplements" && hasValue((item as Supplement).dose)) {
    badges.push((item as Supplement).dose!);
  }

  if (type === "wellness" && (item as SavedWellnessItem).durationMinutes != null) {
    badges.push(`${(item as SavedWellnessItem).durationMinutes} min`);
  }

  return badges;
}

export function getCatalogCardSummary(item: CatalogItem, type: CatalogType): string | null {
  const action = getCatalogAction(item, type);
  if (action.helperText) return action.helperText;

  if (type === "meals") {
    const meal = item as SavedMeal;
    const parts = [
      meal.calories != null ? `${meal.calories} cal` : null,
      meal.protein != null ? `${meal.protein}g protein` : null,
      meal.ingredients.length > 0 ? `${meal.ingredients.length} ingredients` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : meal.notes;
  }

  if (type === "workouts") {
    const names = getWorkoutExerciseNames(item as SavedWorkout);
    return names.length > 0 ? names.slice(0, 3).join(" · ") : (item as SavedWorkout).notes;
  }

  return ("notes" in item && item.notes) || null;
}

export function getCatalogMetrics(item: CatalogItem, type: CatalogType): string[] {
  if (type === "meals") {
    const meal = item as SavedMeal;
    return [
      meal.calories != null ? `${meal.calories} cal` : null,
      meal.protein != null ? `${meal.protein}g protein` : null,
      meal.carbs != null ? `${meal.carbs}g carbs` : null,
      meal.fat != null ? `${meal.fat}g fat` : null,
    ].filter((value): value is string => Boolean(value));
  }

  if (type === "supplements") {
    const supplement = item as Supplement;
    return [supplement.dose, supplement.schedule].filter((value): value is string => hasValue(value));
  }

  if (type === "wellness") {
    const wellness = item as SavedWellnessItem;
    return [wellness.durationMinutes != null ? `${wellness.durationMinutes} minutes` : null].filter(
      (value): value is string => Boolean(value)
    );
  }

  return [];
}

export function getCatalogLongText(item: CatalogItem, type: CatalogType): string | null {
  if (type === "meals") {
    return formatList((item as SavedMeal).ingredients);
  }
  if (type === "workouts") {
    const names = getWorkoutExerciseNames(item as SavedWorkout);
    return formatList(names);
  }
  return null;
}

export function getWorkoutExerciseNames(item: SavedWorkout): string[] {
  try {
    const exercises = JSON.parse(item.exercisesJson) as Array<{ name?: string }>;
    if (!Array.isArray(exercises)) return [];
    return exercises
      .map((exercise) => (typeof exercise?.name === "string" ? exercise.name.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}
