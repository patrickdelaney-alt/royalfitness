"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HiArrowLeft, HiPlus, HiTrash, HiPhotograph, HiX, HiSparkles } from "react-icons/hi";

type PostType = "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL";

// Stock photo suggestions based on post type / workout keywords
const STOCK_PHOTOS: Record<string, { url: string; label: string }[]> = {
  WORKOUT: [
    { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop", label: "Gym weights" },
    { url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop", label: "Weight training" },
    { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop", label: "Barbell workout" },
    { url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop", label: "Push ups" },
    { url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=400&fit=crop", label: "Gym floor" },
    { url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&h=400&fit=crop", label: "Running" },
  ],
  MEAL: [
    { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop", label: "Healthy meal" },
    { url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop", label: "Fresh salad" },
    { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop", label: "Veggie bowl" },
    { url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop", label: "Protein plate" },
    { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop", label: "Grilled food" },
    { url: "https://images.unsplash.com/photo-1505576399279-0d754687a2d8?w=600&h=400&fit=crop", label: "Smoothie bowl" },
  ],
  WELLNESS: [
    { url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop", label: "Yoga" },
    { url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop", label: "Meditation" },
    { url: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&h=400&fit=crop", label: "Stretching" },
    { url: "https://images.unsplash.com/photo-1600618528240-fb9fc964b853?w=600&h=400&fit=crop", label: "Recovery" },
    { url: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&h=400&fit=crop", label: "Mindfulness" },
    { url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=400&fit=crop", label: "Nature walk" },
  ],
  GENERAL: [
    { url: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&h=400&fit=crop", label: "Fitness" },
    { url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop", label: "Active life" },
    { url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop", label: "Gym" },
    { url: "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=600&h=400&fit=crop", label: "Wellness" },
  ],
};

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

// ── Muscle Groups ────────────────────────────────────────────
interface MuscleGroup {
  id: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const MUSCLES: MuscleGroup[] = [
  {
    id: "chest",
    label: "Chest",
    icon: (active) => {
      const f = active ? "#8b88f8" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(109,106,245,0.6)" : "rgba(0,0,0,0.25)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* left pec */}
          <path d="M4 10 Q4 5 9 5 Q14 5 15.5 10 L15.5 19 Q11 22 7 20 Q3 17 4 13 Z" fill={f}/>
          {/* right pec */}
          <path d="M28 10 Q28 5 23 5 Q18 5 16.5 10 L16.5 19 Q21 22 25 20 Q29 17 28 13 Z" fill={f}/>
          {/* collarbone */}
          <path d="M9 6 Q16 4 23 6" stroke={s} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          {/* center groove */}
          <line x1="16" y1="10" x2="16" y2="20" stroke={s} strokeWidth="1.2"/>
          {/* muscle highlight */}
          <ellipse cx="10.5" cy="10" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.15)" transform="rotate(-15,10.5,10)"/>
          <ellipse cx="21.5" cy="10" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.15)" transform="rotate(15,21.5,10)"/>
        </svg>
      );
    },
  },
  {
    id: "back",
    label: "Back",
    icon: (active) => {
      const f = active ? "#8b88f8" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(109,106,245,0.6)" : "rgba(0,0,0,0.25)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* lat spread V-taper */}
          <path d="M16 27 L3 19 L3 11 L9 7 L16 10 L23 7 L29 11 L29 19 Z" fill={f}/>
          {/* spine */}
          <line x1="16" y1="10" x2="16" y2="27" stroke={s} strokeWidth="1.5"/>
          {/* trap shoulder line */}
          <path d="M9 7 Q16 9 23 7" stroke={s} strokeWidth="1.2" fill="none"/>
          {/* lat definition */}
          <path d="M7 16 Q16 18 25 16" stroke={s} strokeWidth="0.9" fill="none"/>
          {/* highlight */}
          <ellipse cx="10" cy="13" rx="3" ry="2" fill="rgba(255,255,255,0.12)" transform="rotate(20,10,13)"/>
          <ellipse cx="22" cy="13" rx="3" ry="2" fill="rgba(255,255,255,0.12)" transform="rotate(-20,22,13)"/>
        </svg>
      );
    },
  },
  {
    id: "legs",
    label: "Legs",
    icon: (active) => (
      <span
        style={{
          fontSize: "22px",
          lineHeight: 1,
          filter: active ? "drop-shadow(0 0 6px rgba(139,136,248,0.9))" : "grayscale(0.2)",
          opacity: active ? 1 : 0.55,
        }}
      >
        🦵
      </span>
    ),
  },
  {
    id: "shoulders",
    label: "Shoulders",
    icon: (active) => {
      const f = active ? "#8b88f8" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(109,106,245,0.6)" : "rgba(0,0,0,0.25)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* left delt cap */}
          <circle cx="6.5" cy="15" r="5.5" fill={f}/>
          {/* right delt cap */}
          <circle cx="25.5" cy="15" r="5.5" fill={f}/>
          {/* trap/neck body */}
          <path d="M12 15 Q16 10 20 15 L20 22 Q16 25 12 22 Z" fill={f}/>
          {/* neck */}
          <rect x="13.5" y="7" width="5" height="6" rx="2.5" fill={f}/>
          {/* delt highlight */}
          <ellipse cx="5" cy="13" rx="2" ry="1.5" fill="rgba(255,255,255,0.2)" transform="rotate(-20,5,13)"/>
          <ellipse cx="27" cy="13" rx="2" ry="1.5" fill="rgba(255,255,255,0.2)" transform="rotate(20,27,13)"/>
          {/* seam lines */}
          <path d="M12 15 Q9 14 6.5 15" stroke={s} strokeWidth="0.8" fill="none"/>
          <path d="M20 15 Q23 14 25.5 15" stroke={s} strokeWidth="0.8" fill="none"/>
        </svg>
      );
    },
  },
  {
    id: "arms",
    label: "Arms",
    icon: (active) => (
      <span
        style={{
          fontSize: "22px",
          lineHeight: 1,
          filter: active ? "drop-shadow(0 0 6px rgba(139,136,248,0.9))" : "grayscale(0.2)",
          opacity: active ? 1 : 0.55,
        }}
      >
        💪
      </span>
    ),
  },
  {
    id: "core",
    label: "Core",
    icon: (active) => {
      const f = active ? "#8b88f8" : "rgba(255,255,255,0.28)";
      const gap = active ? "rgba(13,14,25,0.7)" : "rgba(0,0,0,0.35)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* 6-pack: 2 columns × 3 rows */}
          <rect x="7"  y="5"  width="7" height="6" rx="2" fill={f}/>
          <rect x="18" y="5"  width="7" height="6" rx="2" fill={f}/>
          <rect x="7"  y="13" width="7" height="6" rx="2" fill={f}/>
          <rect x="18" y="13" width="7" height="6" rx="2" fill={f}/>
          <rect x="7"  y="21" width="7" height="6" rx="2" fill={f}/>
          <rect x="18" y="21" width="7" height="6" rx="2" fill={f}/>
          {/* highlights */}
          <rect x="8"  y="6"  width="3" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
          <rect x="19" y="6"  width="3" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
        </svg>
      );
    },
  },
  {
    id: "glutes",
    label: "Glutes",
    icon: (active) => (
      <span
        style={{
          fontSize: "22px",
          lineHeight: 1,
          filter: active ? "drop-shadow(0 0 6px rgba(139,136,248,0.9))" : "grayscale(0.2)",
          opacity: active ? 1 : 0.55,
        }}
      >
        🍑
      </span>
    ),
  },
  {
    id: "cardio",
    label: "Cardio",
    icon: (active) => (
      <span
        style={{
          fontSize: "22px",
          lineHeight: 1,
          filter: active ? "drop-shadow(0 0 6px rgba(239,68,68,0.8))" : "grayscale(0.2)",
          opacity: active ? 1 : 0.55,
        }}
      >
        ❤️‍🔥
      </span>
    ),
  },
];

const MUSCLE_NAMES: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  glutes: "Glutes",
  cardio: "Cardio",
};

// ── Energy Slider ────────────────────────────────────────────
const ENERGY_STEPS = [
  { value: 1, emoji: "💀" },
  { value: 3, emoji: "😮‍💨" },
  { value: 5, emoji: "😐" },
  { value: 7, emoji: "💪" },
  { value: 9, emoji: "🔥" },
  { value: 10, emoji: "🔥" },
];

function sliderTrackColor(value: number): string {
  const pct = ((value - 1) / 9) * 100;
  // purple(1) → amber(5) → red(10)
  if (value <= 5) {
    return `linear-gradient(to right, #6d6af5 0%, #f59e0b ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
  }
  return `linear-gradient(to right, #6d6af5 0%, #f59e0b 44%, #ef4444 ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
}

function EnergySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const currentEmoji = ENERGY_STEPS.reduce((acc, s) => (value >= s.value ? s.emoji : acc), "💀");
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
          Energy Level
        </label>
        <span className="text-xl">{currentEmoji}</span>
      </div>
      <div className="relative pt-1 pb-1">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="energy-slider w-full h-2 appearance-none rounded-full cursor-pointer"
          style={{ background: sliderTrackColor(value) }}
        />
        <div className="flex justify-between mt-2 px-0.5">
          {ENERGY_STEPS.slice(0, 5).map((s) => (
            <span key={s.value} className="text-sm">{s.emoji}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mood Slider (for Wellness) ────────────────────────────────
const moodLabels: Record<number, string> = {
  1: "Awful", 2: "Bad", 3: "Meh", 4: "Low", 5: "Okay",
  6: "Decent", 7: "Good", 8: "Great", 9: "Amazing", 10: "On Top",
};

function MoodSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = ((value - 1) / 9) * 100;
  const hue = (value - 1) * (120 / 9);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>Mood After</label>
        <span
          className="text-sm font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `hsl(${hue}, 70%, 20%)`, color: `hsl(${hue}, 80%, 65%)` }}
        >
          {value} — {moodLabels[value]}
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
          className="energy-slider w-full h-2 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(${hue},80%,45%) 0%, hsl(${hue},80%,45%) ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
          }}
        />
        <div className="flex justify-between mt-1 px-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="text-[10px] w-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Media Upload Block (shared across types) ─────────────────
function MediaBlock({
  mediaPreview, uploading, onRemove, onFileClick, showSuggestions, onToggleSuggestions, suggestions, onSelectStock, fileInputRef, onFileChange,
}: {
  mediaPreview: string | null;
  uploading: boolean;
  onRemove: () => void;
  onFileClick: () => void;
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
  suggestions: { url: string; label: string }[];
  onSelectStock: (url: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Photo / Video</label>
      {mediaPreview ? (
        <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <button onClick={onRemove} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
            <HiX className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onFileClick}
            className="w-full rounded-xl py-8 flex flex-col items-center gap-2 transition-colors"
            style={{
              border: "2px dashed rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <HiPhotograph className="w-8 h-8" />
            <span className="text-sm">Add photo or video</span>
          </button>
          <button
            type="button"
            onClick={onToggleSuggestions}
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "#8b88f8" }}
          >
            <HiSparkles className="w-3.5 h-3.5" />
            {showSuggestions ? "Hide suggested photos" : "Browse stock photos"}
          </button>
          {showSuggestions && (
            <div className="grid grid-cols-3 gap-2">
              {suggestions.map((photo) => (
                <button
                  key={photo.url}
                  type="button"
                  onClick={() => onSelectStock(photo.url)}
                  className="relative rounded-lg overflow-hidden transition-colors aspect-[3/2]"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 text-center truncate">
                    {photo.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialType = ((): PostType => {
    const param = searchParams.get("type")?.toUpperCase();
    if (param && ["WORKOUT", "MEAL", "WELLNESS", "GENERAL"].includes(param)) {
      return param as PostType;
    }
    return "WORKOUT";
  })();

  const [type, setType] = useState<PostType>(initialType);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC");
  const [postDate, setPostDate] = useState("");
  const [showBackdate, setShowBackdate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Media upload
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Workout fields
  const [workoutName, setWorkoutName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [isClass, setIsClass] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [perceivedExertion, setPerceivedExertion] = useState("");
  const [energy, setEnergy] = useState(7);
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

  // Stock photo suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => STOCK_PHOTOS[type] || STOCK_PHOTOS.GENERAL, [type]);

  const selectStockPhoto = (url: string) => {
    setMediaUrl(url);
    setMediaPreview(url);
    setShowSuggestions(false);
  };

  // Wellness fields
  const [activityType, setActivityType] = useState("");
  const [wellnessDuration, setWellnessDuration] = useState("");
  const [intensity, setIntensity] = useState("");
  const [wellnessMood, setWellnessMood] = useState(7);
  const [wellnessNotes, setWellnessNotes] = useState("");

  // ── Muscle toggle with auto-name ──────────────────────────
  const toggleMuscle = (id: string) => {
    setSelectedMuscles((prev) => {
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      if (!editingName) {
        if (next.length === 0) {
          setWorkoutName("");
        } else if (next.length === 1) {
          setWorkoutName(`${MUSCLE_NAMES[next[0]]} Day`);
        } else {
          const [first, ...rest] = next;
          setWorkoutName(`${MUSCLE_NAMES[first]} + ${rest.length} more`);
        }
      }
      return next;
    });
  };

  // ── Media upload ──────────────────────────────────────────
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

  // ── Exercise helpers ──────────────────────────────────────
  const addExercise = () => setExercises((prev) => [...prev, emptyExercise()]);
  const removeExercise = (idx: number) => setExercises((prev) => prev.filter((_, i) => i !== idx));
  const updateExerciseName = (idx: number, name: string) =>
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, name } : ex)));
  const addSet = (exIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex))
    );
  const removeSet = (exIdx: number, setIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) } : ex
      )
    );
  const updateSet = (exIdx: number, setIdx: number, field: keyof ExerciseSet, value: string) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, [field]: value } : s)) }
          : ex
      )
    );

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        caption: caption || undefined,
        visibility,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        mediaUrl: mediaUrl || undefined,
        postDate: postDate || undefined,
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
          moodAfter: energy,
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
          ingredients: ingredients.split(",").map((i) => i.trim()).filter(Boolean),
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

  const mediaProps = {
    mediaPreview,
    uploading,
    onRemove: removeMedia,
    onFileClick: () => fileInputRef.current?.click(),
    showSuggestions,
    onToggleSuggestions: () => setShowSuggestions((v) => !v),
    suggestions,
    onSelectStock: selectStockPhoto,
    fileInputRef,
    onFileChange: handleFileChange,
  };

  const TYPE_LABELS: Record<PostType, string> = {
    WORKOUT: "Workout",
    MEAL: "Meal",
    WELLNESS: "Wellness",
    GENERAL: "General",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "#ffffff" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">New Post</h1>
      </div>

      {/* Post type selector */}
      <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
        {(["WORKOUT", "MEAL", "WELLNESS", "GENERAL"] as PostType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={
              type === t
                ? { background: "linear-gradient(135deg, #6d6af5 0%, #8b88f8 100%)", color: "#ffffff" }
                : { background: "transparent", color: "rgba(255,255,255,0.4)" }
            }
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* ─── WORKOUT ─────────────────────────────────────── */}
        {type === "WORKOUT" && (
          <>
            {/* 1. Muscle group selector */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>
                Target Muscles
              </label>
              <div className="grid grid-cols-4 gap-2">
                {MUSCLES.map((m) => {
                  const active = selectedMuscles.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMuscle(m.id)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all text-xs font-medium"
                      style={
                        active
                          ? {
                              background: "rgba(109,106,245,0.2)",
                              border: "1px solid rgba(139,136,248,0.5)",
                              color: "#8b88f8",
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              color: "rgba(255,255,255,0.4)",
                            }
                      }
                    >
                      {m.icon(active)}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Workout Name */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                Workout Name *
              </label>
              <input
                value={workoutName}
                onChange={(e) => {
                  setWorkoutName(e.target.value);
                  setEditingName(true);
                }}
                onBlur={() => { if (!workoutName.trim()) setEditingName(false); }}
                placeholder="e.g. Upper Body, Leg Day"
                className="input-dark w-full"
              />
            </div>

            {/* 3. Media */}
            <MediaBlock {...mediaProps} />

            {/* 4. Energy slider */}
            <EnergySlider value={energy} onChange={setEnergy} />

            {/* 5. Caption */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="How did the workout go?"
                className="textarea-dark w-full resize-none"
              />
            </div>

            {/* Group class toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isClass}
                onChange={(e) => setIsClass(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span style={{ color: "rgba(255,255,255,0.8)" }}>Group class</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Duration (min)</label>
                <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="60" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Exertion (1-10)</label>
                <input type="number" min="1" max="10" value={perceivedExertion} onChange={(e) => setPerceivedExertion(e.target.value)} placeholder="7" className="input-dark w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Notes</label>
              <textarea value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)} rows={2} placeholder="Any notes about this workout..." className="textarea-dark w-full resize-none" />
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>Exercises</label>
                <button type="button" onClick={addExercise} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#8b88f8" }}>
                  <HiPlus className="w-4 h-4" />
                  Add exercise
                </button>
              </div>

              {exercises.length === 0 && (
                <p className="text-xs text-center py-3 rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}>
                  No exercises added yet
                </p>
              )}

              <div className="space-y-3">
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={ex.name}
                        onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                        placeholder="Exercise name (e.g. Bench Press)"
                        className="input-dark flex-1"
                      />
                      <button type="button" onClick={() => removeExercise(exIdx)} className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex gap-1.5 items-center">
                          <span className="text-xs w-8 flex-shrink-0 text-center font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                            S{setIdx + 1}
                          </span>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                            placeholder="Reps"
                            className="input-dark w-16 text-xs px-2 py-1"
                          />
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                            placeholder="Wt"
                            className="input-dark w-20 text-xs px-2 py-1"
                          />
                          <select
                            value={set.unit}
                            onChange={(e) => updateSet(exIdx, setIdx, "unit", e.target.value)}
                            className="select-dark w-14 text-xs px-1 py-1"
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
                            className="input-dark w-14 text-xs px-2 py-1"
                          />
                          {ex.sets.length > 1 && (
                            <button type="button" onClick={() => removeSet(exIdx, setIdx)} style={{ color: "rgba(255,255,255,0.25)" }}>
                              <HiX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={() => addSet(exIdx)} className="mt-2 flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
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
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Meal Name *</label>
              <input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. Protein Smoothie, Chicken Rice Bowl" className="input-dark w-full" />
            </div>

            <MediaBlock {...mediaProps} />

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Tell us about this meal..." className="textarea-dark w-full resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Meal Type</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="select-dark w-full">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Ingredients (comma-separated)</label>
              <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="chicken, rice, broccoli" className="input-dark w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Calories</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="500" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Protein (g)</label>
                <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="30" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Carbs (g)</label>
                <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="50" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Fat (g)</label>
                <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="15" className="input-dark w-full" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={saveToCatalog} onChange={(e) => setSaveToCatalog(e.target.checked)} className="accent-primary w-4 h-4" />
              <span style={{ color: "rgba(255,255,255,0.8)" }}>Save to my meal catalog</span>
            </label>
          </>
        )}

        {/* ─── WELLNESS ────────────────────────────────────── */}
        {type === "WELLNESS" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Activity Type *</label>
              <input value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="e.g. Yoga, Meditation, Sauna" className="input-dark w-full" />
            </div>

            <MediaBlock {...mediaProps} />

            <MoodSlider value={wellnessMood} onChange={setWellnessMood} />

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="How did it go?" className="textarea-dark w-full resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Duration (min)</label>
                <input type="number" value={wellnessDuration} onChange={(e) => setWellnessDuration(e.target.value)} placeholder="30" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Intensity (1-10)</label>
                <input type="number" min="1" max="10" value={intensity} onChange={(e) => setIntensity(e.target.value)} placeholder="5" className="input-dark w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Notes</label>
              <textarea value={wellnessNotes} onChange={(e) => setWellnessNotes(e.target.value)} rows={2} placeholder="Any notes..." className="textarea-dark w-full resize-none" />
            </div>
          </>
        )}

        {/* ─── GENERAL ─────────────────────────────────────── */}
        {type === "GENERAL" && (
          <>
            <MediaBlock {...mediaProps} />
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="What's on your mind?" className="textarea-dark w-full resize-none" />
            </div>
          </>
        )}

        {/* ─── Common fields ───────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Tags (comma-separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="gym, gains, health" className="input-dark w-full" />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>Visibility</label>
          <div className="flex gap-2">
            {(["PUBLIC", "FOLLOWERS", "PRIVATE"] as const).map((v) => {
              const labels = { PUBLIC: "🌍 Public", FOLLOWERS: "👥 Followers", PRIVATE: "🔒 Private" };
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={
                    visibility === v
                      ? { background: "rgba(109,106,245,0.2)", border: "1px solid rgba(139,136,248,0.5)", color: "#8b88f8" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {labels[v]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Backdate */}
        <div>
          <button
            type="button"
            onClick={() => { setShowBackdate((v) => !v); if (showBackdate) setPostDate(""); }}
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {showBackdate ? "▲ Hide backdate" : "▼ Backdate this post"}
          </button>
          {showBackdate && (
            <div className="mt-2">
              <input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="input-dark w-full"
              />
              {postDate && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Will appear as posted on {new Date(postDate + "T12:00:00").toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="w-full py-3 rounded-xl font-semibold transition-all btn-gradient shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: "#ffffff" }}
        >
          {uploading ? "Uploading media..." : submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
