"use client";

import { useEffect, useRef, useState } from "react";
import { HiArrowLeft, HiPhotograph, HiPlus, HiViewGrid, HiViewList } from "react-icons/hi";
import { useRouter } from "next/navigation";
import {
  type Accessory,
  type CatalogItem,
  type CatalogType,
  CATALOG_TYPES,
  type SavedMeal,
  type SavedWellnessItem,
  type SavedWorkout,
  type Supplement,
  getCatalogAction,
} from "@/lib/catalog";
import {
  CatalogDetailModal,
  CatalogEmptyState,
  CatalogGridCard,
  CatalogListCard,
  CatalogSectionIntro,
} from "@/components/catalog/catalog-ui";

const inputCls = "input-dark w-full";
const ENDPOINT_MAP: Record<CatalogType, string> = {
  meals: "/api/catalog/meals",
  workouts: "/api/catalog/workouts",
  supplements: "/api/catalog/supplements",
  accessories: "/api/catalog/accessories",
  wellness: "/api/catalog/wellness",
};

function PhotoUpload({
  photoUrl,
  onUpload,
}: {
  photoUrl: string | null;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        onUpload(url);
      }
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      {photoUrl ? (
        <div className="relative w-full aspect-video overflow-hidden rounded-xl">
          <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute right-2 bottom-2 rounded-lg p-1.5 text-xs"
            style={{ background: "rgba(0,0,0,0.6)", color: "#ffffff" }}
          >
            Change
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-1.5 rounded-xl py-4 transition-all"
          style={{
            background: "rgba(120,117,255,0.06)",
            border: "1px dashed rgba(120,117,255,0.3)",
            color: "rgba(120,117,255,0.6)",
          }}
        >
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <>
              <HiPhotograph className="h-6 w-6" />
              <span className="text-xs font-medium">Add photo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

function FormShell({
  error,
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="space-y-4 rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {error ? <p style={{ color: "#f87171" }} className="text-xs">{error}</p> : null}
      {children}
    </div>
  );
}

function OptionalFields({
  title = "Optional details",
  description,
  children,
}: {
  title?: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="space-y-3 rounded-xl p-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-sub">{description}</p>
      </div>
      {children}
    </div>
  );
}

function AddMealForm({ onAdd }: { onAdd: (meal: SavedMeal) => void }) {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [notes, setNotes] = useState("");
  const [recipeSourceUrl, setRecipeSourceUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/catalog/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ingredients: ingredients
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          calories: calories ? parseInt(calories, 10) : undefined,
          protein: protein ? parseFloat(protein) : undefined,
          carbs: carbs ? parseFloat(carbs) : undefined,
          fat: fat ? parseFloat(fat) : undefined,
          recipeSourceUrl: recipeSourceUrl.trim() || undefined,
          photoUrl: photoUrl || undefined,
          notes: notes.trim() || undefined,
          tags: [],
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed");
        return;
      }
      onAdd(await res.json());
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormShell error={error}>
      <div>
        <p className="text-sm font-semibold text-white">Share a recipe or meal idea</p>
        <p className="mt-1 text-xs text-sub">Lead with what it is, then add the recipe link and helpful details.</p>
      </div>
      <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name *" className={inputCls} />
      <input
        value={recipeSourceUrl}
        onChange={(e) => setRecipeSourceUrl(e.target.value)}
        placeholder="Recipe / Instagram / TikTok link"
        className={inputCls}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Why do you recommend this?"
        className="textarea-dark w-full resize-none"
      />
      <OptionalFields description="Add ingredients and macros if they help someone decide faster.">
        <input
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Ingredients (comma-separated)"
          className={inputCls}
        />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calories" className={inputCls} />
          <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein (g)" className={inputCls} />
          <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs (g)" className={inputCls} />
          <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fat (g)" className={inputCls} />
        </div>
      </OptionalFields>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl py-2.5 text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
        {submitting ? "Saving..." : "Add meal"}
      </button>
    </FormShell>
  );
}

function AddSupplementForm({ onAdd }: { onAdd: (s: Supplement) => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [dose, setDose] = useState("");
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/catalog/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || undefined,
          dose: dose.trim() || undefined,
          schedule: schedule.trim() || undefined,
          notes: notes.trim() || undefined,
          link: link.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
          photoUrl: photoUrl || undefined,
          tags: [],
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed");
        return;
      }
      onAdd(await res.json());
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormShell error={error}>
      <div>
        <p className="text-sm font-semibold text-white">Create a clear supplement deal</p>
        <p className="mt-1 text-xs text-sub">Add the product, link, and promo code first so viewers know exactly what to do.</p>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name *" className={inputCls} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Product link" type="url" className={inputCls} />
        <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Promo code" className={inputCls} />
      </div>
      <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" className={inputCls} />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Why should someone use this?"
        className="textarea-dark w-full resize-none"
      />
      <OptionalFields description="Helpful context only if it improves trust or decision-making.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose (e.g. 5g)" className={inputCls} />
          <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="When to take it" className={inputCls} />
        </div>
        <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} />
      </OptionalFields>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl py-2.5 text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
        {submitting ? "Saving..." : "Add supplement"}
      </button>
    </FormShell>
  );
}

