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

const inputCls = "input-dark w-full";

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

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name required"); return; }
    setSubmitting(true); setError("");
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
    <div className="space-y-3 p-4 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name *" className={inputCls} />
      <input value={recipeSourceUrl} onChange={(e) => setRecipeSourceUrl(e.target.value)} placeholder="Instagram / TikTok link (optional)" className={inputCls} />
      <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingredients (comma-separated)" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calories" className={inputCls} />
        <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein (g)" className={inputCls} />
        <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs (g)" className={inputCls} />
        <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fat (g)" className={inputCls} />
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50" style={{ color: "#ffffff" }}>
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
    <div className="space-y-3 p-4 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplement name *" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" className={inputCls} />
        <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose (e.g. 5g)" className={inputCls} />
      </div>
      <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Schedule (e.g. Morning)" className={inputCls} />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Product link (optional)" type="url" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50" style={{ color: "#ffffff" }}>
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
    <div className="space-y-3 p-4 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Accessory name *" className={inputCls} />
      <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (e.g. Recovery, Gear)" className={inputCls} />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" type="url" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50" style={{ color: "#ffffff" }}>
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
    <div className="space-y-3 p-4 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Wellness item name *" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="Activity type (e.g. Yoga)" className={inputCls} />
        <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="Duration (min)" className={inputCls} />
      </div>
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" type="url" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50" style={{ color: "#ffffff" }}>
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
    <div className="space-y-3 p-4 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workout name *" className={inputCls} />
      <input value={exercises} onChange={(e) => setExercises(e.target.value)} placeholder="Exercises (comma-separated)" className={inputCls} />
      <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube / Instagram / TikTok link (optional)" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50" style={{ color: "#ffffff" }}>
        {submitting ? "Saving..." : "Add Workout"}
      </button>
    </div>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────

