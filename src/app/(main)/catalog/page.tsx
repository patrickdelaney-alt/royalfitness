"use client";

import { useState, useEffect } from "react";
import { HiArrowLeft, HiPlus, HiTrash, HiExternalLink } from "react-icons/hi";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedMeal {
  id: string;
  name: string;
  mealType?: string;
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

interface SavedWorkout {
  id: string;
  name: string;
  exercisesJson: string;
  videoUrl: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

interface Supplement {
  id: string;
  name: string;
  brand: string | null;
  dose: string | null;
  schedule: string | null;
  notes: string | null;
  link: string | null;
  tags: string[];
  createdAt: string;
}

interface Accessory {
  id: string;
  name: string;
  type: string | null;
  link: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

interface SavedWellnessItem {
  id: string;
  name: string;
  activityType: string | null;
  durationMinutes: number | null;
  link: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

type Tab = "meals" | "workouts" | "supplements" | "accessories" | "wellness";

// ── Add forms ─────────────────────────────────────────────────────────────────

function AddMealForm({ onAdd }: { onAdd: (meal: SavedMeal) => void }) {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [notes, setNotes] = useState("");
  const [recipeSourceUrl, setRecipeSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/catalog/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ingredients: ingredients.split(",").map((s) => s.trim()).filter(Boolean),
          calories: calories ? parseInt(calories) : undefined,
          protein: protein ? parseFloat(protein) : undefined,
          carbs: carbs ? parseFloat(carbs) : undefined,
          fat: fat ? parseFloat(fat) : undefined,
          recipeSourceUrl: recipeSourceUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          tags: [],
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      const meal = await res.json();
      onAdd(meal);
      setName(""); setIngredients(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setNotes(""); setRecipeSourceUrl("");
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl bg-gray-50/50">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name *" className={inputCls} />
      <input value={recipeSourceUrl} onChange={(e) => setRecipeSourceUrl(e.target.value)} placeholder="Instagram / TikTok link (optional)" className={inputCls} />
      <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingredients (comma-separated)" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calories" className={inputCls} />
        <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein (g)" className={inputCls} />
        <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs (g)" className={inputCls} />
        <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fat (g)" className={inputCls} />
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className={inputCls + " resize-none"} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? "Saving..." : "Add Meal"}
      </button>
    </div>
  );
}

function AddSupplementForm({ onAdd }: { onAdd: (s: Supplement) => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [dose, setDose] = useState("");
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/catalog/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), brand: brand.trim() || undefined, dose: dose.trim() || undefined, schedule: schedule.trim() || undefined, notes: notes.trim() || undefined, link: link.trim() || undefined, tags: [] }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      const supp = await res.json();
      onAdd(supp);
      setName(""); setBrand(""); setDose(""); setSchedule(""); setNotes(""); setLink("");
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl bg-gray-50/50">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplement name *" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" className={inputCls} />
        <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose (e.g. 5g)" className={inputCls} />
      </div>
      <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Schedule (e.g. Morning)" className={inputCls} />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Product link (optional)" type="url" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className={inputCls + " resize-none"} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? "Saving..." : "Add Supplement"}
      </button>
    </div>
  );
}

function AddAccessoryForm({ onAdd }: { onAdd: (a: Accessory) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/catalog/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type: type.trim() || undefined, link: link.trim() || undefined, notes: notes.trim() || undefined, tags: [] }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      const acc = await res.json();
      onAdd(acc);
      setName(""); setType(""); setLink(""); setNotes("");
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl bg-gray-50/50">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Accessory name *" className={inputCls} />
      <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (e.g. Recovery, Gear)" className={inputCls} />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" type="url" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className={inputCls + " resize-none"} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? "Saving..." : "Add Accessory"}
      </button>
    </div>
  );
}

function AddWellnessForm({ onAdd }: { onAdd: (w: SavedWellnessItem) => void }) {
  const [name, setName] = useState("");
  const [activityType, setActivityType] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/catalog/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          activityType: activityType.trim() || undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          link: link.trim() || undefined,
          notes: notes.trim() || undefined,
          tags: [],
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      const item = await res.json();
      onAdd(item);
      setName(""); setActivityType(""); setDurationMinutes(""); setLink(""); setNotes("");
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl bg-gray-50/50">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Wellness item name *" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="Activity type (e.g. Yoga)" className={inputCls} />
        <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="Duration (min)" className={inputCls} />
      </div>
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" type="url" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className={inputCls + " resize-none"} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? "Saving..." : "Add Wellness Item"}
      </button>
    </div>
  );
}

