"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HiArrowLeft, HiPlus, HiTrash, HiPhotograph, HiX, HiPlay, HiLightningBolt } from "react-icons/hi";
import toast from "react-hot-toast";
import { compressImage } from "@/lib/compress-image";

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
      const f = active ? "#a8a6ff" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(120,117,255,0.6)" : "rgba(0,0,0,0.25)";
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
      const f = active ? "#a8a6ff" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(120,117,255,0.6)" : "rgba(0,0,0,0.25)";
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
    icon: (active) => {
      const f = active ? "#a8a6ff" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(120,117,255,0.6)" : "rgba(0,0,0,0.25)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* upper leg / quad */}
          <path d="M10 4 Q9 4 8 6 L7 18 Q7 22 10 24 L13 26 Q15 27 16 26 L17 24 Q18 22 17 18 L16 6 Q15 4 14 4 Z" fill={f}/>
          {/* lower leg / calf */}
          <path d="M10 24 L13 26 L14 30 Q13 31 12 30 L9 28 Q8 26 10 24 Z" fill={f}/>
          <path d="M16 26 L17 24 Q19 26 18 28 L16 30 Q15 31 14 30 L14 30 Z" fill={f}/>
          {/* quad highlight */}
          <ellipse cx="12" cy="12" rx="2" ry="4" fill="rgba(255,255,255,0.18)" transform="rotate(-8,12,12)"/>
          {/* knee definition */}
          <path d="M9 20 Q13 23 17 20" stroke={s} strokeWidth="0.9" fill="none"/>
        </svg>
      );
    },
  },
  {
    id: "shoulders",
    label: "Shoulders",
    icon: (active) => {
      const f = active ? "#a8a6ff" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(120,117,255,0.6)" : "rgba(0,0,0,0.25)";
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
    icon: (active) => {
      const f = active ? "#a8a6ff" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(120,117,255,0.6)" : "rgba(0,0,0,0.25)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* upper arm */}
          <path d="M8 6 Q6 8 6 12 Q6 17 10 19 L14 20 Q16 20 17 18 Q18 15 16 12 Q14 9 12 8 Z" fill={f}/>
          {/* forearm */}
          <path d="M10 19 L14 20 L16 26 Q15 28 13 28 L10 27 Q8 25 9 22 Z" fill={f}/>
          {/* bicep peak */}
          <ellipse cx="11" cy="12" rx="2.5" ry="4" fill="rgba(255,255,255,0.2)" transform="rotate(-15,11,12)"/>
          {/* elbow curve */}
          <path d="M8 18 Q12 22 16 18" stroke={s} strokeWidth="0.9" fill="none"/>
        </svg>
      );
    },
  },
  {
    id: "core",
    label: "Core",
    icon: (active) => {
      const f = active ? "#a8a6ff" : "rgba(255,255,255,0.28)";
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
    icon: (active) => {
      const f = active ? "#a8a6ff" : "rgba(255,255,255,0.28)";
      const s = active ? "rgba(120,117,255,0.5)" : "rgba(0,0,0,0.2)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* left glute */}
          <path d="M3 14 Q3 8 9 7 Q15 6 16 12 L16 24 Q12 28 8 26 Q3 23 3 18 Z" fill={f}/>
          {/* right glute */}
          <path d="M29 14 Q29 8 23 7 Q17 6 16 12 L16 24 Q20 28 24 26 Q29 23 29 18 Z" fill={f}/>
          {/* glute divide */}
          <line x1="16" y1="12" x2="16" y2="25" stroke={s} strokeWidth="1.2"/>
          {/* highlights */}
          <ellipse cx="9" cy="14" rx="3" ry="3.5" fill="rgba(255,255,255,0.14)"/>
          <ellipse cx="23" cy="14" rx="3" ry="3.5" fill="rgba(255,255,255,0.14)"/>
        </svg>
      );
    },
  },
  {
    id: "cardio",
    label: "Cardio",
    icon: (active) => {
      const f = active ? "#f87171" : "rgba(255,255,255,0.28)";
      const accent = active ? "#fbbf24" : "rgba(255,255,255,0.15)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* heart shape */}
          <path d="M16 27 Q6 19 6 12 Q6 6 11 5 Q14 5 16 8 Q18 5 21 5 Q26 6 26 12 Q26 19 16 27 Z" fill={f}/>
          {/* flame inside heart */}
          <path d="M16 22 Q13 18 14 15 Q15 13 16 14 Q17 13 18 15 Q19 18 16 22 Z" fill={accent}/>
          {/* highlight */}
          <ellipse cx="12" cy="10" rx="2" ry="1.5" fill="rgba(255,255,255,0.25)" transform="rotate(-20,12,10)"/>
        </svg>
      );
    },
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
  { value: 3, emoji: "😮" },
  { value: 5, emoji: "😐" },
  { value: 7, emoji: "😤" },
  { value: 9, emoji: "🔥" },
  { value: 10, emoji: "🔥" },
];

