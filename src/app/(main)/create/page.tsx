"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiArrowLeft } from "react-icons/hi";

type PostType = "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL";

export default function CreatePostPage() {
  const router = useRouter();
  const [type, setType] = useState<PostType>("WORKOUT");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Workout fields
  const [workoutName, setWorkoutName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [perceivedExertion, setPerceivedExertion] = useState("");
  const [moodAfter, setMoodAfter] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");

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
  const [wellnessMood, setWellnessMood] = useState("");
  const [wellnessNotes, setWellnessNotes] = useState("");

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
      };

      if (type === "WORKOUT") {
        if (!workoutName.trim()) {
          setError("Workout name is required");
          setSubmitting(false);
          return;
        }
        body.workout = {
          workoutName: workoutName.trim(),
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          perceivedExertion: perceivedExertion ? parseInt(perceivedExertion) : undefined,
          moodAfter: moodAfter ? parseInt(moodAfter) : undefined,
          notes: workoutNotes || undefined,
          exercises: [],
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
          moodAfter: wellnessMood ? parseInt(wellnessMood) : undefined,
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
        {/* Caption */}
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

        {/* Type-specific fields */}
        {type === "WORKOUT" && (
          <>
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
              <label className="block text-sm font-medium text-foreground mb-1">
                Mood After (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={moodAfter}
                onChange={(e) => setMoodAfter(e.target.value)}
                placeholder="8"
                className={inputClass}
              />
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
          </>
        )}

        {type === "MEAL" && (
          <>
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

        {type === "WELLNESS" && (
          <>
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
              <label className="block text-sm font-medium text-foreground mb-1">
                Mood After (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={wellnessMood}
                onChange={(e) => setWellnessMood(e.target.value)}
                placeholder="8"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
              <textarea
                value={wellnessNotes}
                onChange={(e) => setWellnessNotes(e.target.value)}
                rows={2}
                placeholder="How did it go?"
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
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