function AddAccessoryForm({ onAdd }: { onAdd: (a: Accessory) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [link, setLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/catalog/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: type.trim() || undefined,
          link: link.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
          photoUrl: photoUrl || undefined,
          notes: notes.trim() || undefined,
          tags: [],
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed");
        return;
      }
      onAdd(await res.json());
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormShell error={error}>
      <div>
        <p className="text-sm font-semibold text-white">Add a recommendation people can use</p>
        <p className="mt-1 text-xs text-sub">Make the link and code obvious, then add a quick description for context.</p>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name *" className={inputCls} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Product link" type="url" className={inputCls} />
        <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Promo code" className={inputCls} />
      </div>
      <input value={type} onChange={(e) => setType(e.target.value)} placeholder="What is this? (e.g. Recovery gear)" className={inputCls} />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="How should someone use it?"
        className="textarea-dark w-full resize-none"
      />
      <OptionalFields description="Add a photo only if it makes the recommendation easier to understand.">
        <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} />
      </OptionalFields>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl py-2.5 text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
        {submitting ? "Saving..." : "Add item"}
      </button>
    </FormShell>
  );
}

function AddWellnessForm({ onAdd }: { onAdd: (w: SavedWellnessItem) => void }) {
  const [name, setName] = useState("");
  const [activityType, setActivityType] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [link, setLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/catalog/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          activityType: activityType.trim() || undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
          link: link.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
          photoUrl: photoUrl || undefined,
          notes: notes.trim() || undefined,
          tags: [],
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed");
        return;
      }
      onAdd(await res.json());
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormShell error={error}>
      <div>
        <p className="text-sm font-semibold text-white">Share a wellness recommendation</p>
        <p className="mt-1 text-xs text-sub">Lead with the offer or link, then explain the routine or benefit.</p>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item or program name *" className={inputCls} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link" type="url" className={inputCls} />
        <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Promo code" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="What is this? (e.g. Yoga, Sauna)" className={inputCls} />
        <input
          type="number"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="Duration (minutes)"
          className={inputCls}
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Why do you recommend it?"
        className="textarea-dark w-full resize-none"
      />
      <OptionalFields description="Only add a photo if it helps someone recognize the item or service faster.">
        <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} />
      </OptionalFields>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl py-2.5 text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
        {submitting ? "Saving..." : "Add wellness item"}
      </button>
    </FormShell>
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
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const exerciseList = exercises
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((exercise) => ({ name: exercise, sets: [] }));
      const res = await fetch("/api/catalog/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          exercisesJson: JSON.stringify(exerciseList),
          videoUrl: videoUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          tags: [],
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed");
        return;
      }
      onAdd(await res.json());
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormShell error={error}>
      <div>
        <p className="text-sm font-semibold text-white">Save a workout people can follow</p>
        <p className="mt-1 text-xs text-sub">Add the workout name and link first, then list the exercises.</p>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workout name *" className={inputCls} />
      <input
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Workout / YouTube / Instagram link"
        className={inputCls}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="What makes this workout useful?"
        className="textarea-dark w-full resize-none"
      />
      <OptionalFields description="List exercises if someone should be able to follow the routine from the catalog alone.">
        <input value={exercises} onChange={(e) => setExercises(e.target.value)} placeholder="Exercises (comma-separated)" className={inputCls} />
      </OptionalFields>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl py-2.5 text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
        {submitting ? "Saving..." : "Add workout"}
      </button>
    </FormShell>
  );
}

