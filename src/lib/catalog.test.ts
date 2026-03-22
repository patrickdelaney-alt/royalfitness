import {
  getCatalogAction,
  getCatalogCardSummary,
  getCatalogDestination,
  getCatalogMetrics,
  getWorkoutExerciseNames,
  type Accessory,
  type SavedMeal,
  type SavedWellnessItem,
  type SavedWorkout,
  type Supplement,
} from "@/lib/catalog";

const baseDate = "2026-03-22T12:00:00.000Z";

function supplement(overrides: Partial<Supplement> = {}): Supplement {
  return {
    id: "supp-1",
    name: "Creatine",
    brand: "Thorne",
    dose: "5g",
    schedule: "Daily",
    notes: "Daily strength support",
    photoUrl: null,
    link: null,
    referralCode: null,
    tags: [],
    createdAt: baseDate,
    ...overrides,
  };
}

function accessory(overrides: Partial<Accessory> = {}): Accessory {
  return {
    id: "acc-1",
    name: "Recovery Boots",
    type: "Recovery gear",
    link: null,
    photoUrl: null,
    referralCode: null,
    notes: "Great after long runs",
    tags: [],
    createdAt: baseDate,
    ...overrides,
  };
}

function meal(overrides: Partial<SavedMeal> = {}): SavedMeal {
  return {
    id: "meal-1",
    name: "Protein Oats",
    mealType: "Breakfast",
    ingredients: ["Oats", "Greek yogurt", "Berries"],
    calories: 420,
    protein: 32,
    carbs: 48,
    fat: 12,
    recipeSourceUrl: null,
    photoUrl: null,
    notes: "Easy high-protein breakfast",
    tags: [],
    createdAt: baseDate,
    ...overrides,
  };
}

function workout(overrides: Partial<SavedWorkout> = {}): SavedWorkout {
  return {
    id: "workout-1",
    name: "Push Day",
    exercisesJson: JSON.stringify([{ name: "Bench Press" }, { name: "Overhead Press" }]),
    videoUrl: null,
    notes: "Upper body strength",
    tags: [],
    createdAt: baseDate,
    ...overrides,
  };
}

function wellness(overrides: Partial<SavedWellnessItem> = {}): SavedWellnessItem {
  return {
    id: "well-1",
    name: "Cold Plunge Program",
    activityType: "Cold plunge",
    durationMinutes: 3,
    link: null,
    photoUrl: null,
    referralCode: null,
    notes: "Quick recovery routine",
    tags: [],
    createdAt: baseDate,
    ...overrides,
  };
}

describe("catalog helpers", () => {
  it("prioritizes shop with code when both link and code exist", () => {
    const action = getCatalogAction(
      supplement({ link: "https://example.com/deal", referralCode: "ROYAL20" }),
      "supplements"
    );

    expect(action.kind).toBe("combined");
    expect(action.primaryLabel).toBe("Shop with code");
    expect(action.secondaryLabel).toBe("Copy code");
    expect(action.helperText).toBe("Use code ROYAL20 when you shop");
    expect(action.href).toBe("https://example.com/deal");
  });

  it("returns copy action when only a code exists", () => {
    const action = getCatalogAction(accessory({ referralCode: "SAVE15" }), "accessories");

    expect(action.kind).toBe("copy");
    expect(action.primaryLabel).toBe("Copy code");
    expect(action.href).toBeNull();
  });

  it("returns category-aware link labels", () => {
    expect(getCatalogAction(meal({ recipeSourceUrl: "https://example.com/recipe" }), "meals").primaryLabel).toBe("View recipe");
    expect(getCatalogAction(workout({ videoUrl: "https://example.com/video" }), "workouts").primaryLabel).toBe("Watch workout");
    expect(getCatalogAction(wellness({ link: "https://example.com/program" }), "wellness").primaryLabel).toBe("Open link");
  });

  it("maps destinations from the correct fields", () => {
    expect(getCatalogDestination(meal({ recipeSourceUrl: "https://example.com/recipe" }), "meals")).toBe("https://example.com/recipe");
    expect(getCatalogDestination(workout({ videoUrl: "https://example.com/video" }), "workouts")).toBe("https://example.com/video");
    expect(getCatalogDestination(supplement({ link: "https://example.com/shop" }), "supplements")).toBe("https://example.com/shop");
  });

  it("builds card summaries from meaningful data when no CTA exists", () => {
    expect(getCatalogCardSummary(meal(), "meals")).toBe("420 cal · 32g protein · 3 ingredients");
    expect(getCatalogCardSummary(workout(), "workouts")).toBe("Bench Press · Overhead Press");
  });

  it("surfaces metrics for meals, supplements, and wellness items", () => {
    expect(getCatalogMetrics(meal(), "meals")).toEqual(["420 cal", "32g protein", "48g carbs", "12g fat"]);
    expect(getCatalogMetrics(supplement(), "supplements")).toEqual(["5g", "Daily"]);
    expect(getCatalogMetrics(wellness(), "wellness")).toEqual(["3 minutes"]);
  });

  it("parses workout exercise names safely", () => {
    expect(getWorkoutExerciseNames(workout())).toEqual(["Bench Press", "Overhead Press"]);
    expect(getWorkoutExerciseNames(workout({ exercisesJson: "not-json" }))).toEqual([]);
  });
});
