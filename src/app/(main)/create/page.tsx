"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { HiArrowLeft, HiPlus, HiTrash, HiPhotograph, HiX } from "react-icons/hi";

type PostType = "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL";

interface ExerciseSet {
  reps: string;
  weight: string;
  unit: string;
  rpe: string;
}

interface Exercise {
  name: string;
  sets: ExerciseSet[];
}

const emptySet = (): ExerciseSet => ({ reps: "", weight: "", unit: "lbs", rpe: "" });
const emptyExercise = (): Exercise => ({ name: "", sets: [emptySet()] });

const moodLabels: Record<number, string> = {
  1: "Awful",
  2: "Bad",
  3: "Meh",
  4: "Low",
  5: "Okay",
  6: "Decent",
  7: "Good",
  8: "Great",
  9: "Amazing",
  10: "On Top",
};

function MoodSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - 1) / 9) * 100;
  // Color goes from red (1) to yellow (5) to green (10)
  const hue = (value - 1) * (120 / 9); // 0 = red, 120 = green

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-foreground">Mood After</label>
        <span
          className="text-sm font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `hsl(${hue}, 80%, 90%)`, color: `hsl(${hue}, 70%, 30%)` }}
        >
          {value} &mdash; {moodLabels[value]}
        </span>
      </div>
      <div className="relative pt-1 pb-2">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(${hue}, 80%, 55%) 0%, hsl(${hue}, 80%, 55%) ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
          }}
        />
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: white;
            border: 3px solid hsl(${hue}, 80%, 55%);
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: white;
            border: 3px solid hsl(${hue}, 80%, 55%);
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          }
        `}</style>
        <div className="flex justify-between mt-1 px-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="text-[10px] text-muted w-4 text-center">
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<PostType>("WORKOUT");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Media upload
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Workout fields
  const [workoutName, setWorkoutName] = useState("");
  const [isClass, setIsClass] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [perceivedExertion, setPerceivedExertion] = useState("");
  const [moodAfter, setMoodAfter] = useState(7);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Meal fields
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("snack");
  const [ingredients, setIngredients] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  // Wellness fields
  const [activityType, setActivityType] = useState("");
  const [wellnessDuration, setWellnessDuration] = useState("");
  const [intensity, setIntensity] = useState("");
  const [wellnessMood, setWellnessMood] = useState(7);
  const [wellnessNotes, setWellnessNotes] = useState("");

  // ── Media upload ──────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        setMediaPreview(null);
        return;
      }
      const { url } = await res.json();
      setMediaUrl(url);
    } catch {
      setError("Upload failed");
      setMediaPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Exercise helpers ──────────────────────────────────────────

  const addExercise = () => setExercises((prev) => [...prev, emptyExercise()]);

  const removeExercise = (idx: number) =>
    setExercises((prev) => prev.filter((_, i) => i !== idx));

  const updateExerciseName = (idx: number, name: string) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, name } : ex))
    );

  const addSet = (exIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex
      )
    );

  const removeSet = (exIdx: number, setIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) }
          : ex
      )
    );

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof ExerciseSet,
    value: string
  ) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, si) =>
                si === setIdx ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );

  // ── Submit ────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        type,
        caption: caption || undefined,
        visibility,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        mediaUrl: mediaUrl || undefined,
      };

      if (type === "WORKOUT") {
        if (!workoutName.trim()) {
          setError("Workout name is required");
          setSubmitting(false);
          return;
        }
        body.workout = {
          workoutName: workoutName.trim(),
          isClass,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          perceivedExertion: perceivedExertion ? parseInt(perceivedExertion) : undefined,
          moodAfter,
          notes: workoutNotes || undefined,
          exercises: exercises
            .filter((ex) => ex.name.trim())
            .map((ex) => ({
              name: ex.name.trim(),
              sets: ex.sets
                .filter((s) => s.reps || s.weight)
                .map((s) => ({
                  reps: s.reps ? parseInt(s.reps) : undefined,
                  weight: s.weight ? parseFloat(s.weight) : undefined,
                  unit: s.unit,
                  rpe: s.rpe ? parseInt(s.rpe) : undefined,
                })),
            })),
        };
      }

      if (type === "MEAL") {
        if (!mealName.trim()) {
          setError("Meal name is required");
          setSubmitting(false);
          return;
        }
        body.meal = {
          mealName: mealName.trim(),
          mealType,
          ingredients: ingredients
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean),
          calories: calories ? parseInt(calories) : undefined,
          protein: protein ? parseFloat(protein) : undefined,
          carbs: carbs ? parseFloat(carbs) : undefined,
          fat: fat ? parseFloat(fat) : undefined,
          saveToCatalog,
        };
      }

      if (type === "WELLNESS") {
        if (!activityType.trim()) {
          setError("Activity type is required");
          setSubmitting(false);
          return;
        }
        body.wellness = {
          activityType: activityType.trim(),
          durationMinutes: wellnessDuration ? parseInt(wellnessDuration) : undefined,
          intensity: intensity ? parseInt(intensity) : undefined,
          moodAfter: wellnessMood,
          notes: wellnessNotes || undefined,
        };
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create post");
        return;
      }

      router.push("/feed");
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-muted hover:text-foreground">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">New Post</h1>
      </div>

      {/* Post type selector */}
      <div className="flex gap-2 mb-5">
        {(["WORKOUT", "MEAL", "WELLNESS", "GENERAL"] as PostType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === t
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="space-y-4">
        {/* ─── WORKOUT ─────────────────────────────────────── */}
        {type === "WORKOUT" && (
          <>
            {/* 1. Workout Name (top) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Workout Name *
              </label>
              <input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g. Upper Body, Leg Day"
                className={inputClass}
              />
            </div>

            {/* 2. Photo / Video */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Photo / Video</label>
              {mediaPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2 text-muted hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <HiPhotograph className="w-8 h-8" />
                  <span className="text-sm">Add photo or video</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* 3. Mood After (slider) */}
            <MoodSlider value={moodAfter} onChange={setMoodAfter} />

            {/* 4. Caption */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="How did the workout go?"
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Additional workout fields */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isClass}
                  onChange={(e) => setIsClass(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-foreground">Group class</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="60"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Exertion (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={perceivedExertion}
                  onChange={(e) => setPerceivedExertion(e.target.value)}
                  placeholder="7"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                rows={2}
                placeholder="Any notes about this workout..."
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Exercises</label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary-dark"
                >
                  <HiPlus className="w-4 h-4" />
                  Add exercise
                </button>
              </div>

              {exercises.length === 0 && (
                <p className="text-xs text-muted text-center py-3 border border-dashed border-border rounded-lg">
                  No exercises added yet
                </p>
              )}

              <div className="space-y-3">
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="border border-border rounded-xl p-3 bg-gray-50/50">
                    <div className="flex gap-2 mb-2">
                      <input
                        value={ex.name}
                        onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                        placeholder="Exercise name (e.g. Bench Press)"
                        className={inputClass + " flex-1"}
                      />
                      <button
                        type="button"
                        onClick={() => removeExercise(exIdx)}
                        className="text-muted hover:text-red-500 flex-shrink-0"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Sets */}
                    <div className="space-y-2">
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex gap-1.5 items-center">
                          <span className="text-xs text-muted w-8 flex-shrink-0 text-center font-medium">
                            S{setIdx + 1}
                          </span>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                            placeholder="Reps"
                            className="border border-border rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary w-16"
                          />
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                            placeholder="Weight"
                            className="border border-border rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary w-20"
                          />
                          <select
                            value={set.unit}
                            onChange={(e) => updateSet(exIdx, setIdx, "unit", e.target.value)}
                            className="border border-border rounded-md px-1 py-1 text-xs bg-background focus:outline-none w-14"
                          >
                            <option value="lbs">lbs</option>
                            <option value="kg">kg</option>
                          </select>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={set.rpe}
                            onChange={(e) => updateSet(exIdx, setIdx, "rpe", e.target.value)}
                            placeholder="RPE"
                            className="border border-border rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary w-14"
                          />
                          {ex.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(exIdx, setIdx)}
                              className="text-muted hover:text-red-500 flex-shrink-0"
                            >
                              <HiX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addSet(exIdx)}
                      className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-primary"
                    >
                      <HiPlus className="w-3.5 h-3.5" />
                      Add set
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── MEAL ────────────────────────────────────────── */}
        {type === "MEAL" && (
          <>
            {/* 1. Meal Name (top) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Meal Name *
              </label>
              <input
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g. Protein Smoothie, Chicken Rice Bowl"
                className={inputClass}
              />
            </div>

            {/* 2. Photo / Video */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Photo / Video</label>
              {mediaPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2 text-muted hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <HiPhotograph className="w-8 h-8" />
                  <span className="text-sm">Add photo or video</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* 3. Caption */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Tell us about this meal..."
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Meal-specific fields */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className={inputClass}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Ingredients (comma-separated)
              </label>
              <input
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="chicken, rice, broccoli"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="500"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="30"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="50"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="15"
                  className={inputClass}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveToCatalog}
                onChange={(e) => setSaveToCatalog(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-foreground">Save to my meal catalog</span>
            </label>
          </>
        )}

        {/* ─── WELLNESS ────────────────────────────────────── */}
        {type === "WELLNESS" && (
          <>
            {/* 1. Activity Type (top) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Activity Type *
              </label>
              <input
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                placeholder="e.g. Yoga, Meditation, Sauna"
                className={inputClass}
              />
            </div>

            {/* 2. Photo / Video */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Photo / Video</label>
              {mediaPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2 text-muted hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <HiPhotograph className="w-8 h-8" />
                  <span className="text-sm">Add photo or video</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* 3. Mood After (slider) */}
            <MoodSlider value={wellnessMood} onChange={setWellnessMood} />

            {/* 4. Caption */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="How did it go?"
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Additional wellness fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={wellnessDuration}
                  onChange={(e) => setWellnessDuration(e.target.value)}
                  placeholder="30"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Intensity (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                  placeholder="5"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
              <textarea
                value={wellnessNotes}
                onChange={(e) => setWellnessNotes(e.target.value)}
                rows={2}
                placeholder="Any notes..."
                className={inputClass + " resize-none"}
              />
            </div>
          </>
        )}

        {/* ─── GENERAL ─────────────────────────────────────── */}
        {type === "GENERAL" && (
          <>
            {/* 1. Photo / Video */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Photo / Video</label>
              {mediaPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2 text-muted hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <HiPhotograph className="w-8 h-8" />
                  <span className="text-sm">Add photo or video</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* 2. Caption */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="What's on your mind?"
                className={inputClass + " resize-none"}
              />
            </div>
          </>
        )}

        {/* Common fields */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Tags (comma-separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="gym, gains, health"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Visibility</label>
          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "PUBLIC" | "FOLLOWERS" | "PRIVATE")
            }
            className={inputClass}
          >
            <option value="PUBLIC">Public</option>
            <option value="FOLLOWERS">Followers Only</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="w-full py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading media..." : submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