function ItemCard({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">{children}</div>
        <button onClick={onDelete} className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
          <HiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(252,76,2,0.1)", color: "#fc4c02" }}>
      {children}
    </span>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs mt-1 hover:underline" style={{ color: "#fc4c02" }}>
      <HiExternalLink className="w-3.5 h-3.5" />
      {label}
    </a>
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

  const muted = "rgba(0,0,0,0.4)";

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "#ffffff" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ background: "#f3f4f6", color: "rgba(0,0,0,0.6)" }}>
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">My Catalog</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "#fc4c02" }}
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
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={
              tab === t.key
                ? { background: "linear-gradient(135deg, #fc4c02 0%, #fc4c02 100%)", color: "#ffffff" }
                : { background: "#f3f4f6", color: "rgba(0,0,0,0.4)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-4">
          {tab === "meals" && <AddMealForm onAdd={(m) => { setMeals((p) => [m, ...p]); setShowForm(false); }} />}
          {tab === "workouts" && <AddWorkoutForm onAdd={(w) => { setWorkouts((p) => [w, ...p]); setShowForm(false); }} />}
          {tab === "supplements" && <AddSupplementForm onAdd={(s) => { setSupplements((p) => [s, ...p]); setShowForm(false); }} />}
          {tab === "accessories" && <AddAccessoryForm onAdd={(a) => { setAccessories((p) => [a, ...p]); setShowForm(false); }} />}
          {tab === "wellness" && <AddWellnessForm onAdd={(w) => { setWellness((p) => [w, ...p]); setShowForm(false); }} />}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "#f3f4f6" }} />
          ))}
        </div>
      ) : (
        <>
          {/* Meals */}
          {tab === "meals" && (
            meals.length === 0 ? (
              <p className="text-center text-sm py-12" style={{ color: muted }}>No saved meals yet</p>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <ItemCard key={meal.id} onDelete={() => handleDelete(meal.id)}>
                    <p className="font-semibold text-sm truncate">{meal.name}</p>
                    {meal.ingredients.length > 0 && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: muted }}>{meal.ingredients.join(", ")}</p>
                    )}
                    {(meal.calories || meal.protein || meal.carbs || meal.fat) && (
                      <div className="flex gap-3 mt-2 text-xs flex-wrap" style={{ color: muted }}>
                        {meal.calories != null && <span>{meal.calories} cal</span>}
                        {meal.protein != null && <span>{meal.protein}g protein</span>}
                        {meal.carbs != null && <span>{meal.carbs}g carbs</span>}
                        {meal.fat != null && <span>{meal.fat}g fat</span>}
                      </div>
                    )}
                    {meal.notes && <p className="text-xs italic mt-1" style={{ color: muted }}>{meal.notes}</p>}
                    {meal.recipeSourceUrl && (
                      <ExternalLink
                        href={meal.recipeSourceUrl}
                        label={
                          meal.recipeSourceUrl.includes("instagram.com") ? "View on Instagram" :
                          meal.recipeSourceUrl.includes("tiktok.com") ? "View on TikTok" : "Source"
                        }
                      />
                    )}
                  </ItemCard>
                ))}
              </div>
            )
          )}

          {/* Workouts */}
          {tab === "workouts" && (
            workouts.length === 0 ? (
              <p className="text-center text-sm py-12" style={{ color: muted }}>No saved workouts yet</p>
            ) : (
              <div className="space-y-3">
                {workouts.map((w) => {
                  let exercises: { name: string }[] = [];
                  try { exercises = JSON.parse(w.exercisesJson); } catch { /* ignore */ }
                  return (
                    <ItemCard key={w.id} onDelete={() => handleDelete(w.id)}>
                      <p className="font-semibold text-sm">{w.name}</p>
                      {exercises.length > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: muted }}>{exercises.map((e) => e.name).join(", ")}</p>
                      )}
                      {w.notes && <p className="text-xs italic mt-1" style={{ color: muted }}>{w.notes}</p>}
                      {w.videoUrl && (
                        <ExternalLink
                          href={w.videoUrl}
                          label={
                            w.videoUrl.includes("youtube.com") || w.videoUrl.includes("youtu.be") ? "Watch on YouTube" :
                            w.videoUrl.includes("instagram.com") ? "View on Instagram" :
                            w.videoUrl.includes("tiktok.com") ? "View on TikTok" : "Watch video"
                          }
                        />
                      )}
                    </ItemCard>
                  );
                })}
              </div>
            )
          )}

          {/* Supplements */}
          {tab === "supplements" && (
            supplements.length === 0 ? (
              <p className="text-center text-sm py-12" style={{ color: muted }}>No supplements tracked yet</p>
            ) : (
              <div className="space-y-3">
                {supplements.map((s) => (
                  <ItemCard key={s.id} onDelete={() => handleDelete(s.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{s.name}</p>
                      {s.brand && <Pill>{s.brand}</Pill>}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs flex-wrap" style={{ color: muted }}>
                      {s.dose && <span>Dose: {s.dose}</span>}
                      {s.schedule && <span>Schedule: {s.schedule}</span>}
                    </div>
                    {s.notes && <p className="text-xs italic mt-1" style={{ color: muted }}>{s.notes}</p>}
                    {s.link && <ExternalLink href={s.link} label="Product link" />}
                  </ItemCard>
                ))}
              </div>
            )
          )}

          {/* Accessories */}
          {tab === "accessories" && (
            accessories.length === 0 ? (
              <p className="text-center text-sm py-12" style={{ color: muted }}>No wellness accessories yet</p>
            ) : (
              <div className="space-y-3">
                {accessories.map((a) => (
                  <ItemCard key={a.id} onDelete={() => handleDelete(a.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{a.name}</p>
                      {a.type && <Pill>{a.type}</Pill>}
                    </div>
                    {a.notes && <p className="text-xs italic mt-1" style={{ color: muted }}>{a.notes}</p>}
                    {a.link && <ExternalLink href={a.link} label="Link" />}
                  </ItemCard>
                ))}
              </div>
            )
          )}

          {/* Wellness */}
          {tab === "wellness" && (
            wellness.length === 0 ? (
              <p className="text-center text-sm py-12" style={{ color: muted }}>No wellness items saved yet</p>
            ) : (
              <div className="space-y-3">
                {wellness.map((w) => (
                  <ItemCard key={w.id} onDelete={() => handleDelete(w.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{w.name}</p>
                      {w.activityType && <Pill>{w.activityType}</Pill>}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs flex-wrap" style={{ color: muted }}>
                      {w.durationMinutes != null && <span>{w.durationMinutes} min</span>}
                    </div>
                    {w.notes && <p className="text-xs italic mt-1" style={{ color: muted }}>{w.notes}</p>}
                    {w.link && <ExternalLink href={w.link} label="Link" />}
                  </ItemCard>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
