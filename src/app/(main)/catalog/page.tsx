"use client";

import { useState, useEffect, useRef } from "react";
import {
  HiArrowLeft,
  HiPlus,
  HiTrash,
  HiExternalLink,
  HiX,
  HiLink,
  HiClipboardCopy,
  HiPhotograph,
  HiViewGrid,
  HiViewList,
} from "react-icons/hi";
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
  photoUrl: string | null;
  link: string | null;
  referralCode: string | null;
  tags: string[];
  createdAt: string;
}

interface Accessory {
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

interface SavedWellnessItem {
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

type Tab = "meals" | "workouts" | "supplements" | "accessories" | "wellness";

type AnyItem = SavedMeal | SavedWorkout | Supplement | Accessory | SavedWellnessItem;

const inputCls = "input-dark w-full";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "meals", label: "Meals", emoji: "🍽️" },
  { key: "workouts", label: "Workouts", emoji: "💪" },
  { key: "supplements", label: "Supps", emoji: "💊" },
  { key: "accessories", label: "Gear", emoji: "⚡" },
  { key: "wellness", label: "Wellness", emoji: "🧘" },
];

const CATEGORY_GRADIENTS: Record<Tab, string> = {
  meals: "from-orange-600/80 to-red-700/80",
  workouts: "from-blue-600/80 to-indigo-700/80",
  supplements: "from-green-600/80 to-emerald-700/80",
  accessories: "from-purple-600/80 to-pink-700/80",
  wellness: "from-teal-600/80 to-cyan-700/80",
};