function sliderTrackColor(value: number): string {
  const pct = ((value - 1) / 9) * 100;
  // purple(1) → amber(5) → red(10)
  if (value <= 5) {
    return `linear-gradient(to right, #7875ff 0%, #f59e0b ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
  }
  return `linear-gradient(to right, #7875ff 0%, #f59e0b 44%, #ef4444 ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
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
  mediaPreview, uploading, onRemove, onFileClick, fileInputRef, onFileChange,
}: {
  mediaPreview: string | null;
  uploading: boolean;
  onRemove: () => void;
  onFileClick: () => void;
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
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/heic,image/heif,video/mp4,video/quicktime"
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
        onChange={onFileChange}
      />
    </div>
  );
}

export default function CreatePostContent() {
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
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC");
  const [postDate, setPostDate] = useState("");
  const [showBackdate, setShowBackdate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successPost, setSuccessPost] = useState<{ id: string; type: PostType } | null>(null);

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
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [postTiming, setPostTiming] = useState<"BEFORE" | "DURING" | "AFTER">("AFTER");

  // ── Active session banner state ───────────────────────────────────────────
  const [sessionElapsed, setSessionElapsed] = useState<number | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount: pre-fill from workout session OR show live timer in banner
  useEffect(() => {
    const fromSession = searchParams.get("fromSession");
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("activeWorkout");
    } catch {
      return;
    }
    if (!raw) return;

    let session: Record<string, unknown>;
    try {
      session = JSON.parse(raw);
    } catch {
      return;
    }

    if (fromSession === "1") {
      // ── Pre-fill the create form from session data ──
      const elapsed =
        typeof session._finalElapsedMs === "number"
          ? (session._finalElapsedMs as number)
          : Math.max(
              0,
              Date.now() -
                (session.startTime as number) -
                (session.totalPausedMs as number)
            );

      if (session.workoutName) {
        setWorkoutName(session.workoutName as string);
        setEditingName(true);
      }
      if (session.notes) setCaption(session.notes as string);

      const mins = Math.max(1, Math.round(elapsed / 60000));
      setDurationMinutes(String(mins));

      const checkedExercises = (
        session.exercises as Array<{ name: string; checked: boolean }>
      ).filter((ex) => ex.checked && ex.name.trim());

      if (checkedExercises.length > 0) {
        setExercises(
          checkedExercises.map((ex) => ({
            name: ex.name.trim(),
            sets: [emptySet()],
          }))
        );
      }

      try {
        localStorage.removeItem("activeWorkout");
      } catch {
        // ignore
      }

      toast.success("Workout session loaded!", {
        icon: "✓",
        style: {
          background: "#1a1b2e",
          color: "#ffffff",
          border: "1px solid rgba(120,117,255,0.4)",
        },
      });
      return;
    }

    // ── Show live elapsed in the "Resume" banner ──
    const startTime = session.startTime as number;
    const totalPausedMs = session.totalPausedMs as number;
    const pausedAt = session.pausedAt as number | null;

    const computeElapsed = () =>
      Math.max(0, (pausedAt ?? Date.now()) - startTime - totalPausedMs);

    setSessionElapsed(computeElapsed());

    if (!pausedAt) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionElapsed(computeElapsed());
      }, 1000);
    }

    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const fileToUpload = await compressImage(file);
      const formData = new FormData();
      formData.append("file", fileToUpload);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        setMediaPreview(null);
        return;
      }
      const { url } = await res.json();
      setMediaUrl(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setError(errorMessage);
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
          muscleGroups: selectedMuscles,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          perceivedExertion: perceivedExertion ? parseInt(perceivedExertion) : undefined,
          moodAfter: energy,
          postTiming,
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

      const created = await res.json();
      setSuccessPost({ id: created.id, type: created.type as PostType });
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
    fileInputRef,
    onFileChange: handleFileChange,
  };

  const TYPE_LABELS: Record<PostType, string> = {
    WORKOUT: "Workout",
    MEAL: "Meal",
    WELLNESS: "Wellness",
    GENERAL: "General",
  };

  const TYPE_EMOJI: Record<PostType, string> = {
    WORKOUT: "💪",
    MEAL: "🥗",
    WELLNESS: "🧘",
    GENERAL: "📝",
  };

  // ── Success overlay ────────────────────────────────────────
  if (successPost) {
    const shareUrl = `https://royalwellness.app/p/${successPost.id}`;
    const copyLink = () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success("Link copied!");
      });
    };
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
        style={{ background: "var(--background)" }}
      >
        <style>{`
          @keyframes rf-pop { 0%{transform:scale(0.5);opacity:0} 65%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
          @keyframes rf-fade-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
          .rf-pop { animation: rf-pop 0.45s cubic-bezier(.34,1.56,.64,1) forwards; }
          .rf-fade-up-1 { animation: rf-fade-up 0.4s ease 0.35s forwards; opacity:0; }
          .rf-fade-up-2 { animation: rf-fade-up 0.4s ease 0.5s forwards; opacity:0; }
          .rf-fade-up-3 { animation: rf-fade-up 0.4s ease 0.65s forwards; opacity:0; }
        `}</style>

        {/* Animated badge */}
        <div className="rf-pop mb-6">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-6xl shadow-2xl"
            style={{ background: "linear-gradient(135deg, #7875ff 0%, #a78bfa 100%)" }}
          >
            {TYPE_EMOJI[successPost.type]}
          </div>
        </div>

        <h1
          className="rf-fade-up-1 text-3xl font-bold mb-1"
          style={{ color: "#ffffff" }}
        >
          Posted! 🎉
        </h1>
        <p
          className="rf-fade-up-2 text-base mb-10"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Your {TYPE_LABELS[successPost.type].toLowerCase()} is live
        </p>

        <div className="rf-fade-up-3 flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={copyLink}
            className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7875ff 0%, #a78bfa 100%)", color: "#fff" }}
          >
            🔗 Share Post
          </button>
          <button
            onClick={() => router.push("/feed")}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
          >
            View Feed
          </button>
        </div>
      </div>
    );
  }

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
                ? { background: "linear-gradient(135deg, #6360e8, #9b98ff)", color: "#ffffff" }
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
            {/* ── Start / Resume Workout Banner ── */}
            {!searchParams.get("fromSession") && (
              <button
                type="button"
                onClick={() => (window.location.href = "/workout")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-[0.98] mb-1"
                style={{
                  background:
                    sessionElapsed !== null
                      ? "rgba(34,197,94,0.07)"
                      : "rgba(120,117,255,0.08)",
                  border:
                    sessionElapsed !== null
                      ? "1px solid rgba(34,197,94,0.25)"
                      : "1px solid rgba(120,117,255,0.25)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        sessionElapsed !== null
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(120,117,255,0.10)",
                    }}
                  >
                    {sessionElapsed !== null ? (
                      <HiPlay className="w-5 h-5" style={{ color: "#4ade80" }} />
                    ) : (
                      <HiLightningBolt className="w-5 h-5" style={{ color: "#a8a6ff" }} />
                    )}
                  </div>
                  <div className="text-left">
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{
                        color: sessionElapsed !== null ? "#4ade80" : "#a8a6ff",
                      }}
                    >
                      {sessionElapsed !== null ? "Workout In Progress" : "Start a Live Workout"}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {sessionElapsed !== null
                        ? (() => {
                            const totalSecs = Math.floor(sessionElapsed / 1000);
                            const h = Math.floor(totalSecs / 3600);
                            const m = Math.floor((totalSecs % 3600) / 60);
                            const s = totalSecs % 60;
                            return h > 0
                              ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} — tap to resume`
                              : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} — tap to resume`;
                          })()
                        : "Timer + checklist — log it when you're done"}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                  style={{
                    background:
                      sessionElapsed !== null
                        ? "rgba(34,197,94,0.15)"
                        : "linear-gradient(135deg, #6360e8, #9b98ff)",
                    color: sessionElapsed !== null ? "#4ade80" : "#ffffff",
                  }}
                >
                  {sessionElapsed !== null ? "Resume →" : "Start →"}
                </div>
              </button>
            )}

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
                              background: "rgba(120,117,255,0.10)",
                              border: "1px solid rgba(168,166,255,0.5)",
                              color: "#a8a6ff",
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

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>Exercises</label>
                <button type="button" onClick={addExercise} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#a8a6ff" }}>
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
                      ? { background: "rgba(120,117,255,0.10)", border: "1px solid rgba(168,166,255,0.5)", color: "#a8a6ff" }
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