function AddWorkoutForm({ onAdd }: { onAdd: (w: SavedWorkout) => void }) {
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name required"); return; }
    setSubmitting(true); setError("");
    try {
      const exerciseList = exercises.split(",").map((s) => s.trim()).filter(Boolean).map((e) => ({ name: e, sets: [] }));
      const res = await fetch("/api/catalog/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), exercisesJson: JSON.stringify(exerciseList), videoUrl: videoUrl.trim() || undefined, notes: notes.trim() || undefined, tags: [] }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      const workout = await res.json();
      onAdd(workout);
      setName(""); setExercises(""); setVideoUrl(""); setNotes("");
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl bg-gray-50/50">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workout name *" className={inputCls} />
      <input value={exercises} onChange={(e) => setExercises(e.target.value)} placeholder="Exercises (comma-separated)" className={inputCls} />
      <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube / Instagram / TikTok link (optional)" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className={inputCls + " resize-none"} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? "Saving..." : "Add Workout"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("meals");
  const [showForm, setShowForm] = useState(false);

  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [wellness, setWellness] = useState<SavedWellnessItem[]>([]);
  const [loading, setLoading] = useState(true);

  const endpointMap: Record<Tab, string> = {
    meals: "/api/catalog/meals",
    workouts: "/api/catalog/workouts",
    supplements: "/api/catalog/supplements",
    accessories: "/api/catalog/accessories",
    wellness: "/api/catalog/wellness",
  };

  useEffect(() => {
    setLoading(true);
    setShowForm(false);
    fetch(endpointMap[tab])
      .then((r) => r.json())
      .then((data) => {
        if (tab === "meals") setMeals(Array.isArray(data) ? data : []);
        else if (tab === "workouts") setWorkouts(Array.isArray(data) ? data : []);
        else if (tab === "supplements") setSupplements(Array.isArray(data) ? data : []);
        else if (tab === "accessories") setAccessories(Array.isArray(data) ? data : []);
        else if (tab === "wellness") setWellness(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`${endpointMap[tab]}?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      if (tab === "meals") setMeals((p) => p.filter((m) => m.id !== id));
      else if (tab === "workouts") setWorkouts((p) => p.filter((w) => w.id !== id));
      else if (tab === "supplements") setSupplements((p) => p.filter((s) => s.id !== id));
      else if (tab === "accessories") setAccessories((p) => p.filter((a) => a.id !== id));
      else if (tab === "wellness") setWellness((p) => p.filter((w) => w.id !== id));
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "meals", label: "Meals" },
    { key: "workouts", label: "Workouts" },
    { key: "wellness", label: "Wellness" },
    { key: "supplements", label: "Supplements" },
    { key: "accessories", label: "Accessories" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-muted hover:text-foreground">
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">My Catalog</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary-dark"
        >
          <HiPlus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-4">
          {tab === "meals" && (
            <AddMealForm
              onAdd={(m) => {
                setMeals((p) => [m, ...p]);
                setShowForm(false);
              }}
            />
          )}
          {tab === "workouts" && (
            <AddWorkoutForm
              onAdd={(w) => {
                setWorkouts((p) => [w, ...p]);
                setShowForm(false);
              }}
            />
          )}
          {tab === "supplements" && (
            <AddSupplementForm
              onAdd={(s) => {
                setSupplements((p) => [s, ...p]);
                setShowForm(false);
              }}
            />
          )}
          {tab === "accessories" && (
            <AddAccessoryForm
              onAdd={(a) => {
                setAccessories((p) => [a, ...p]);
                setShowForm(false);
              }}
            />
          )}
          {tab === "wellness" && (
            <AddWellnessForm
              onAdd={(w) => {
                setWellness((p) => [w, ...p]);
                setShowForm(false);
              }}
            />
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-border animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Meals */}
          {tab === "meals" && (
            meals.length === 0 ? (
              <p className="text-center text-muted text-sm py-12">No saved meals yet</p>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div key={meal.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{meal.name}</p>
                        {meal.ingredients.length > 0 && (
                          <p className="text-xs text-muted mt-0.5 truncate">
                            {meal.ingredients.join(", ")}
                          </p>
                        )}
                        {(meal.calories || meal.protein || meal.carbs || meal.fat) && (
                          <div className="flex gap-3 mt-2 text-xs text-muted">
                            {meal.calories != null && <span>{meal.calories} cal</span>}
                            {meal.protein != null && <span>{meal.protein}g protein</span>}
                            {meal.carbs != null && <span>{meal.carbs}g carbs</span>}
                            {meal.fat != null && <span>{meal.fat}g fat</span>}
                          </div>
                        )}
                        {meal.notes && (
                          <p className="text-xs text-muted italic mt-1">{meal.notes}</p>
                        )}
                        {meal.recipeSourceUrl && (
                          <a
                            href={meal.recipeSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                          >
                            <HiExternalLink className="w-3.5 h-3.5" />
                            {meal.recipeSourceUrl.includes("instagram.com") ? "View on Instagram" :
                             meal.recipeSourceUrl.includes("tiktok.com") ? "View on TikTok" : "Source"}
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        className="text-muted hover:text-red-500 flex-shrink-0"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Workouts */}
          {tab === "workouts" && (
            workouts.length === 0 ? (
              <p className="text-center text-muted text-sm py-12">No saved workouts yet</p>
            ) : (
              <div className="space-y-3">
                {workouts.map((w) => {
                  let exercises: { name: string }[] = [];
                  try { exercises = JSON.parse(w.exercisesJson); } catch { /* ignore */ }
                  return (
                    <div key={w.id} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">{w.name}</p>
                          {exercises.length > 0 && (
                            <p className="text-xs text-muted mt-0.5">
                              {exercises.map((e) => e.name).join(", ")}
                            </p>
                          )}
                          {w.notes && (
                            <p className="text-xs text-muted italic mt-1">{w.notes}</p>
                          )}
                          {w.videoUrl && (
                            <a
                              href={w.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                            >
                              <HiExternalLink className="w-3.5 h-3.5" />
                              {w.videoUrl.includes("youtube.com") || w.videoUrl.includes("youtu.be") ? "Watch on YouTube" :
                               w.videoUrl.includes("instagram.com") ? "View on Instagram" :
                               w.videoUrl.includes("tiktok.com") ? "View on TikTok" : "Watch video"}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="text-muted hover:text-red-500 flex-shrink-0"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Supplements */}
          {tab === "supplements" && (
            supplements.length === 0 ? (
              <p className="text-center text-muted text-sm py-12">No supplements tracked yet</p>
            ) : (
              <div className="space-y-3">
                {supplements.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground">{s.name}</p>
                          {s.brand && (
                            <span className="text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                              {s.brand}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted flex-wrap">
                          {s.dose && <span>Dose: {s.dose}</span>}
                          {s.schedule && <span>Schedule: {s.schedule}</span>}
                        </div>
                        {s.notes && (
                          <p className="text-xs text-muted italic mt-1">{s.notes}</p>
                        )}
                        {s.link && (
                          <a
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                          >
                            <HiExternalLink className="w-3.5 h-3.5" />
                            Product link
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-muted hover:text-red-500 flex-shrink-0"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Accessories */}
          {tab === "accessories" && (
            accessories.length === 0 ? (
              <p className="text-center text-muted text-sm py-12">No wellness accessories yet</p>
            ) : (
              <div className="space-y-3">
                {accessories.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground">{a.name}</p>
                          {a.type && (
                            <span className="text-xs text-muted bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                              {a.type}
                            </span>
                          )}
                        </div>
                        {a.notes && (
                          <p className="text-xs text-muted italic mt-1">{a.notes}</p>
                        )}
                        {a.link && (
                          <a
                            href={a.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                          >
                            <HiExternalLink className="w-3.5 h-3.5" />
                            Link
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-muted hover:text-red-500 flex-shrink-0"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Wellness */}
          {tab === "wellness" && (
            wellness.length === 0 ? (
              <p className="text-center text-muted text-sm py-12">No wellness items saved yet</p>
            ) : (
              <div className="space-y-3">
                {wellness.map((w) => (
                  <div key={w.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground">{w.name}</p>
                          {w.activityType && (
                            <span className="text-xs text-muted bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                              {w.activityType}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted flex-wrap">
                          {w.durationMinutes != null && <span>{w.durationMinutes} min</span>}
                        </div>
                        {w.notes && (
                          <p className="text-xs text-muted italic mt-1">{w.notes}</p>
                        )}
                        {w.link && (
                          <a
                            href={w.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                          >
                            <HiExternalLink className="w-3.5 h-3.5" />
                            Link
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-muted hover:text-red-500 flex-shrink-0"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