// ── Photo Upload Component ────────────────────────────────────────────────────

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
        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
          <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg text-xs"
            style={{ background: "rgba(24,25,15,0.15)", color: "#ffffff" }}
          >
            Change
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full py-4 rounded-xl flex flex-col items-center gap-1.5 transition-all"
          style={{
            background: "rgba(36,63,22,0.06)",
            border: "1px dashed rgba(36,63,22,0.3)",
            color: "rgba(36,63,22,0.6)",
          }}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <HiPhotograph className="w-6 h-6" />
              <span className="text-xs font-medium">Add Photo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Add Forms ─────────────────────────────────────────────────────────────────

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
          calories: calories ? parseInt(calories) : undefined,
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
      const meal = await res.json();
      onAdd(meal);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="space-y-3 p-4 rounded-xl"
      style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
    >
      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name *" className={inputCls} />
      <input
        value={recipeSourceUrl}
        onChange={(e) => setRecipeSourceUrl(e.target.value)}
        placeholder="Instagram / TikTok link (optional)"
        className={inputCls}
      />
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
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes"
        className="textarea-dark w-full resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
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
      const supp = await res.json();
      onAdd(supp);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="space-y-3 p-4 rounded-xl"
      style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
    >
      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplement name *" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" className={inputCls} />
        <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose (e.g. 5g)" className={inputCls} />
      </div>
      <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Schedule (e.g. Morning)" className={inputCls} />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Product link (optional)" type="url" className={inputCls} />
      <div className="relative">
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="Referral / affiliate code (e.g. ROYAL20)"
          className={inputCls}
        />
        {referralCode && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(36,63,22,0.15)", color: "#528531" }}
          >
            Code
          </span>
        )}
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
        {submitting ? "Saving..." : "Add Supplement"}
      </button>
    </div>
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
      const acc = await res.json();
      onAdd(acc);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="space-y-3 p-4 rounded-xl"
      style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
    >
      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Accessory name *" className={inputCls} />
      <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (e.g. Recovery, Gear)" className={inputCls} />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" type="url" className={inputCls} />
      <div className="relative">
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="Referral / affiliate code (e.g. ROYAL20)"
          className={inputCls}
        />
        {referralCode && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(36,63,22,0.15)", color: "#528531" }}
          >
            Code
          </span>
        )}
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
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
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
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
      const item = await res.json();
      onAdd(item);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="space-y-3 p-4 rounded-xl"
      style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
    >
      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Wellness item name *" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="Activity type (e.g. Yoga)" className={inputCls} />
        <input
          type="number"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="Duration (min)"
          className={inputCls}
        />
      </div>
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" type="url" className={inputCls} />
      <div className="relative">
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="Referral / affiliate code (e.g. ROYAL20)"
          className={inputCls}
        />
        {referralCode && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(36,63,22,0.15)", color: "#528531" }}
          >
            Code
          </span>
        )}
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
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
        .map((e) => ({ name: e, sets: [] }));
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
      const workout = await res.json();
      onAdd(workout);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="space-y-3 p-4 rounded-xl"
      style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
    >
      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workout name *" className={inputCls} />
      <input value={exercises} onChange={(e) => setExercises(e.target.value)} placeholder="Exercises (comma-separated)" className={inputCls} />
      <input
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="YouTube / Instagram / TikTok link (optional)"
        className={inputCls}
      />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="textarea-dark w-full resize-none" />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
        style={{ color: "#ffffff" }}
      >
        {submitting ? "Saving..." : "Add Workout"}
      </button>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function ItemDetailModal({
  item,
  tab,
  onClose,
  onDelete,
}: {
  item: AnyItem;
  tab: Tab;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tabInfo = TABS.find((t) => t.key === tab);

  const photoUrl = "photoUrl" in item ? (item as { photoUrl: string | null }).photoUrl : null;
  const link = "link" in item ? (item as { link: string | null }).link : null;
  const referralCode = "referralCode" in item ? (item as { referralCode: string | null }).referralCode : null;
  const notes = "notes" in item ? (item as { notes: string | null }).notes : null;

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    onDelete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full"
          style={{ background: "rgba(24,25,15,0.09)", color: "var(--text)" }}
        >
          <HiX className="w-5 h-5" />
        </button>

        {/* Image */}
        {photoUrl ? (
          <div className="w-full aspect-square">
            <img src={photoUrl} alt={item.name} className="w-full h-full object-cover rounded-t-2xl" />
          </div>
        ) : (
          <div
            className={`w-full aspect-[4/3] bg-gradient-to-br ${CATEGORY_GRADIENTS[tab]} flex items-center justify-center rounded-t-2xl`}
          >
            <span className="text-6xl">{tabInfo?.emoji}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(36,63,22,0.12)", color: "#528531" }}
              >
                {tabInfo?.emoji} {tabInfo?.label}
              </span>
              {tab === "supplements" && (item as Supplement).brand && (
                <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }}>
                  {(item as Supplement).brand}
                </span>
              )}
              {tab === "accessories" && (item as Accessory).type && (
                <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }}>
                  {(item as Accessory).type}
                </span>
              )}
              {tab === "wellness" && (item as SavedWellnessItem).activityType && (
                <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }}>
                  {(item as SavedWellnessItem).activityType}
                </span>
              )}
            </div>
          </div>

          {/* Supplement details */}
          {tab === "supplements" && ((item as Supplement).dose || (item as Supplement).schedule) && (
            <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              {(item as Supplement).dose && <span>Dose: {(item as Supplement).dose}</span>}
              {(item as Supplement).schedule && <span>Schedule: {(item as Supplement).schedule}</span>}
            </div>
          )}

          {/* Meal macros */}
          {tab === "meals" && ((item as SavedMeal).calories || (item as SavedMeal).protein) && (
            <div className="flex gap-3 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
              {(item as SavedMeal).calories != null && <span>{(item as SavedMeal).calories} cal</span>}
              {(item as SavedMeal).protein != null && <span>{(item as SavedMeal).protein}g protein</span>}
              {(item as SavedMeal).carbs != null && <span>{(item as SavedMeal).carbs}g carbs</span>}
              {(item as SavedMeal).fat != null && <span>{(item as SavedMeal).fat}g fat</span>}
            </div>
          )}

          {/* Ingredients */}
          {tab === "meals" && (item as SavedMeal).ingredients?.length > 0 && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {(item as SavedMeal).ingredients.join(", ")}
            </p>
          )}

          {/* Workout exercises */}
          {tab === "workouts" &&
            (() => {
              try {
                const exercises = JSON.parse((item as SavedWorkout).exercisesJson);
                if (Array.isArray(exercises) && exercises.length > 0) {
                  return (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {exercises.map((e: { name: string }) => e.name).join(", ")}
                    </p>
                  );
                }
              } catch {
                /* ignore */
              }
              return null;
            })()}

          {/* Duration */}
          {tab === "wellness" && (item as SavedWellnessItem).durationMinutes != null && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {(item as SavedWellnessItem).durationMinutes} minutes
            </p>
          )}

          {/* Notes */}
          {notes && (
            <p className="text-sm" style={{ color: "var(--text)" }}>
              {notes}
            </p>
          )}

          {/* Referral Code */}
          {referralCode && (
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(36,63,22,0.08)", border: "1px solid rgba(36,63,22,0.2)" }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Referral Code
                </p>
                <p className="text-base font-bold tracking-wider" style={{ color: "#528531" }}>
                  {referralCode}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: copied ? "rgba(34,197,94,0.2)" : "rgba(36,63,22,0.15)",
                  color: copied ? "#22c55e" : "#528531",
                }}
              >
                <HiClipboardCopy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          {/* Link button */}
          {(link || (tab === "meals" && (item as SavedMeal).recipeSourceUrl) || (tab === "workouts" && (item as SavedWorkout).videoUrl)) && (
            <a
              href={link || (tab === "meals" ? (item as SavedMeal).recipeSourceUrl : (item as SavedWorkout).videoUrl) || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold btn-gradient transition-all"
              style={{ color: "#ffffff" }}
            >
              <HiExternalLink className="w-4 h-4" />
              {link ? "Shop Now" : tab === "workouts" ? "Watch Video" : "View Source"}
            </a>
          )}

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <HiTrash className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("meals");
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<AnyItem | null>(null);

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
    setSelectedItem(null);
  };

  const currentItems = (): AnyItem[] => {
    if (tab === "meals") return meals;
    if (tab === "workouts") return workouts;
    if (tab === "supplements") return supplements;
    if (tab === "accessories") return accessories;
    if (tab === "wellness") return wellness;
    return [];
  };

  const items = currentItems();
  const muted = "var(--text-muted)";

  const getItemPhotoUrl = (item: AnyItem): string | null => {
    if ("photoUrl" in item) return (item as { photoUrl: string | null }).photoUrl;
    return null;
  };

  const getItemLink = (item: AnyItem): string | null => {
    if ("link" in item) return (item as { link: string | null }).link;
    return null;
  };

  const getItemReferralCode = (item: AnyItem): string | null => {
    if ("referralCode" in item) return (item as { referralCode: string | null }).referralCode;
    return null;
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl"
            style={{ background: "rgba(36,63,22,0.04)", color: "var(--text)" }}
          >
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">My Catalog</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ background: "rgba(36,63,22,0.04)" }}>
            <button
              onClick={() => setViewMode("grid")}
              className="p-1.5 transition-all"
              style={{
                background: viewMode === "grid" ? "rgba(36,63,22,0.3)" : "transparent",
                color: viewMode === "grid" ? "#528531" : "var(--text-muted)",
              }}
            >
              <HiViewGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="p-1.5 transition-all"
              style={{
                background: viewMode === "list" ? "rgba(36,63,22,0.3)" : "transparent",
                color: viewMode === "list" ? "#528531" : "var(--text-muted)",
              }}
            >
              <HiViewList className="w-4 h-4" />
            </button>
          </div>
          {/* Add button */}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "#528531" }}
          >
            <HiPlus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={
              tab === t.key
                ? { background: "var(--brand)", color: "#ffffff" }
                : { background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }
            }
          >
            {t.emoji} {t.label}
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
        viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-sm animate-pulse" style={{ background: "rgba(36,63,22,0.04)" }} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(36,63,22,0.04)" }} />
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">{TABS.find((t) => t.key === tab)?.emoji}</p>
          <p className="text-sm" style={{ color: muted }}>
            No {tab} saved yet
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm font-medium px-4 py-2 rounded-xl btn-gradient"
            style={{ color: "#ffffff" }}
          >
            <HiPlus className="w-4 h-4 inline mr-1" />
            Add your first {tab === "accessories" ? "accessory" : tab.slice(0, -1)}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-3 gap-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="relative aspect-square overflow-hidden rounded-sm group"
            >
              {getItemPhotoUrl(item) ? (
                <img
                  src={getItemPhotoUrl(item)!}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[tab]} flex items-center justify-center`}
                >
                  <span className="text-3xl opacity-80">{TABS.find((t) => t.key === tab)?.emoji}</span>
                </div>
              )}

              {/* Bottom gradient overlay with name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                <p className="text-[10px] font-medium text-white truncate leading-tight">{item.name}</p>
              </div>

              {/* Link/referral badge */}
              {(getItemLink(item) || getItemReferralCode(item)) && (
                <div className="absolute top-1.5 right-1.5 p-1 rounded-full" style={{ background: "rgba(36,63,22,0.85)" }}>
                  <HiLink className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="flex items-center gap-3 p-3 rounded-xl w-full text-left transition-all"
              style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}
            >
              {/* Thumbnail */}
              {getItemPhotoUrl(item) ? (
                <img
                  src={getItemPhotoUrl(item)!}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className={`w-14 h-14 rounded-lg bg-gradient-to-br ${CATEGORY_GRADIENTS[tab]} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-xl">{TABS.find((t) => t.key === tab)?.emoji}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.name}</p>
                {"notes" in item && (item as { notes: string | null }).notes && (
                  <p className="text-xs truncate mt-0.5" style={{ color: muted }}>
                    {(item as { notes: string | null }).notes}
                  </p>
                )}
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {getItemReferralCode(item) && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(36,63,22,0.12)", color: "#528531" }}
                    >
                      Code: {getItemReferralCode(item)}
                    </span>
                  )}
                  {getItemLink(item) && !getItemReferralCode(item) && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5"
                      style={{ background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }}
                    >
                      <HiLink className="w-2.5 h-2.5" />
                      Link
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          tab={tab}
          onClose={() => setSelectedItem(null)}
          onDelete={() => handleDelete(selectedItem.id)}
        />
      )}
    </div>
  );
}