export default function CatalogPage() {
  const router = useRouter();
  const [tab, setTab] = useState<CatalogType>("meals");
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [wellness, setWellness] = useState<SavedWellnessItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(ENDPOINT_MAP[tab])
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
  }, [tab]);

  const items: CatalogItem[] =
    tab === "meals"
      ? meals
      : tab === "workouts"
        ? workouts
        : tab === "supplements"
          ? supplements
          : tab === "accessories"
            ? accessories
            : wellness;

  const actionReadyCount = items.filter((item) => getCatalogAction(item, tab).kind !== "none").length;

  const handleDelete = async (id: string) => {
    const res = await fetch(`${ENDPOINT_MAP[tab]}?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      if (tab === "meals") setMeals((p) => p.filter((m) => m.id !== id));
      else if (tab === "workouts") setWorkouts((p) => p.filter((w) => w.id !== id));
      else if (tab === "supplements") setSupplements((p) => p.filter((s) => s.id !== id));
      else if (tab === "accessories") setAccessories((p) => p.filter((a) => a.id !== id));
      else setWellness((p) => p.filter((w) => w.id !== id));
    }
    setSelectedItem(null);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8" style={{ color: "#ffffff" }}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl p-2"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
          >
            <HiArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">My Catalog</h1>
            <p className="text-xs text-sub">Curated recommendations, deals, workouts, and recipes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setViewMode("grid")}
              className="p-1.5 transition-all"
              style={{
                background: viewMode === "grid" ? "rgba(120,117,255,0.3)" : "transparent",
                color: viewMode === "grid" ? "#a8a6ff" : "rgba(255,255,255,0.3)",
              }}
            >
              <HiViewGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="p-1.5 transition-all"
              style={{
                background: viewMode === "list" ? "rgba(120,117,255,0.3)" : "transparent",
                color: viewMode === "list" ? "#a8a6ff" : "rgba(255,255,255,0.3)",
              }}
            >
              <HiViewList className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#a8a6ff" }}>
            <HiPlus className="h-4 w-4" />
            {showForm ? "Close" : "Add"}
          </button>
        </div>
      </div>

      <CatalogSectionIntro
        title="Catalog"
        subtitle="Help people understand the item fast, then give them a clear next step."
        countLabel={actionReadyCount > 0 ? `${actionReadyCount} ready to use` : null}
      />

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {CATALOG_TYPES.map((catalogTab) => (
          <button
            key={catalogTab.type}
            onClick={() => {
              setLoading(true);
              setShowForm(false);
              setTab(catalogTab.type);
            }}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all"
            style={
              tab === catalogTab.type
                ? { background: "linear-gradient(135deg, #6360e8, #9b98ff)", color: "#ffffff" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
            }
          >
            {catalogTab.emoji} {catalogTab.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-4">
          {tab === "meals" && (
            <AddMealForm
              onAdd={(item) => {
                setMeals((p) => [item, ...p]);
                setShowForm(false);
              }}
            />
          )}
          {tab === "workouts" && (
            <AddWorkoutForm
              onAdd={(item) => {
                setWorkouts((p) => [item, ...p]);
                setShowForm(false);
              }}
            />
          )}
          {tab === "supplements" && (
            <AddSupplementForm
              onAdd={(item) => {
                setSupplements((p) => [item, ...p]);
                setShowForm(false);
              }}
            />
          )}
          {tab === "accessories" && (
            <AddAccessoryForm
              onAdd={(item) => {
                setAccessories((p) => [item, ...p]);
                setShowForm(false);
              }}
            />
          )}
          {tab === "wellness" && (
            <AddWellnessForm
              onAdd={(item) => {
                setWellness((p) => [item, ...p]);
                setShowForm(false);
              }}
            />
          )}
        </div>
      )}

      {loading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-sm animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <CatalogEmptyState
          type={tab}
          title={`No ${tab} saved yet`}
          description="Start with the item name, then add a link or code if people should use it right away."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl px-4 py-2 text-sm font-medium btn-gradient"
              style={{ color: "#ffffff" }}
            >
              <HiPlus className="mr-1 inline h-4 w-4" />
              Add your first {tab === "accessories" ? "item" : tab.slice(0, -1)}
            </button>
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-3 gap-0.5">
          {items.map((item) => (
            <CatalogGridCard key={item.id} item={item} type={tab} onSelect={() => setSelectedItem(item)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <CatalogListCard key={item.id} item={item} type={tab} onSelect={() => setSelectedItem(item)} />
          ))}
        </div>
      )}

      {selectedItem && (
        <CatalogDetailModal
          item={selectedItem}
          type={tab}
          onClose={() => setSelectedItem(null)}
          onDelete={() => handleDelete(selectedItem.id)}
        />
      )}
    </div>
  );
}
