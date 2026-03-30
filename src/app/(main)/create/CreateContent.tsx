"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HiArrowLeft, HiPlus, HiTrash, HiPhotograph, HiX, HiPlay, HiLightningBolt, HiLocationMarker, HiSearch } from "react-icons/hi";
import toast from "react-hot-toast";
import { compressImage } from "@/lib/compress-image";
import { successNotification } from "@/lib/haptics";
import { parseEmbedUrl, type EmbedProvider } from "@/lib/embed-parser";
import { isCapacitorNative, openExternalLink } from "@/lib/link-handler";

type PostType = "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL" | "CHECKIN";

interface GymResult {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface EmbedPreview {
  provider: EmbedProvider;
  url: string;
  contentId: string;
  title?: string;
  thumbnailUrl?: string;
}


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

const CREATE_DRAFT_STORAGE_KEY = "rf_create_draft_v1";
const AUTOSAVE_DEBOUNCE_MS = 600;
const RECENT_AUTOSAVE_WINDOW_MS = 5000;
const LEAVE_WARNING_MESSAGE = "You have unsaved changes. Leave this page?";

interface CreateDraftV1 {
  version: 1;
  type: PostType;
  payload: {
    caption: string;
    visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
    postDate: string;
    workout: {
      workoutName: string;
      editingName: boolean;
      selectedMuscles: string[];
      isClass: boolean;
      durationMinutes: string;
      perceivedExertion: string;
      energy: number;
      exercises: Exercise[];
      postTiming: "BEFORE" | "DURING" | "AFTER";
      showAdvanced: boolean;
    };
    meal: {
      mealName: string;
      mealType: string;
      ingredients: string;
      calories: string;
      protein: string;
      carbs: string;
      fat: string;
      saveToCatalog: boolean;
    };
    wellness: {
      activityType: string;
      wellnessDuration: string;
      intensity: string;
      wellnessMood: number;
    };
    checkIn: {
      checkInGymId: string | null;
      checkInGymName: string;
      gymSearchQuery: string;
    };
    media: {
      mediaUrl: string | null;
      previewRef: string | null;
      hasPendingUpload: boolean;
    };
    embed: {
      embedInput: string;
      embedPreview: EmbedPreview | null;
    };
  };
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
      const f = active ? "#528531" : "var(--text-muted)";
      const s = active ? "rgba(36,63,22,0.6)" : "rgba(24,25,15,0.09)";
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
          <ellipse cx="10.5" cy="10" rx="2.5" ry="1.5" fill="rgba(36,63,22,0.15)" transform="rotate(-15,10.5,10)"/>
          <ellipse cx="21.5" cy="10" rx="2.5" ry="1.5" fill="rgba(36,63,22,0.15)" transform="rotate(15,21.5,10)"/>
        </svg>
      );
    },
  },
  {
    id: "back",
    label: "Back",
    icon: (active) => {
      const f = active ? "#528531" : "var(--text-muted)";
      const s = active ? "rgba(36,63,22,0.6)" : "rgba(24,25,15,0.09)";
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
          <ellipse cx="10" cy="13" rx="3" ry="2" fill="rgba(36,63,22,0.12)" transform="rotate(20,10,13)"/>
          <ellipse cx="22" cy="13" rx="3" ry="2" fill="rgba(36,63,22,0.12)" transform="rotate(-20,22,13)"/>
        </svg>
      );
    },
  },
  {
    id: "legs",
    label: "Legs",
    icon: (active) => {
      const f = active ? "#528531" : "var(--text-muted)";
      const s = active ? "rgba(36,63,22,0.6)" : "rgba(24,25,15,0.09)";
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
      const f = active ? "#528531" : "var(--text-muted)";
      const s = active ? "rgba(36,63,22,0.6)" : "rgba(24,25,15,0.09)";
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
      const f = active ? "#528531" : "var(--text-muted)";
      const s = active ? "rgba(36,63,22,0.6)" : "rgba(24,25,15,0.09)";
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
      const f = active ? "#528531" : "var(--text-muted)";
      const gap = active ? "rgba(13,14,25,0.7)" : "rgba(24,25,15,0.09)";
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
      const f = active ? "#528531" : "var(--text-muted)";
      const s = active ? "rgba(36,63,22,0.5)" : "rgba(0,0,0,0.2)";
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
      const f = active ? "#f87171" : "var(--text-muted)";
      const accent = active ? "#C9A84C" : "rgba(36,63,22,0.15)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* heart shape */}
          <path d="M16 27 Q6 19 6 12 Q6 6 11 5 Q14 5 16 8 Q18 5 21 5 Q26 6 26 12 Q26 19 16 27 Z" fill={f}/>
          {/* flame inside heart */}
          <path d="M16 22 Q13 18 14 15 Q15 13 16 14 Q17 13 18 15 Q19 18 16 22 Z" fill={accent}/>
          {/* highlight */}
          <ellipse cx="12" cy="10" rx="2" ry="1.5" fill="var(--text-muted)" transform="rotate(-20,12,10)"/>
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
    return `linear-gradient(to right, #243F16 0%, #f59e0b ${pct}%, rgba(36,63,22,0.10) ${pct}%, rgba(36,63,22,0.10) 100%)`;
  }
  return `linear-gradient(to right, #243F16 0%, #f59e0b 44%, #ef4444 ${pct}%, rgba(36,63,22,0.10) ${pct}%, rgba(36,63,22,0.10) 100%)`;
}

function EnergySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const currentEmoji = ENERGY_STEPS.reduce((acc, s) => (value >= s.value ? s.emoji : acc), "💀");
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
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
        <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mood After</label>
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
            background: `linear-gradient(to right, hsl(${hue},80%,45%) 0%, hsl(${hue},80%,45%) ${pct}%, rgba(36,63,22,0.10) ${pct}%, rgba(36,63,22,0.10) 100%)`,
          }}
        />
        <div className="flex justify-between mt-1 px-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="text-[10px] w-4 text-center" style={{ color: "var(--text-muted)" }}>
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
  embedPreview, onClearEmbed,
}: {
  mediaPreview: string | null;
  uploading: boolean;
  onRemove: () => void;
  onFileClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  embedPreview?: { provider: EmbedProvider; url: string; title?: string; thumbnailUrl?: string } | null;
  onClearEmbed?: () => void;
}) {
  // Instagram / TikTok embed: show thumbnail card in the media slot
  if (embedPreview && (embedPreview.provider === "instagram" || embedPreview.provider === "tiktok")) {
    const isInstagram = embedPreview.provider === "instagram";
    return (
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Photo / Video</label>
        <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(36,63,22,0.10)" }}>
          {embedPreview.thumbnailUrl ? (
            <img src={embedPreview.thumbnailUrl} alt={embedPreview.title || embedPreview.provider} className="w-full max-h-60 object-cover" />
          ) : (
            <div
              className="w-full h-48 flex flex-col items-center justify-center gap-2"
              style={{
                background: isInstagram
                  ? "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"
                  : "#010101",
              }}
            >
              <span className="text-white text-base font-bold capitalize">{embedPreview.provider}</span>
              {embedPreview.title && (
                <span className="text-white/80 text-sm px-6 text-center line-clamp-2">{embedPreview.title}</span>
              )}
            </div>
          )}
          {/* Full-area tap target to open externally */}
          <a
            href={embedPreview.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              if (isCapacitorNative()) {
                e.preventDefault();
                openExternalLink(embedPreview.url);
              }
            }}
            className="absolute inset-0"
            aria-label={`Open in ${embedPreview.provider}`}
          />
          {/* Provider badge */}
          <div
            className="absolute bottom-0 left-0 right-0 px-3 py-2"
            style={{ background: "linear-gradient(transparent,rgba(0,0,0,0.65))" }}
          >
            <p className="text-xs font-semibold uppercase text-white">{embedPreview.provider}</p>
          </div>
          {/* Remove button */}
          <button
            type="button"
            onClick={onClearEmbed}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Photo / Video</label>
      {mediaPreview ? (
        <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(36,63,22,0.10)" }}>
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
            border: "2px dashed rgba(36,63,22,0.12)",
            color: "var(--text-muted)",
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
  const isFromSession = searchParams.get("fromSession") === "1";
  const editPostId = searchParams.get("editPostId");
  const isEditingPost = Boolean(editPostId);

  const initialType = ((): PostType => {
    const param = searchParams.get("type")?.toUpperCase();
    if (param && ["WORKOUT", "MEAL", "WELLNESS", "GENERAL", "CHECKIN"].includes(param)) {
      return param as PostType;
    }
    return "WORKOUT";
  })();

  const [type, setType] = useState<PostType>(initialType);
  const [showWorkoutAdvanced, setShowWorkoutAdvanced] = useState(!isFromSession);
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
  const [embedInput, setEmbedInput] = useState("");
  const [embedPreview, setEmbedPreview] = useState<EmbedPreview | null>(null);
  const [embedLoading, setEmbedLoading] = useState(false);

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
  const [pendingDraft, setPendingDraft] = useState<CreateDraftV1 | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hydratingEditPost, setHydratingEditPost] = useState(false);
  const lastAutosaveAtRef = useRef<number>(0);
  const lastDraftSignatureRef = useRef<string>("");

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

      const sessionName = (session.workoutName as string | undefined)?.trim();
      setWorkoutName(sessionName || "Today's Workout");
      setEditingName(true);
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
          background: "var(--surface)",
          color: "var(--text)",
          border: "1px solid rgba(36,63,22,0.4)",
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

  // ── Check-in fields ───────────────────────────────────────
  const [checkInGymId, setCheckInGymId] = useState<string | null>(null);
  const [checkInGymName, setCheckInGymName] = useState("");
  const [gymSearchQuery, setGymSearchQuery] = useState("");
  const [gymSearchResults, setGymSearchResults] = useState<GymResult[]>([]);
  const [gymSearchLoading, setGymSearchLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showAddGym, setShowAddGym] = useState(false);
  const [showWorkoutGymPicker, setShowWorkoutGymPicker] = useState(false);
  const [newGymName, setNewGymName] = useState("");
  const [newGymAddress, setNewGymAddress] = useState("");
  const [newGymLat, setNewGymLat] = useState<number | null>(null);
  const [newGymLng, setNewGymLng] = useState<number | null>(null);
  const [addingGym, setAddingGym] = useState(false);

  const buildDraft = useCallback((): CreateDraftV1 => ({
    version: 1,
    type,
    payload: {
      caption,
      visibility,
      postDate,
      workout: {
        workoutName,
        editingName,
        selectedMuscles,
        isClass,
        durationMinutes,
        perceivedExertion,
        energy,
        exercises,
        postTiming,
        showAdvanced: showWorkoutAdvanced,
      },
      meal: {
        mealName,
        mealType,
        ingredients,
        calories,
        protein,
        carbs,
        fat,
        saveToCatalog,
      },
      wellness: {
        activityType,
        wellnessDuration,
        intensity,
        wellnessMood,
      },
      checkIn: {
        checkInGymId,
        checkInGymName,
        gymSearchQuery,
      },
      media: {
        mediaUrl,
        previewRef: mediaPreview && !mediaPreview.startsWith("blob:") ? mediaPreview : null,
        hasPendingUpload: uploading,
      },
      embed: {
        embedInput,
        embedPreview,
      },
    },
  }), [
    type, caption, visibility, postDate, workoutName, editingName, selectedMuscles, isClass,
    durationMinutes, perceivedExertion, energy, exercises, postTiming, showWorkoutAdvanced,
    mealName, mealType, ingredients, calories, protein, carbs, fat, saveToCatalog, activityType,
    wellnessDuration, intensity, wellnessMood,
    checkInGymId, checkInGymName, gymSearchQuery, mediaUrl, mediaPreview, uploading, embedInput, embedPreview,
  ]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(CREATE_DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    lastDraftSignatureRef.current = JSON.stringify(buildDraft());
    lastAutosaveAtRef.current = Date.now();
    setIsDirty(false);
  }, [buildDraft]);

  const shouldWarnOnLeave = useCallback(() => {
    if (!isDirty) return false;
    return Date.now() - lastAutosaveAtRef.current > RECENT_AUTOSAVE_WINDOW_MS;
  }, [isDirty]);

  const confirmLeaveIfNeeded = useCallback(() => {
    if (!shouldWarnOnLeave()) return true;
    return window.confirm(LEAVE_WARNING_MESSAGE);
  }, [shouldWarnOnLeave]);

  const handleBack = useCallback(() => {
    if (!confirmLeaveIfNeeded()) return;
    if (isFromSession) {
      router.replace("/feed");
      return;
    }
    router.back();
  }, [confirmLeaveIfNeeded, isFromSession, router]);

  const searchGyms = useCallback(async (query: string, lat?: number, lng?: number) => {
    setGymSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (lat != null && lng != null) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
      }
      const res = await fetch(`/api/gyms?${params.toString()}`);
      if (res.ok) {
        const data: GymResult[] = await res.json();
        setGymSearchResults(data);
      }
    } catch {
      // silent
    } finally {
      setGymSearchLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewGymLat(latitude);
        setNewGymLng(longitude);
        setLocationLoading(false);
        searchGyms("", latitude, longitude);
        toast.success("Location found — showing nearby gyms");
      },
      () => {
        setLocationLoading(false);
        toast.error("Could not get your location");
      },
      { timeout: 10000 }
    );
  }, [searchGyms]);

  const handleAddGym = useCallback(async () => {
    if (!newGymName.trim()) return;
    setAddingGym(true);
    try {
      const res = await fetch("/api/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGymName.trim(),
          address: newGymAddress.trim() || undefined,
          latitude: newGymLat ?? undefined,
          longitude: newGymLng ?? undefined,
        }),
      });
      if (res.ok) {
        const gym: GymResult = await res.json();
        setCheckInGymId(gym.id);
        setCheckInGymName(gym.name);
        setShowAddGym(false);
        setNewGymName("");
        setNewGymAddress("");
        toast.success(`"${gym.name}" added!`);
      } else {
        toast.error("Failed to add gym");
      }
    } catch {
      toast.error("Failed to add gym");
    } finally {
      setAddingGym(false);
    }
  }, [newGymName, newGymAddress, newGymLat, newGymLng]);

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

  const handleEmbedAdd = useCallback(async () => {
    if (!embedInput.trim()) {
      setEmbedPreview(null);
      return;
    }
    const parsed = parseEmbedUrl(embedInput);
    if (!parsed) {
      setError("Unsupported embed URL. Try Instagram, TikTok, or YouTube.");
      return;
    }

    setEmbedLoading(true);
    setError("");
    try {
      const res = await fetch("/api/unfurl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsed.url }),
      });

      let title: string | undefined;
      let thumbnailUrl: string | undefined;
      if (res.ok) {
        const unfurl = await res.json();
        title = unfurl.title || undefined;
        const rawImage: string | null = unfurl.imageUrl || null;
        // Only accept thumbnails from known trusted CDNs to avoid storing
        // login-page or placeholder images returned by redirected fetches.
        const trustedThumbnail =
          rawImage &&
          /^https?:\/\/.*(cdninstagram\.com|fbcdn\.net|tiktokcdn\.com|tiktok\.com|ytimg\.com|ggpht\.com|googleusercontent\.com)/.test(rawImage)
            ? rawImage
            : undefined;
        thumbnailUrl = trustedThumbnail;
      }

      setEmbedPreview({
        provider: parsed.provider,
        url: parsed.url,
        contentId: parsed.contentId,
        title,
        thumbnailUrl,
      });
    } catch {
      setEmbedPreview({
        provider: parsed.provider,
        url: parsed.url,
        contentId: parsed.contentId,
      });
    } finally {
      setEmbedLoading(false);
    }
  }, [embedInput]);

  const clearEmbed = () => {
    setEmbedInput("");
    setEmbedPreview(null);
  };

  useEffect(() => {
    if (isEditingPost) {
      setDraftReady(true);
      return;
    }
    // A live session pre-fills all relevant fields; an old draft is stale by
    // comparison. Discard it so the "Resume draft?" banner never appears and
    // autosave is not blocked while pendingDraft is set.
    if (isFromSession) {
      try { localStorage.removeItem(CREATE_DRAFT_STORAGE_KEY); } catch { /* ignore */ }
      setDraftReady(true);
      return;
    }
    try {
      const raw = localStorage.getItem(CREATE_DRAFT_STORAGE_KEY);
      if (!raw) {
        setDraftReady(true);
        return;
      }
      const parsed: CreateDraftV1 = JSON.parse(raw);
      if (parsed?.version !== 1 || !parsed.payload) {
        localStorage.removeItem(CREATE_DRAFT_STORAGE_KEY);
        setDraftReady(true);
        return;
      }
      setPendingDraft(parsed);
    } catch {
      // ignore draft parse failures
    } finally {
      setDraftReady(true);
    }
  }, [isEditingPost, isFromSession]);

  const applyDraft = useCallback((draft: CreateDraftV1) => {
    setType(draft.type);
    setCaption(draft.payload.caption);
    setVisibility(draft.payload.visibility);
    setPostDate(draft.payload.postDate);

    setWorkoutName(draft.payload.workout.workoutName);
    setEditingName(draft.payload.workout.editingName);
    setSelectedMuscles(draft.payload.workout.selectedMuscles);
    setIsClass(draft.payload.workout.isClass);
    setDurationMinutes(draft.payload.workout.durationMinutes);
    setPerceivedExertion(draft.payload.workout.perceivedExertion);
    setEnergy(draft.payload.workout.energy);
    setExercises(draft.payload.workout.exercises);
    setPostTiming(draft.payload.workout.postTiming);
    setShowWorkoutAdvanced(draft.payload.workout.showAdvanced);

    setMealName(draft.payload.meal.mealName);
    setMealType(draft.payload.meal.mealType);
    setIngredients(draft.payload.meal.ingredients);
    setCalories(draft.payload.meal.calories);
    setProtein(draft.payload.meal.protein);
    setCarbs(draft.payload.meal.carbs);
    setFat(draft.payload.meal.fat);
    setSaveToCatalog(draft.payload.meal.saveToCatalog);

    setActivityType(draft.payload.wellness.activityType);
    setWellnessDuration(draft.payload.wellness.wellnessDuration);
    setIntensity(draft.payload.wellness.intensity);
    setWellnessMood(draft.payload.wellness.wellnessMood);

    setCheckInGymId(draft.payload.checkIn.checkInGymId);
    setCheckInGymName(draft.payload.checkIn.checkInGymName);
    setGymSearchQuery(draft.payload.checkIn.gymSearchQuery);

    setMediaUrl(draft.payload.media.mediaUrl);
    setMediaPreview(draft.payload.media.previewRef);
    setEmbedInput(draft.payload.embed.embedInput);
    setEmbedPreview(draft.payload.embed.embedPreview);
  }, []);

  useEffect(() => {
    if (!editPostId) return;

    const loadEditPost = async () => {
      setHydratingEditPost(true);
      setError("");
      try {
        const res = await fetch(`/api/posts/${editPostId}`);
        if (!res.ok) {
          throw new Error("Failed to load post for editing");
        }
        const post = await res.json();

        setType(post.type);
        setCaption(post.caption ?? "");
        setVisibility(post.visibility);
        setMediaUrl(post.mediaUrl ?? null);
        setMediaPreview(post.mediaUrl ?? null);
        setCheckInGymId(post.gym?.id ?? null);
        setCheckInGymName(post.gym?.name ?? "");

        const existingEmbed = post.externalContent?.[0];
        if (existingEmbed) {
          const embedParts = String(existingEmbed.description ?? "").split(":");
          const provider = embedParts[1];
          const contentId = embedParts[2];
          if (["instagram", "tiktok", "youtube"].includes(provider) && contentId) {
            setEmbedPreview({
              provider: provider as EmbedProvider,
              url: existingEmbed.url,
              contentId,
              title: existingEmbed.title ?? undefined,
              thumbnailUrl: existingEmbed.imageUrl ?? undefined,
            });
            setEmbedInput(existingEmbed.url);
          }
        }

        if (post.type === "WORKOUT" && post.workoutDetail) {
          setWorkoutName(post.workoutDetail.workoutName ?? "");
          setEditingName(true);
          setSelectedMuscles(post.workoutDetail.muscleGroups ?? []);
          setIsClass(Boolean(post.workoutDetail.isClass));
          setDurationMinutes(post.workoutDetail.durationMinutes ? String(post.workoutDetail.durationMinutes) : "");
          setPerceivedExertion(post.workoutDetail.perceivedExertion ? String(post.workoutDetail.perceivedExertion) : "");
          setEnergy(post.workoutDetail.moodAfter ?? 7);
          setPostTiming(post.workoutDetail.postTiming ?? "AFTER");
          setShowWorkoutAdvanced(true);
          setExercises(
            Array.isArray(post.workoutDetail.exercises)
              ? post.workoutDetail.exercises.map((exercise: { name: string; sets?: Array<{ reps: number | null; weight: number | null; unit: string | null; rpe: number | null }> }) => ({
                  name: exercise.name ?? "",
                  sets:
                    Array.isArray(exercise.sets) && exercise.sets.length > 0
                      ? exercise.sets.map((set) => ({
                          reps: set.reps != null ? String(set.reps) : "",
                          weight: set.weight != null ? String(set.weight) : "",
                          unit: set.unit || "lbs",
                          rpe: set.rpe != null ? String(set.rpe) : "",
                        }))
                      : [emptySet()],
                }))
              : []
          );
        }

        if (post.type === "MEAL" && post.mealDetail) {
          setMealName(post.mealDetail.mealName ?? "");
          setMealType(post.mealDetail.mealType ?? "snack");
          setIngredients(Array.isArray(post.mealDetail.ingredients) ? post.mealDetail.ingredients.join(", ") : "");
          setCalories(post.mealDetail.calories != null ? String(post.mealDetail.calories) : "");
          setProtein(post.mealDetail.protein != null ? String(post.mealDetail.protein) : "");
          setCarbs(post.mealDetail.carbs != null ? String(post.mealDetail.carbs) : "");
          setFat(post.mealDetail.fat != null ? String(post.mealDetail.fat) : "");
        }

        if (post.type === "WELLNESS" && post.wellnessDetail) {
          setActivityType(post.wellnessDetail.activityType ?? "");
          setWellnessDuration(post.wellnessDetail.durationMinutes != null ? String(post.wellnessDetail.durationMinutes) : "");
          setIntensity(post.wellnessDetail.intensity != null ? String(post.wellnessDetail.intensity) : "");
          setWellnessMood(post.wellnessDetail.moodAfter ?? 7);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load post for editing";
        setError(message);
      } finally {
        setHydratingEditPost(false);
      }
    };

    void loadEditPost();
  }, [editPostId]);

  const handleResumeDraft = useCallback(() => {
    if (!pendingDraft) return;
    applyDraft(pendingDraft);
    setPendingDraft(null);
  }, [applyDraft, pendingDraft]);

  const handleDiscardDraft = useCallback(() => {
    setPendingDraft(null);
    clearDraft();
  }, [clearDraft]);

  useEffect(() => {
    if (isEditingPost || !draftReady || pendingDraft || submitting || successPost) return;
    const draft = buildDraft();
    const signature = JSON.stringify(draft);
    if (signature === lastDraftSignatureRef.current) return;
    setIsDirty(true);
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(CREATE_DRAFT_STORAGE_KEY, signature);
        lastDraftSignatureRef.current = signature;
        lastAutosaveAtRef.current = Date.now();
        setIsDirty(false);
      } catch {
        // ignore storage write failures
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [buildDraft, draftReady, isEditingPost, pendingDraft, submitting, successPost]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldWarnOnLeave()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [shouldWarnOnLeave]);

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
        externalUrl: embedPreview?.url,
        embed: embedPreview
          ? {
              provider: embedPreview.provider,
              url: embedPreview.url,
              contentId: embedPreview.contentId,
              title: embedPreview.title,
              thumbnailUrl: embedPreview.thumbnailUrl,
            }
          : undefined,
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
        // Include gym location if tagged (optional)
        if (checkInGymId) {
          body.gymId = checkInGymId;
        }
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

      if (type === "CHECKIN") {
        if (!checkInGymId) {
          setError("Please select a gym for your check-in");
          setSubmitting(false);
          return;
        }
        body.gymId = checkInGymId;
      }

      const endpoint = isEditingPost && editPostId ? `/api/posts/${editPostId}` : "/api/posts";
      const res = await fetch(endpoint, {
        method: isEditingPost ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          externalUrl: embedPreview?.url ?? "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.details) console.error("Post validation details:", JSON.stringify(data.details, null, 2));
        setError(data.error || (isEditingPost ? "Failed to update post" : "Failed to create post"));
        return;
      }

      if (isEditingPost && editPostId) {
        successNotification();
        clearDraft();
        toast.success("Post updated");
        router.push(`/p/${editPostId}`);
        return;
      }

      const created = await res.json();
      clearDraft();
      successNotification();
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
    embedPreview,
    onClearEmbed: clearEmbed,
  };

  const TYPE_LABELS: Record<PostType, string> = {
    WORKOUT: "Workout",
    MEAL: "Meal",
    WELLNESS: "Wellness",
    GENERAL: "General",
    CHECKIN: "Check-in",
  };

  const TYPE_EMOJI: Record<PostType, string> = {
    WORKOUT: "💪",
    MEAL: "🥗",
    WELLNESS: "🧘",
    GENERAL: "📝",
    CHECKIN: "📍",
  };

  const sourceMode: "LIVE_COMPLETED" | "LIVE_ACTIVE" | "MANUAL" = isFromSession
    ? "LIVE_COMPLETED"
    : sessionElapsed !== null
    ? "LIVE_ACTIVE"
    : "MANUAL";

  const sourceModeLabel: Record<typeof sourceMode, string> = {
    LIVE_COMPLETED: "Live workout complete",
    LIVE_ACTIVE: "Live workout in progress",
    MANUAL: "Manual post",
  };

  // ── Success overlay ────────────────────────────────────────
  if (successPost) {
    const shareUrl = `https://royalwellness.app/p/${successPost.id}`;
    const sharePost = () => {
      if (typeof navigator.share === "function") {
        navigator.share({ url: shareUrl }).catch(() => {
          // User cancelled or share unavailable — fall back silently
          navigator.clipboard.writeText(shareUrl).catch(() => {});
        });
      } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
          toast.success("Link copied!");
        });
      }
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
          .rf-fade-up-1 { animation: rf-fade-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) 0.35s forwards; opacity:0; }
          .rf-fade-up-2 { animation: rf-fade-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) 0.5s forwards; opacity:0; }
          .rf-fade-up-3 { animation: rf-fade-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) 0.65s forwards; opacity:0; }
        `}</style>

        {/* Animated badge */}
        <div className="rf-pop mb-6">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-6xl shadow-2xl"
            style={{ background: "linear-gradient(135deg, #243F16 0%, #528531 100%)" }}
          >
            {TYPE_EMOJI[successPost.type]}
          </div>
        </div>

        <h1
          className="rf-fade-up-1 text-3xl font-bold mb-1"
          style={{ color: "var(--text)" }}
        >
          Posted! 🎉
        </h1>
        <p
          className="rf-fade-up-2 text-base mb-10"
          style={{ color: "var(--text-muted)" }}
        >
          Your {TYPE_LABELS[successPost.type].toLowerCase()} is live
        </p>

        <div className="rf-fade-up-3 flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={sharePost}
            className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #243F16 0%, #528531 100%)", color: "#ffffff" }}
          >
            🔗 Share Post
          </button>
          <button
            onClick={() => {
              if (!confirmLeaveIfNeeded()) return;
              router.push("/feed");
            }}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "rgba(36,63,22,0.10)", color: "var(--text)" }}
          >
            View Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl transition-colors"
          style={{ background: "rgba(36,63,22,0.04)", color: "var(--text)" }}
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{isEditingPost ? "Edit Post" : "New Post"}</h1>
      </div>

      {hydratingEditPost && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(36,63,22,0.06)", color: "var(--text-muted)" }}>
          Loading your post details...
        </div>
      )}

      {pendingDraft && !isEditingPost && (
        <div
          className="mb-4 p-4 rounded-2xl flex items-center justify-between gap-3"
          style={{ background: "rgba(36,63,22,0.08)", border: "1px solid rgba(82,133,49,0.25)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#528531" }}>Resume your draft?</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              We found an in-progress {pendingDraft.type.toLowerCase()} post.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResumeDraft}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "#528531", color: "white" }}
            >
              Resume
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(36,63,22,0.10)", color: "var(--text)" }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {sourceMode !== "MANUAL" && (
        <div className="mb-4">
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(36,63,22,0.12)",
              color: "#528531",
              border: "1px solid rgba(82,133,49,0.35)",
            }}
          >
            {sourceModeLabel[sourceMode]}
          </span>
        </div>
      )}

      {isFromSession && type === "WORKOUT" && (
        <div
          className="mb-4 p-4 rounded-2xl"
          style={{ background: "rgba(36,63,22,0.08)", border: "1px solid rgba(82,133,49,0.25)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#528531" }}>Review workout before posting</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {workoutName || "Workout"} • {durationMinutes || "--"} min • {exercises.length} exercises logged
          </p>
          <button
            type="button"
            onClick={() => setShowWorkoutAdvanced((prev) => !prev)}
            className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(36,63,22,0.10)", color: "var(--text)" }}
          >
            {showWorkoutAdvanced ? "Hide exercises & details" : "Add exercises & details"}
          </button>
        </div>
      )}

      {/* Photo/video always visible when posting a workout from a live session */}
      {isFromSession && type === "WORKOUT" && (
        <div className="mb-1">
          <MediaBlock {...mediaProps} />
        </div>
      )}

      {/* Quick Check-in button */}
      {!isFromSession && (
      <button
        onClick={() => {
          setType("CHECKIN");
          if (gymSearchResults.length === 0) searchGyms("");
        }}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-3 transition-all active:scale-[0.98]"
        style={
          type === "CHECKIN"
            ? {
                background: "rgba(82,133,49,0.10)",
                border: "1px solid rgba(82,133,49,0.4)",
              }
            : {
                background: "rgba(36,63,22,0.04)",
                border: "1px solid rgba(36,63,22,0.10)",
              }
        }
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                type === "CHECKIN"
                  ? "rgba(82,133,49,0.15)"
                  : "rgba(36,63,22,0.04)",
            }}
          >
            <HiLocationMarker
              className="w-5 h-5"
              style={{ color: type === "CHECKIN" ? "#528531" : "var(--text-muted)" }}
            />
          </div>
          <div className="text-left">
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: type === "CHECKIN" ? "#528531" : "var(--text)" }}
            >
              Quick Check-in
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Tap to post you went to the gym
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
          style={
            type === "CHECKIN"
              ? { background: "rgba(82,133,49,0.15)", color: "#528531" }
              : { background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }
          }
        >
          {type === "CHECKIN" ? "Selected ✓" : "Tap →"}
        </span>
      </button>
      )}

      {/* Post type selector (detailed posts) */}
      <div
        className="flex gap-2 mb-5 p-1 rounded-xl transition-opacity"
        style={{
          background: "rgba(36,63,22,0.04)",
          opacity: type === "CHECKIN" ? 0.45 : 1,
        }}
      >
        {(["WORKOUT", "MEAL", "WELLNESS", "GENERAL"] as PostType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={
              type === t
                ? { background: "var(--brand)", color: "#ffffff" }
                : { background: "transparent", color: "var(--text-muted)" }
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
        {/* ─── CHECKIN ─────────────────────────────────────── */}
        {type === "CHECKIN" && (
          <>
            {/* Selected gym display */}
            {checkInGymId ? (
              <div
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                style={{ background: "rgba(82,133,49,0.08)", border: "1px solid rgba(82,133,49,0.3)" }}
              >
                <div className="flex items-center gap-3">
                  <HiLocationMarker className="w-5 h-5 flex-shrink-0" style={{ color: "#528531" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#528531" }}>{checkInGymName}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Gym selected</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setCheckInGymId(null); setCheckInGymName(""); }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Location + Search row */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={locationLoading}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex-shrink-0"
                    style={{ background: "rgba(82,133,49,0.10)", border: "1px solid rgba(82,133,49,0.25)", color: "#528531" }}
                  >
                    <HiLocationMarker className="w-4 h-4 flex-shrink-0" />
                    {locationLoading ? "Locating..." : "Near me"}
                  </button>
                  <div className="relative flex-1">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      value={gymSearchQuery}
                      onChange={(e) => {
                        setGymSearchQuery(e.target.value);
                        searchGyms(e.target.value);
                      }}
                      placeholder="Search gyms..."
                      className="input-dark w-full pl-9"
                    />
                  </div>
                </div>

                {/* Gym results */}
                {gymSearchLoading ? (
                  <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>
                    Searching...
                  </p>
                ) : gymSearchResults.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {gymSearchResults.map((gym) => (
                      <button
                        key={gym.id}
                        type="button"
                        onClick={() => { setCheckInGymId(gym.id); setCheckInGymName(gym.name); }}
                        className="w-full text-left px-3.5 py-3 rounded-xl transition-all"
                        style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.07)", color: "var(--text)" }}
                      >
                        <p className="text-sm font-medium leading-tight">{gym.name}</p>
                        {gym.address && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{gym.address}</p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : gymSearchQuery.trim() ? (
                  <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>
                    No gyms found for &ldquo;{gymSearchQuery}&rdquo;
                  </p>
                ) : null}

                {/* Add new gym toggle */}
                <button
                  type="button"
                  onClick={() => setShowAddGym((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <HiPlus className="w-3.5 h-3.5" />
                  {showAddGym ? "Cancel" : "Add a new gym"}
                </button>

                {/* Add gym form */}
                {showAddGym && (
                  <div
                    className="space-y-2.5 p-3.5 rounded-xl"
                    style={{ background: "rgba(36,63,22,0.03)", border: "1px solid rgba(36,63,22,0.10)" }}
                  >
                    <input
                      type="text"
                      value={newGymName}
                      onChange={(e) => setNewGymName(e.target.value)}
                      placeholder="Gym name (e.g. Tribeca Equinox)"
                      className="input-dark w-full"
                    />
                    <input
                      type="text"
                      value={newGymAddress}
                      onChange={(e) => setNewGymAddress(e.target.value)}
                      placeholder="Address (optional)"
                      className="input-dark w-full"
                    />
                    {newGymLat == null ? (
                      <button
                        type="button"
                        onClick={requestLocation}
                        disabled={locationLoading}
                        className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-60"
                        style={{ color: "#528531" }}
                      >
                        <HiLocationMarker className="w-3.5 h-3.5" />
                        {locationLoading ? "Getting location..." : "Tag location (optional)"}
                      </button>
                    ) : (
                      <p className="text-xs flex items-center gap-1" style={{ color: "#528531" }}>
                        <HiLocationMarker className="w-3.5 h-3.5" />
                        Location tagged
                        <button
                          type="button"
                          onClick={() => { setNewGymLat(null); setNewGymLng(null); }}
                          className="ml-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <HiX className="w-3 h-3" />
                        </button>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleAddGym}
                      disabled={addingGym || !newGymName.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all btn-gradient disabled:opacity-50"
                      style={{ color: "var(--text)" }}
                    >
                      {addingGym ? "Adding..." : "Add Gym"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Optional caption */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
                Note <span style={{ color: "var(--text-muted)" }}>(optional)</span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder={checkInGymName ? `e.g. Great session at ${checkInGymName}!` : "Add a note..."}
                className="textarea-dark w-full resize-none"
              />
            </div>
          </>
        )}

        {/* ─── WORKOUT ─────────────────────────────────────── */}
        {type === "WORKOUT" && (
          <>
            {/* ── Start / Resume Workout Banner ── */}
            {!isFromSession && (
              <button
                type="button"
                onClick={() => router.push("/workout")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-[0.98] mb-1"
                style={{
                  background:
                    sessionElapsed !== null
                      ? "rgba(34,197,94,0.07)"
                      : "rgba(36,63,22,0.08)",
                  border:
                    sessionElapsed !== null
                      ? "1px solid rgba(34,197,94,0.25)"
                      : "1px solid rgba(36,63,22,0.25)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        sessionElapsed !== null
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(36,63,22,0.10)",
                    }}
                  >
                    {sessionElapsed !== null ? (
                      <HiPlay className="w-5 h-5" style={{ color: "#4ade80" }} />
                    ) : (
                      <HiLightningBolt className="w-5 h-5" style={{ color: "var(--brand-light)" }} />
                    )}
                  </div>
                  <div className="text-left">
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{
                        color: sessionElapsed !== null ? "#4ade80" : "#528531",
                      }}
                    >
                      {sessionElapsed !== null ? "Workout In Progress" : "Start a Live Workout"}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
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
                        : "var(--brand)",
                    color: sessionElapsed !== null ? "#4ade80" : "#ffffff",
                  }}
                >
                  {sessionElapsed !== null ? "Resume →" : "Start →"}
                </div>
              </button>
            )}

            {/* 1. Muscle group selector — always visible */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
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
                              background: "rgba(36,63,22,0.10)",
                              border: "1px solid rgba(82,133,49,0.5)",
                              color: "var(--brand-light)",
                            }
                          : {
                              background: "rgba(36,63,22,0.04)",
                              border: "1px solid rgba(36,63,22,0.07)",
                              color: "var(--text-muted)",
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

            {/* 2. Workout Name — always visible */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
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

            {/* 3. Media — session posts have it hoisted above; show here for manual posts */}
            {!isFromSession && <MediaBlock {...mediaProps} />}

            {/* 4. Energy slider — always visible */}
            <EnergySlider value={energy} onChange={setEnergy} />

            {/* 5. Caption — always visible */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="How did the workout go?"
                className="textarea-dark w-full resize-none"
              />
            </div>

            {/* 6. Gym location — optional, available for all workout posting methods */}
            <div>
              {checkInGymId ? (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(82,133,49,0.08)", border: "1px solid rgba(82,133,49,0.3)" }}
                >
                  <div className="flex items-center gap-3">
                    <HiLocationMarker className="w-5 h-5 flex-shrink-0" style={{ color: "#528531" }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#528531" }}>{checkInGymName}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Gym tagged</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCheckInGymId(null); setCheckInGymName(""); setShowWorkoutGymPicker(false); }}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: "rgba(36,63,22,0.04)", color: "var(--text-muted)" }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkoutGymPicker((v) => !v);
                      if (!showWorkoutGymPicker && gymSearchResults.length === 0) searchGyms("");
                    }}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-2xl w-full text-left transition-all"
                    style={
                      showWorkoutGymPicker
                        ? { background: "rgba(82,133,49,0.08)", border: "1px solid rgba(82,133,49,0.3)", color: "#528531" }
                        : { background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.08)", color: "var(--text-muted)" }
                    }
                  >
                    <HiLocationMarker className="w-4 h-4 flex-shrink-0" />
                    <span>{showWorkoutGymPicker ? "Searching gyms..." : "Tag gym location (optional)"}</span>
                    <span className="ml-auto text-xs">{showWorkoutGymPicker ? "▲" : "▼"}</span>
                  </button>

                  {showWorkoutGymPicker && (
                    <div className="mt-2 space-y-3">
                      {/* Location + Search row */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={requestLocation}
                          disabled={locationLoading}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex-shrink-0"
                          style={{ background: "rgba(82,133,49,0.10)", border: "1px solid rgba(82,133,49,0.25)", color: "#528531" }}
                        >
                          <HiLocationMarker className="w-4 h-4 flex-shrink-0" />
                          {locationLoading ? "Locating..." : "Near me"}
                        </button>
                        <div className="relative flex-1">
                          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                          <input
                            type="text"
                            value={gymSearchQuery}
                            onChange={(e) => {
                              setGymSearchQuery(e.target.value);
                              searchGyms(e.target.value);
                            }}
                            placeholder="Search gyms..."
                            className="input-dark w-full pl-9"
                          />
                        </div>
                      </div>

                      {/* Gym results */}
                      {gymSearchLoading ? (
                        <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>
                          Searching...
                        </p>
                      ) : gymSearchResults.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {gymSearchResults.map((gym) => (
                            <button
                              key={gym.id}
                              type="button"
                              onClick={() => { setCheckInGymId(gym.id); setCheckInGymName(gym.name); setShowWorkoutGymPicker(false); }}
                              className="w-full text-left px-3.5 py-3 rounded-xl transition-all"
                              style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.07)", color: "var(--text)" }}
                            >
                              <p className="text-sm font-medium leading-tight">{gym.name}</p>
                              {gym.address && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{gym.address}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : gymSearchQuery.trim() ? (
                        <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>
                          No gyms found for &ldquo;{gymSearchQuery}&rdquo;
                        </p>
                      ) : null}

                      {/* Add new gym toggle */}
                      <button
                        type="button"
                        onClick={() => setShowAddGym((v) => !v)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <HiPlus className="w-3.5 h-3.5" />
                        {showAddGym ? "Cancel" : "Add a new gym"}
                      </button>

                      {/* Add gym form */}
                      {showAddGym && (
                        <div
                          className="space-y-2.5 p-3.5 rounded-xl"
                          style={{ background: "rgba(36,63,22,0.03)", border: "1px solid rgba(36,63,22,0.10)" }}
                        >
                          <input
                            type="text"
                            value={newGymName}
                            onChange={(e) => setNewGymName(e.target.value)}
                            placeholder="Gym name (e.g. Tribeca Equinox)"
                            className="input-dark w-full"
                          />
                          <input
                            type="text"
                            value={newGymAddress}
                            onChange={(e) => setNewGymAddress(e.target.value)}
                            placeholder="Address (optional)"
                            className="input-dark w-full"
                          />
                          {newGymLat == null ? (
                            <button
                              type="button"
                              onClick={requestLocation}
                              disabled={locationLoading}
                              className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-60"
                              style={{ color: "#528531" }}
                            >
                              <HiLocationMarker className="w-3.5 h-3.5" />
                              {locationLoading ? "Getting location..." : "Tag location (optional)"}
                            </button>
                          ) : (
                            <p className="text-xs flex items-center gap-1" style={{ color: "#528531" }}>
                              <HiLocationMarker className="w-3.5 h-3.5" />
                              Location tagged
                              <button
                                type="button"
                                onClick={() => { setNewGymLat(null); setNewGymLng(null); }}
                                className="ml-1"
                                style={{ color: "var(--text-muted)" }}
                              >
                                <HiX className="w-3 h-3" />
                              </button>
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={handleAddGym}
                            disabled={addingGym || !newGymName.trim()}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all btn-gradient disabled:opacity-50"
                            style={{ color: "var(--text)" }}
                          >
                            {addingGym ? "Adding..." : "Add Gym"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 7. Exercises, duration, group class — behind toggle for live sessions */}
            {(showWorkoutAdvanced || !isFromSession) && (
              <>
            {/* Group class toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isClass}
                onChange={(e) => setIsClass(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span style={{ color: "var(--text)" }}>Group class</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Duration (min)</label>
                <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="60" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Exertion (1-10)</label>
                <input type="number" min="1" max="10" value={perceivedExertion} onChange={(e) => setPerceivedExertion(e.target.value)} placeholder="7" className="input-dark w-full" />
              </div>
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Exercises</label>
                <button type="button" onClick={addExercise} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--brand-light)" }}>
                  <HiPlus className="w-4 h-4" />
                  Add exercise
                </button>
              </div>

              {exercises.length === 0 && (
                <p className="text-xs text-center py-3 rounded-xl" style={{ border: "1px dashed rgba(36,63,22,0.10)", color: "var(--text-muted)" }}>
                  No exercises added yet
                </p>
              )}

              <div className="space-y-3">
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="rounded-xl p-3" style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.07)" }}>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={ex.name}
                        onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                        placeholder="Exercise name (e.g. Bench Press)"
                        className="input-dark flex-1"
                      />
                      <button type="button" onClick={() => removeExercise(exIdx)} className="flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex gap-1.5 items-center">
                          <span className="text-xs w-8 flex-shrink-0 text-center font-medium" style={{ color: "var(--text-muted)" }}>
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
                            <button type="button" onClick={() => removeSet(exIdx, setIdx)} style={{ color: "var(--text-muted)" }}>
                              <HiX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={() => addSet(exIdx)} className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <HiPlus className="w-3.5 h-3.5" />
                      Add set
                    </button>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}

            {isFromSession && !showWorkoutAdvanced && (
              <div className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(36,63,22,0.03)", color: "var(--text-muted)", border: "1px dashed rgba(36,63,22,0.12)" }}>
                Tap &ldquo;Add exercises &amp; details&rdquo; above to log sets, duration, and more.
              </div>
            )}
          </>
        )}

        {/* ─── MEAL ────────────────────────────────────────── */}
        {type === "MEAL" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Meal Name *</label>
              <input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. Protein Smoothie, Chicken Rice Bowl" className="input-dark w-full" />
            </div>

            <MediaBlock {...mediaProps} />

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Tell us about this meal..." className="textarea-dark w-full resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Meal Type</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="select-dark w-full">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Ingredients (comma-separated)</label>
              <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="chicken, rice, broccoli" className="input-dark w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Calories</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="500" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Protein (g)</label>
                <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="30" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Carbs (g)</label>
                <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="50" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Fat (g)</label>
                <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="15" className="input-dark w-full" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={saveToCatalog} onChange={(e) => setSaveToCatalog(e.target.checked)} className="accent-primary w-4 h-4" />
              <span style={{ color: "var(--text)" }}>Save to my meal catalog</span>
            </label>
          </>
        )}

        {/* ─── WELLNESS ────────────────────────────────────── */}
        {type === "WELLNESS" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Activity Type *</label>
              <input value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="e.g. Yoga, Meditation, Sauna" className="input-dark w-full" />
            </div>

            <MediaBlock {...mediaProps} />

            <MoodSlider value={wellnessMood} onChange={setWellnessMood} />

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="How did it go?" className="textarea-dark w-full resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Duration (min)</label>
                <input type="number" value={wellnessDuration} onChange={(e) => setWellnessDuration(e.target.value)} placeholder="30" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Intensity (1-10)</label>
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
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="What's on your mind?" className="textarea-dark w-full resize-none" />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
            Add embed <span style={{ color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              value={embedInput}
              onChange={(e) => setEmbedInput(e.target.value)}
              placeholder="Paste Instagram, TikTok, or YouTube URL"
              className="input-dark w-full"
            />
            <button
              type="button"
              onClick={handleEmbedAdd}
              disabled={embedLoading || !embedInput.trim()}
              className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "rgba(36,63,22,0.15)", color: "#528531", border: "1px solid rgba(82,133,49,0.35)" }}
            >
              {embedLoading ? "Adding..." : "Add"}
            </button>
          </div>
          {/* YouTube: show full card below input. Instagram/TikTok: shown in media area above. */}
          {embedPreview && embedPreview.provider === "youtube" && (
            <div className="mt-2 rounded-xl p-3" style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase" style={{ color: "var(--brand-light)" }}>
                    {embedPreview.provider}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text)" }}>
                    {embedPreview.title || embedPreview.url}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearEmbed}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ background: "rgba(36,63,22,0.10)", color: "var(--text)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          {embedPreview && (embedPreview.provider === "instagram" || embedPreview.provider === "tiktok") && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Preview shown in photo area above.{" "}
              <button type="button" onClick={clearEmbed} className="underline" style={{ color: "var(--brand-light)" }}>
                Remove
              </button>
            </p>
          )}
        </div>

        {/* Visibility */}
        {(!isFromSession || type !== "WORKOUT" || showWorkoutAdvanced) && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Visibility</label>
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
                      ? { background: "rgba(36,63,22,0.10)", border: "1px solid rgba(82,133,49,0.5)", color: "var(--brand-light)" }
                      : { background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.07)", color: "var(--text-muted)" }
                  }
                >
                  {labels[v]}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Backdate */}
        {(!isFromSession || type !== "WORKOUT" || showWorkoutAdvanced) && (
        <div>
          <button
            type="button"
            onClick={() => { setShowBackdate((v) => !v); if (showBackdate) setPostDate(""); }}
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
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
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Will appear as posted on {new Date(postDate + "T12:00:00").toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading || (type === "CHECKIN" && !checkInGymId)}
          className="w-full py-3 rounded-xl font-semibold transition-all btn-gradient shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: "var(--text)" }}
        >
          {uploading
            ? "Uploading media..."
            : submitting
            ? "Posting..."
            : type === "CHECKIN"
            ? checkInGymId
              ? `Post: I was at ${checkInGymName}`
              : "Select a gym to check in"
            : "Post"}
        </button>
      </div>
    </div>
  );
}
