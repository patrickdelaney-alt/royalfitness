"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  HiArrowLeft,
  HiCheck,
  HiChevronLeft,
  HiChevronRight,
  HiPlus,
  HiTrash,
  HiExternalLink,
  HiX,
  HiLink,
  HiClipboardCopy,
  HiPhotograph,
  HiViewGrid,
  HiViewList,
  HiPencil,
} from "react-icons/hi";
import { useRouter, useSearchParams } from "next/navigation";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import {
  AFFILIATE_CATEGORY_LABELS,
  AFFILIATE_CATEGORY_TO_DISPLAY,
  AFFILIATE_TO_CATALOG_TYPE,
  dedupeTags,
  getCatalogDisplayTags,
  parseTagsText,
} from "@/lib/catalog-tags";
import { isCapacitorNative, openExternalLink } from "@/lib/link-handler";

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

interface AffiliateItem {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  link: string | null;
  referralCode: string | null;
  category: string;
  photoUrl: string | null;
  tags: string[];
  createdAt: string;
  subcategoryTags: string[];
  ctaLabel: string | null;
  logoUrl: string | null;
  enrichmentConfidence: string | null;
  needsReview: boolean;
}

type CatalogTab = "meals" | "workouts" | "supplements" | "accessories" | "wellness" | "affiliates";

type AnyItem = SavedMeal | SavedWorkout | Supplement | Accessory | SavedWellnessItem | AffiliateItem;
type AnyItemWithType = AnyItem & { _catalogType: CatalogTab };

const inputCls = "input-dark w-full";
const TAG_LIMITS = {
  maxCount: 12,
  maxLength: 24,
};

interface LinkEnrichmentResult {
  title: string | null;
  siteName: string | null;
  imageUrl: string | null;
}

type PhotoSource = "none" | "auto" | "manual";

const normalizeEnrichmentField = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

async function enrichCatalogLink(url: string): Promise<LinkEnrichmentResult> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { title: null, siteName: null, imageUrl: null };
  }

  const res = await fetch("/api/unfurl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: trimmedUrl }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch link preview");
  }
  const data = await res.json();
  return {
    title: normalizeEnrichmentField(data?.title),
    siteName: normalizeEnrichmentField(data?.siteName),
    imageUrl: normalizeEnrichmentField(data?.imageUrl),
  };
}

const CATEGORY_GRADIENTS: Record<CatalogTab, string> = {
  meals: "from-orange-600/80 to-red-700/80",
  workouts: "from-blue-600/80 to-indigo-700/80",
  supplements: "from-green-600/80 to-emerald-700/80",
  accessories: "from-purple-600/80 to-pink-700/80",
  wellness: "from-teal-600/80 to-cyan-700/80",
  affiliates: "from-amber-600/80 to-yellow-700/80",
};

const CATALOG_TAB_LABELS: Record<CatalogTab, string> = {
  meals: "Meals",
  workouts: "Workout",
  supplements: "Supps",
  accessories: "Gear",
  wellness: "Wellness",
  affiliates: "Deals", // fallback; affiliate items resolve via AFFILIATE_CATEGORY_TO_DISPLAY
};

/** For affiliate items, resolve display label from their AffiliateCategory */
const getItemDisplayLabel = (item: AnyItem, catalogType: CatalogTab): string => {
  if (catalogType === "affiliates" && "category" in item) {
    return AFFILIATE_CATEGORY_TO_DISPLAY[(item as AffiliateItem).category] ?? "Other";
  }
  return CATALOG_TAB_LABELS[catalogType];
};

/** For affiliate items, resolve gradient from their mapped catalog type */
const getItemGradient = (item: AnyItem, catalogType: CatalogTab): string => {
  if (catalogType === "affiliates" && "category" in item) {
    const mapped = AFFILIATE_TO_CATALOG_TYPE[(item as AffiliateItem).category] as CatalogTab | undefined;
    return CATEGORY_GRADIENTS[mapped ?? "accessories"];
  }
  return CATEGORY_GRADIENTS[catalogType];
};

const getTagValidationError = (tags: string[]) => {
  if (tags.length > TAG_LIMITS.maxCount) {
    return `Use up to ${TAG_LIMITS.maxCount} tags`;
  }
  const overLimitTag = tags.find((tag) => tag.length > TAG_LIMITS.maxLength);
  if (overLimitTag) {
    return `Each tag must be ${TAG_LIMITS.maxLength} chars or fewer`;
  }
  return "";
};

function TagsInput({
  tagsText,
  setTagsText,
}: {
  tagsText: string;
  setTagsText: (value: string) => void;
}) {
  const parsedTags = dedupeTags(parseTagsText(tagsText));
  const validationError = getTagValidationError(parsedTags);

  return (
    <div className="space-y-1">
      <input
        value={tagsText}
        onChange={(e) => setTagsText(e.target.value)}
        placeholder="Tags (comma-separated)"
        className={inputCls}
      />
      <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
        <span>
          {parsedTags.length}/{TAG_LIMITS.maxCount} tags · {TAG_LIMITS.maxLength} chars max
        </span>
        {validationError ? <span style={{ color: "#f87171" }}>{validationError}</span> : null}
      </div>
      <SubcategoryChips tags={parsedTags} />
    </div>
  );
}

// ── Photo Upload Component ────────────────────────────────────────────────────

function PhotoUpload({
  photoUrl,
  photoSource,
  onUpload,
}: {
  photoUrl: string | null;
  photoSource?: PhotoSource;
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
        <div className="space-y-2">
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
          {photoSource === "auto" && (
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Auto from link
            </p>
          )}
          {photoSource === "manual" && (
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Uploaded by you
            </p>
          )}
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
  const [tagsText, setTagsText] = useState("");
  const [recipeSourceUrl, setRecipeSourceUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoSource>("none");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    const parsedTags = dedupeTags(parseTagsText(tagsText));
    const tagsError = getTagValidationError(parsedTags);
    if (tagsError) {
      setError(tagsError);
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
          tags: parsedTags,
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
      <PhotoUpload
        photoUrl={photoUrl}
        photoSource={photoSource}
        onUpload={(url) => {
          setPhotoUrl(url);
          setPhotoSource("manual");
        }}
      />
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
      <TagsInput tagsText={tagsText} setTagsText={setTagsText} />
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
  const [tagsText, setTagsText] = useState("");
  const [link, setLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoSource>("none");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [linkEnriching, setLinkEnriching] = useState(false);
  const [linkEnrichError, setLinkEnrichError] = useState("");
  const enrichRequestIdRef = useRef(0);

  const runLinkEnrichment = useCallback(
    async (rawUrl: string, options?: { forcePhotoRefresh?: boolean }) => {
      const trimmedUrl = rawUrl.trim();
      if (!trimmedUrl) {
        setLinkEnriching(false);
        setLinkEnrichError("");
        return;
      }
      const requestId = ++enrichRequestIdRef.current;
      setLinkEnriching(true);
      setLinkEnrichError("");
      try {
        const enriched = await enrichCatalogLink(trimmedUrl);
        if (requestId !== enrichRequestIdRef.current) return;
        if (!name.trim() && enriched.title) {
          setName(enriched.title);
        }
        if (!brand.trim() && enriched.siteName) {
          setBrand(enriched.siteName);
        }
        if (enriched.imageUrl && (options?.forcePhotoRefresh || photoSource !== "manual")) {
          setPhotoUrl(enriched.imageUrl);
          setPhotoSource("auto");
        }
      } catch {
        if (requestId !== enrichRequestIdRef.current) return;
        setLinkEnrichError("Couldn’t fetch preview. You can still save.");
      } finally {
        if (requestId === enrichRequestIdRef.current) {
          setLinkEnriching(false);
        }
      }
    },
    [brand, name, photoSource]
  );

  useEffect(() => {
    const trimmedUrl = link.trim();
    if (!trimmedUrl) {
      setLinkEnriching(false);
      setLinkEnrichError("");
      enrichRequestIdRef.current += 1;
      return;
    }
    const timeout = window.setTimeout(() => {
      void runLinkEnrichment(trimmedUrl);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [link, runLinkEnrichment]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    const parsedTags = dedupeTags(parseTagsText(tagsText));
    const tagsError = getTagValidationError(parsedTags);
    if (tagsError) {
      setError(tagsError);
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
          tags: parsedTags,
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
      <PhotoUpload
        photoUrl={photoUrl}
        photoSource={photoSource}
        onUpload={(url) => {
          setPhotoUrl(url);
          setPhotoSource("manual");
        }}
      />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplement name *" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" className={inputCls} />
        <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose (e.g. 5g)" className={inputCls} />
      </div>
      <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Schedule (e.g. Morning)" className={inputCls} />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
            Product link
          </span>
          <button
            type="button"
            onClick={() => void runLinkEnrichment(link, { forcePhotoRefresh: true })}
            disabled={!link.trim() || linkEnriching}
            className="text-[11px] px-2 py-1 rounded-md border disabled:opacity-50"
            style={{ borderColor: "rgba(36,63,22,0.25)", color: "var(--text-muted)" }}
          >
            Refresh from link preview
          </button>
        </div>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={() => void runLinkEnrichment(link)}
          placeholder="Product link (optional)"
          type="url"
          className={inputCls}
        />
        {linkEnriching && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Fetching preview…</p>}
        {!linkEnriching && linkEnrichError && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{linkEnrichError}</p>}
      </div>
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
      <TagsInput tagsText={tagsText} setTagsText={setTagsText} />
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
  const [photoSource, setPhotoSource] = useState<PhotoSource>("none");
  const [notes, setNotes] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [linkEnriching, setLinkEnriching] = useState(false);
  const [linkEnrichError, setLinkEnrichError] = useState("");
  const enrichRequestIdRef = useRef(0);

  const runLinkEnrichment = useCallback(
    async (rawUrl: string, options?: { forcePhotoRefresh?: boolean }) => {
      const trimmedUrl = rawUrl.trim();
      if (!trimmedUrl) {
        setLinkEnriching(false);
        setLinkEnrichError("");
        return;
      }
      const requestId = ++enrichRequestIdRef.current;
      setLinkEnriching(true);
      setLinkEnrichError("");
      try {
        const enriched = await enrichCatalogLink(trimmedUrl);
        if (requestId !== enrichRequestIdRef.current) return;
        if (!name.trim() && enriched.title) {
          setName(enriched.title);
        }
        if (enriched.imageUrl && (options?.forcePhotoRefresh || photoSource !== "manual")) {
          setPhotoUrl(enriched.imageUrl);
          setPhotoSource("auto");
        }
      } catch {
        if (requestId !== enrichRequestIdRef.current) return;
        setLinkEnrichError("Couldn’t fetch preview. You can still save.");
      } finally {
        if (requestId === enrichRequestIdRef.current) {
          setLinkEnriching(false);
        }
      }
    },
    [name, photoSource]
  );

  useEffect(() => {
    const trimmedUrl = link.trim();
    if (!trimmedUrl) {
      setLinkEnriching(false);
      setLinkEnrichError("");
      enrichRequestIdRef.current += 1;
      return;
    }
    const timeout = window.setTimeout(() => {
      void runLinkEnrichment(trimmedUrl);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [link, runLinkEnrichment]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    const parsedTags = dedupeTags(parseTagsText(tagsText));
    const tagsError = getTagValidationError(parsedTags);
    if (tagsError) {
      setError(tagsError);
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
          tags: parsedTags,
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
      <PhotoUpload
        photoUrl={photoUrl}
        photoSource={photoSource}
        onUpload={(url) => {
          setPhotoUrl(url);
          setPhotoSource("manual");
        }}
      />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Accessory name *" className={inputCls} />
      <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (e.g. Recovery, Gear)" className={inputCls} />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
            Link
          </span>
          <button
            type="button"
            onClick={() => void runLinkEnrichment(link, { forcePhotoRefresh: true })}
            disabled={!link.trim() || linkEnriching}
            className="text-[11px] px-2 py-1 rounded-md border disabled:opacity-50"
            style={{ borderColor: "rgba(36,63,22,0.25)", color: "var(--text-muted)" }}
          >
            Refresh from link preview
          </button>
        </div>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={() => void runLinkEnrichment(link)}
          placeholder="Link (optional)"
          type="url"
          className={inputCls}
        />
        {linkEnriching && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Fetching preview…</p>}
        {!linkEnriching && linkEnrichError && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{linkEnrichError}</p>}
      </div>
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
      <TagsInput tagsText={tagsText} setTagsText={setTagsText} />
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
  const [photoSource, setPhotoSource] = useState<PhotoSource>("none");
  const [notes, setNotes] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [linkEnriching, setLinkEnriching] = useState(false);
  const [linkEnrichError, setLinkEnrichError] = useState("");
  const enrichRequestIdRef = useRef(0);

  const runLinkEnrichment = useCallback(
    async (rawUrl: string, options?: { forcePhotoRefresh?: boolean }) => {
      const trimmedUrl = rawUrl.trim();
      if (!trimmedUrl) {
        setLinkEnriching(false);
        setLinkEnrichError("");
        return;
      }
      const requestId = ++enrichRequestIdRef.current;
      setLinkEnriching(true);
      setLinkEnrichError("");
      try {
        const enriched = await enrichCatalogLink(trimmedUrl);
        if (requestId !== enrichRequestIdRef.current) return;
        if (!name.trim() && enriched.title) {
          setName(enriched.title);
        }
        if (enriched.imageUrl && (options?.forcePhotoRefresh || photoSource !== "manual")) {
          setPhotoUrl(enriched.imageUrl);
          setPhotoSource("auto");
        }
      } catch {
        if (requestId !== enrichRequestIdRef.current) return;
        setLinkEnrichError("Couldn’t fetch preview. You can still save.");
      } finally {
        if (requestId === enrichRequestIdRef.current) {
          setLinkEnriching(false);
        }
      }
    },
    [name, photoSource]
  );

  useEffect(() => {
    const trimmedUrl = link.trim();
    if (!trimmedUrl) {
      setLinkEnriching(false);
      setLinkEnrichError("");
      enrichRequestIdRef.current += 1;
      return;
    }
    const timeout = window.setTimeout(() => {
      void runLinkEnrichment(trimmedUrl);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [link, runLinkEnrichment]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    const parsedTags = dedupeTags(parseTagsText(tagsText));
    const tagsError = getTagValidationError(parsedTags);
    if (tagsError) {
      setError(tagsError);
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
          tags: parsedTags,
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
      <PhotoUpload
        photoUrl={photoUrl}
        photoSource={photoSource}
        onUpload={(url) => {
          setPhotoUrl(url);
          setPhotoSource("manual");
        }}
      />
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
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
            Link
          </span>
          <button
            type="button"
            onClick={() => void runLinkEnrichment(link, { forcePhotoRefresh: true })}
            disabled={!link.trim() || linkEnriching}
            className="text-[11px] px-2 py-1 rounded-md border disabled:opacity-50"
            style={{ borderColor: "rgba(36,63,22,0.25)", color: "var(--text-muted)" }}
          >
            Refresh from link preview
          </button>
        </div>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={() => void runLinkEnrichment(link)}
          placeholder="Link (optional)"
          type="url"
          className={inputCls}
        />
        {linkEnriching && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Fetching preview…</p>}
        {!linkEnriching && linkEnrichError && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{linkEnrichError}</p>}
      </div>
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
      <TagsInput tagsText={tagsText} setTagsText={setTagsText} />
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
  const [tagsText, setTagsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    const parsedTags = dedupeTags(parseTagsText(tagsText));
    const tagsError = getTagValidationError(parsedTags);
    if (tagsError) {
      setError(tagsError);
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
          tags: parsedTags,
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
      <TagsInput tagsText={tagsText} setTagsText={setTagsText} />
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

// ── Add Affiliate Form ────────────────────────────────────────────────────────

const AFFILIATE_CATEGORY_OPTIONS = [
  { value: "SUPPLEMENTS", label: "Supps" },
  { value: "NUTRITION", label: "Meals" },
  { value: "GYM_ACCESSORIES", label: "Gear" },
  { value: "WELLNESS_ACCESSORIES", label: "Wellness" },
  { value: "OTHER", label: "Other" },
];

interface BulkItem {
  id: string;
  name: string;
  brand: string | null;
  link: string | null;
  referralCode: string | null;
  category: string;
  subcategory: string;
  tagsText: string;
  photoUrl: string | null;
  confidence: number;
  confidenceReasons: string[];
  needsReview: boolean;
  lowConfidenceConfirmed: boolean;
  included: boolean;
}

function AddAffiliateForm({
  onAdd,
  onBulkSaveComplete,
}: {
  onAdd: (a: AffiliateItem) => void;
  onBulkSaveComplete: () => Promise<void>;
}) {
  // Mode: "paste" (bulk) or "single" (manual single item)
  const [mode, setMode] = useState<"paste" | "single">("paste");

  // Bulk paste state
  const [rawText, setRawText] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkParsed, setBulkParsed] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  // Single item state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [link, setLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoSource>("none");
  const [tagsText, setTagsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const CONF_MAP: Record<string, number> = { high: 0.9, medium: 0.65, low: 0.35 };

  const [enriching, setEnriching] = useState(false);
  const [linkEnriching, setLinkEnriching] = useState(false);
  const [linkEnrichError, setLinkEnrichError] = useState("");
  const singleEnrichRequestIdRef = useRef(0);

  // Parse bulk text and enrich with URL metadata
  const handleBulkParse = async () => {
    if (!rawText.trim()) return;
    setError("");
    const { parseBulkAffiliateInput } = await import("@/lib/affiliate-parser");
    const detected = parseBulkAffiliateInput(rawText);
    if (detected.length === 0) {
      setError("No links or codes detected. Try pasting one per line.");
      return;
    }

    // Auto-enrich each item with URL metadata (title, image, site name)
    setEnriching(true);
    for (const d of detected) {
      if (d.link) {
        try {
          const meta = await enrichCatalogLink(d.link);
          // Use og:title if the current name is just a domain or generic
          if (meta.title) {
            const domainOnly = (() => {
              try { return new URL(d.link!).hostname.replace(/^www\./, ""); } catch { return ""; }
            })();
            if (!d.name || d.name === domainOnly || d.name.length < 3) {
              d.name = meta.title;
            }
          }
          if (meta.imageUrl && !d.logoUrl) {
            d.logoUrl = meta.imageUrl;
          }
          if (meta.siteName && !d.brand) {
            d.brand = meta.siteName;
          }
        } catch { /* continue enriching other items */ }
      }
    }
    setEnriching(false);

    setBulkItems(
      detected.map((d, i) => {
        const confidence = CONF_MAP[d.confidence] ?? 0.35;
        return {
          id: `${Date.now()}-${i}`,
          name: d.name,
          brand: d.brand,
          link: d.link,
          referralCode: d.referralCode,
          category: d.category,
          subcategory: d.subcategoryTags.join(", "),
          tagsText: d.subcategoryTags.join(", "),
          photoUrl: d.logoUrl ?? null,
          confidence,
          confidenceReasons: d.confidenceReasons,
          needsReview: d.needsReview,
          lowConfidenceConfirmed: confidence >= 0.55,
          included: true,
        };
      })
    );
    setBulkParsed(true);
    setReviewIndex(0);
  };

  const runSingleLinkEnrichment = useCallback(
    async (rawUrl: string, options?: { forcePhotoRefresh?: boolean }) => {
      const trimmedUrl = rawUrl.trim();
      if (!trimmedUrl || mode !== "single") {
        setLinkEnriching(false);
        setLinkEnrichError("");
        return;
      }
      const requestId = ++singleEnrichRequestIdRef.current;
      setLinkEnriching(true);
      setLinkEnrichError("");
      try {
        const enriched = await enrichCatalogLink(trimmedUrl);
        if (requestId !== singleEnrichRequestIdRef.current) return;
        if (!name.trim() && enriched.title) {
          setName(enriched.title);
        }
        if (!brand.trim() && enriched.siteName) {
          setBrand(enriched.siteName);
        }
        if (enriched.imageUrl && (options?.forcePhotoRefresh || photoSource !== "manual")) {
          setPhotoUrl(enriched.imageUrl);
          setPhotoSource("auto");
        }
      } catch {
        if (requestId !== singleEnrichRequestIdRef.current) return;
        setLinkEnrichError("Couldn’t fetch preview. You can still save.");
      } finally {
        if (requestId === singleEnrichRequestIdRef.current) {
          setLinkEnriching(false);
        }
      }
    },
    [brand, mode, name, photoSource]
  );

  const updateBulkItem = (index: number, field: keyof BulkItem, value: string | boolean | null | number) => {
    setBulkItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleBulkSubmit = async () => {
    const toSave = bulkItems.filter((b) => b.included);
    if (toSave.length === 0) {
      setError("Select at least one item to save");
      return;
    }
    const invalid = toSave.find((b) => !b.name.trim());
    if (invalid) {
      setError("Every item needs a name");
      return;
    }
    const lowConfidencePending = toSave.filter((item) => item.confidence < 0.55 && !item.lowConfidenceConfirmed);
    if (lowConfidencePending.length > 0) {
      setError(`Confirm ${lowConfidencePending.length} low-confidence item(s) before saving.`);
      return;
    }
    setBulkSubmitting(true);
    setError("");
    let savedCount = 0;
    for (const item of toSave) {
      try {
        const res = await fetch("/api/catalog/affiliates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name.trim(),
            brand: item.brand?.trim() || undefined,
            link: item.link?.trim() || undefined,
            referralCode: item.referralCode?.trim() || undefined,
            category: item.category,
            photoUrl: item.photoUrl?.trim() || undefined,
            tags: dedupeTags(parseTagsText(item.tagsText)),
            subcategoryTags: dedupeTags(parseTagsText(item.tagsText)),
            logoUrl: item.photoUrl?.trim() || undefined,
            enrichmentConfidence: item.confidence >= 0.75 ? "high" : item.confidence >= 0.55 ? "medium" : "low",
            needsReview: item.needsReview,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          onAdd(saved);
          savedCount++;
        }
      } catch {
        /* continue with next */
      }
    }
    setBulkSubmitting(false);
    if (savedCount > 0) {
      setRawText("");
      setBulkItems([]);
      setBulkParsed(false);
      setReviewIndex(0);
      await onBulkSaveComplete();
    }
    if (savedCount < toSave.length) {
      setError(`Saved ${savedCount}/${toSave.length} items. Some failed.`);
    }
  };

  useEffect(() => {
    if (!bulkParsed || mode !== "paste") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setReviewIndex((prev) => Math.min(prev + 1, Math.max(0, bulkItems.length - 1)));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setReviewIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bulkParsed, mode, bulkItems.length]);

  useEffect(() => {
    if (mode !== "single") {
      setLinkEnriching(false);
      setLinkEnrichError("");
      singleEnrichRequestIdRef.current += 1;
      return;
    }
    const trimmedUrl = link.trim();
    if (!trimmedUrl) {
      setLinkEnriching(false);
      setLinkEnrichError("");
      singleEnrichRequestIdRef.current += 1;
      return;
    }
    const timeout = window.setTimeout(() => {
      void runSingleLinkEnrichment(trimmedUrl);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [link, mode, runSingleLinkEnrichment]);

  // Single item smart-paste
  const handleSingleParse = () => {
    if (!rawText.trim()) return;
    import("@/lib/affiliate-parser").then(({ parseAffiliateInput, suggestCategory }) => {
      const result = parseAffiliateInput(rawText);
      if (result.urls.length > 0 && !link) setLink(result.urls[0]);
      if (result.codes.length > 0 && !referralCode) setReferralCode(result.codes[0]);
      if (result.brand && !brand) setBrand(result.brand);
      const suggested = suggestCategory(rawText, result.urls[0]);
      if (suggested !== "OTHER" && category === "OTHER") setCategory(suggested);
    });
  };

  const handleSingleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!link.trim() && !referralCode.trim()) {
      setError("Add a link or code");
      return;
    }
    const parsedTags = dedupeTags(parseTagsText(tagsText));
    const tagsError = getTagValidationError(parsedTags);
    if (tagsError) {
      setError(tagsError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/catalog/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || undefined,
          description: description.trim() || undefined,
          link: link.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
          category,
          ctaLabel: ctaLabel.trim() || undefined,
          photoUrl: photoUrl || undefined,
          tags: parsedTags,
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
      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}

      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden" style={{ background: "rgba(36,63,22,0.06)" }}>
        <button
          onClick={() => { setMode("paste"); setError(""); }}
          className="flex-1 py-2 text-xs font-medium transition-all"
          style={{
            background: mode === "paste" ? "var(--brand)" : "transparent",
            color: mode === "paste" ? "#ffffff" : "var(--text-muted)",
          }}
        >
          Bulk Paste
        </button>
        <button
          onClick={() => { setMode("single"); setError(""); }}
          className="flex-1 py-2 text-xs font-medium transition-all"
          style={{
            background: mode === "single" ? "var(--brand)" : "transparent",
            color: mode === "single" ? "#ffffff" : "var(--text-muted)",
          }}
        >
          Add One
        </button>
      </div>

      {mode === "paste" ? (
        /* ── Bulk Paste Mode ── */
        <>
          {!bulkParsed ? (
            <>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder={"Paste your affiliate links & codes here — one per line:\n\nhttps://myprotein.com/ref/ROYAL20\nhttps://gymshark.com?ref=abc GYMCODE15\nhttps://whoop.com/join/xyz"}
                className="textarea-dark w-full resize-none"
              />
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                One link or code per line. We&apos;ll auto-detect brands and categories.
              </p>
              <button
                onClick={handleBulkParse}
                disabled={!rawText.trim() || enriching}
                className="w-full py-2.5 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
                style={{ color: "#ffffff" }}
              >
                {enriching ? "Detecting & enriching..." : "Detect Items"}
              </button>
            </>
          ) : (
            <>
              {/* Review detected items */}
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {bulkItems.filter((b) => b.included).length} of {bulkItems.length} items selected
                </p>
                {bulkItems.length > 0 && (() => {
                  const activeIndex = Math.min(reviewIndex, bulkItems.length - 1);
                  const item = bulkItems[activeIndex];
                  if (!item) return null;
                  const confidencePercent = Math.round(item.confidence * 100);
                  const confidenceTone = item.confidence >= 0.75 ? "#528531" : item.confidence >= 0.55 ? "#9A7B2E" : "#f87171";
                  const confidenceLabel = item.confidence >= 0.75 ? "High confidence" : item.confidence >= 0.55 ? "Medium confidence" : "Low confidence";
                  return (
                    <div
                      className="rounded-xl p-3 space-y-3 transition-opacity"
                      style={{
                        background: item.included ? "var(--surface)" : "rgba(36,63,22,0.02)",
                        border: item.needsReview ? "1px solid rgba(248,113,113,0.28)" : "1px solid rgba(36,63,22,0.10)",
                        opacity: item.included ? 1 : 0.55,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                          Review {activeIndex + 1} / {bulkItems.length}
                        </p>
                        <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: `${confidenceTone}22`, color: confidenceTone }}>
                          {confidenceLabel} · {confidencePercent}%
                        </span>
                      </div>
                      {item.confidenceReasons.length > 0 && (
                        <ul className="text-[10px] space-y-0.5" style={{ color: confidenceTone }}>
                          {item.confidenceReasons.map((r, idx) => <li key={idx}>· {r}</li>)}
                        </ul>
                      )}
                      <input value={item.name} onChange={(e) => updateBulkItem(activeIndex, "name", e.target.value)} placeholder="Title *" className={inputCls} />
                      <input value={item.brand ?? ""} onChange={(e) => updateBulkItem(activeIndex, "brand", e.target.value)} placeholder="Brand" className={inputCls} />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={item.category} onChange={(e) => updateBulkItem(activeIndex, "category", e.target.value)} className="select-dark w-full">
                          {AFFILIATE_CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input value={item.subcategory} onChange={(e) => updateBulkItem(activeIndex, "subcategory", e.target.value)} placeholder="Subcategory tag" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={item.link ?? ""} onChange={(e) => updateBulkItem(activeIndex, "link", e.target.value)} placeholder="Affiliate link" className={inputCls} />
                        <input value={item.referralCode ?? ""} onChange={(e) => updateBulkItem(activeIndex, "referralCode", e.target.value)} placeholder="Code" className={inputCls} />
                      </div>
                      <input value={item.photoUrl ?? ""} onChange={(e) => updateBulkItem(activeIndex, "photoUrl", e.target.value)} placeholder="Logo image URL" className={inputCls} />
                      <input value={item.tagsText} onChange={(e) => updateBulkItem(activeIndex, "tagsText", e.target.value)} placeholder="Tags (comma-separated)" className={inputCls} />
                      {item.confidence < 0.55 && item.included && (
                        <label className="flex items-start gap-2 text-xs" style={{ color: "#f87171" }}>
                          <input
                            type="checkbox"
                            checked={item.lowConfidenceConfirmed}
                            onChange={(e) => updateBulkItem(activeIndex, "lowConfidenceConfirmed", e.target.checked)}
                            className="mt-0.5 rounded"
                          />
                          Confirm this low-confidence item before final save.
                        </label>
                      )}
                      <div className="flex flex-wrap gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {item.link && <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(36,63,22,0.06)" }}><HiLink className="inline w-2.5 h-2.5 mr-1" />{item.link}</span>}
                        {item.referralCode && <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(154,123,46,0.12)", color: "#9A7B2E" }}>{item.referralCode}</span>}
                        <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(36,63,22,0.06)" }}>{AFFILIATE_CATEGORY_LABELS[item.category] ?? "Other"}</span>
                        {item.subcategory.trim() && <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(36,63,22,0.06)" }}>#{item.subcategory.trim()}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateBulkItem(activeIndex, "included", true)} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(82,133,49,0.14)", color: "#528531" }}>Accept</button>
                        <button onClick={() => updateBulkItem(activeIndex, "included", false)} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(248,113,113,0.14)", color: "#f87171" }}>Skip</button>
                        <button onClick={() => updateBulkItem(activeIndex, "needsReview", true)} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(36,63,22,0.08)", color: "var(--text-muted)" }}>Edit</button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReviewIndex((prev) => Math.max(prev - 1, 0))}
                          disabled={activeIndex === 0}
                          className="flex-1 py-2 rounded-xl text-xs font-medium disabled:opacity-40"
                          style={{ background: "rgba(36,63,22,0.06)", color: "var(--text-muted)" }}
                        >
                          <HiChevronLeft className="inline w-3.5 h-3.5 mr-1" />
                          Previous
                        </button>
                        <button
                          onClick={() => setReviewIndex((prev) => Math.min(prev + 1, bulkItems.length - 1))}
                          disabled={activeIndex === bulkItems.length - 1}
                          className="flex-1 py-2 rounded-xl text-xs font-medium disabled:opacity-40"
                          style={{ background: "rgba(36,63,22,0.06)", color: "var(--text-muted)" }}
                        >
                          Next
                          <HiChevronRight className="inline w-3.5 h-3.5 ml-1" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setBulkParsed(false); setBulkItems([]); setReviewIndex(0); }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(36,63,22,0.06)", color: "var(--text-muted)" }}
                >
                  Back
                </button>
                <button
                  onClick={handleBulkSubmit}
                  disabled={bulkSubmitting || bulkItems.filter((b) => b.included).length === 0}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
                  style={{ color: "#ffffff" }}
                >
                  {bulkSubmitting ? "Saving..." : `Save Reviewed ${bulkItems.filter((b) => b.included).length}`}
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        /* ── Single Item Mode ── */
        <>
          <div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onBlur={handleSingleParse}
              rows={2}
              placeholder="Paste link or promo text to auto-fill..."
              className="textarea-dark w-full resize-none"
            />
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              We&apos;ll auto-detect links, codes, and categories
            </p>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name *" className={inputCls} />
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name (optional)" className={inputCls} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                Affiliate link
              </span>
              <button
                type="button"
                onClick={() => void runSingleLinkEnrichment(link, { forcePhotoRefresh: true })}
                disabled={!link.trim() || linkEnriching}
                className="text-[11px] px-2 py-1 rounded-md border disabled:opacity-50"
                style={{ borderColor: "rgba(36,63,22,0.25)", color: "var(--text-muted)" }}
              >
                Refresh from link preview
              </button>
            </div>
            <div className="relative">
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={() => void runSingleLinkEnrichment(link)}
                placeholder="Affiliate / referral link"
                className={inputCls}
              />
              {link && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(36,63,22,0.15)", color: "#528531" }}>
                  Link
                </span>
              )}
            </div>
            {linkEnriching && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Fetching preview…</p>}
            {!linkEnriching && linkEnrichError && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{linkEnrichError}</p>}
          </div>
          <div className="relative">
            <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Discount / promo code (e.g. ROYAL20)" className={inputCls} />
            {referralCode && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(154,123,46,0.15)", color: "#9A7B2E" }}>
                Code
              </span>
            )}
          </div>
          <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Primary CTA label (optional)" className={inputCls} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-dark w-full">
            {AFFILIATE_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description (optional)" className="textarea-dark w-full resize-none" />
          <PhotoUpload
            photoUrl={photoUrl}
            photoSource={photoSource}
            onUpload={(url) => {
              setPhotoUrl(url);
              setPhotoSource("manual");
            }}
          />
          <TagsInput tagsText={tagsText} setTagsText={setTagsText} />
          <button
            onClick={handleSingleSubmit}
            disabled={submitting}
            className="w-full py-2 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
            style={{ color: "#ffffff" }}
          >
            {submitting ? "Saving..." : "Add Affiliate Item"}
          </button>
        </>
      )}
    </div>
  );
}

function EditItemModal({
  item,
  tab,
  onClose,
  onSave,
}: {
  item: AnyItem;
  tab: CatalogTab;
  onClose: () => void;
  onSave: (updated: AnyItem) => void;
}) {
  const [name, setName] = useState(item.name ?? "");
  const [ingredients, setIngredients] = useState(
    tab === "meals" ? ((item as SavedMeal).ingredients ?? []).join(", ") : ""
  );
  const [calories, setCalories] = useState(
    tab === "meals" && (item as SavedMeal).calories != null ? String((item as SavedMeal).calories) : ""
  );
  const [protein, setProtein] = useState(
    tab === "meals" && (item as SavedMeal).protein != null ? String((item as SavedMeal).protein) : ""
  );
  const [carbs, setCarbs] = useState(
    tab === "meals" && (item as SavedMeal).carbs != null ? String((item as SavedMeal).carbs) : ""
  );
  const [fat, setFat] = useState(
    tab === "meals" && (item as SavedMeal).fat != null ? String((item as SavedMeal).fat) : ""
  );
  const [recipeSourceUrl, setRecipeSourceUrl] = useState(
    tab === "meals" ? (item as SavedMeal).recipeSourceUrl ?? "" : ""
  );
  const [exercisesJson, setExercisesJson] = useState(
    tab === "workouts" ? (item as SavedWorkout).exercisesJson ?? "" : ""
  );
  const [videoUrl, setVideoUrl] = useState(
    tab === "workouts" ? (item as SavedWorkout).videoUrl ?? "" : ""
  );
  const [brand, setBrand] = useState(
    tab === "supplements"
      ? (item as Supplement).brand ?? ""
      : tab === "affiliates"
        ? (item as AffiliateItem).brand ?? ""
        : ""
  );
  const [dose, setDose] = useState(
    tab === "supplements" ? (item as Supplement).dose ?? "" : ""
  );
  const [schedule, setSchedule] = useState(
    tab === "supplements" ? (item as Supplement).schedule ?? "" : ""
  );
  const [type, setType] = useState(
    tab === "accessories" ? (item as Accessory).type ?? "" : ""
  );
  const [activityType, setActivityType] = useState(
    tab === "wellness" ? (item as SavedWellnessItem).activityType ?? "" : ""
  );
  const [durationMinutes, setDurationMinutes] = useState(
    tab === "wellness" && (item as SavedWellnessItem).durationMinutes != null
      ? String((item as SavedWellnessItem).durationMinutes)
      : ""
  );
  const [link, setLink] = useState(
    tab === "supplements"
      ? (item as Supplement).link ?? ""
      : tab === "accessories"
        ? (item as Accessory).link ?? ""
        : tab === "wellness"
          ? (item as SavedWellnessItem).link ?? ""
          : tab === "affiliates"
            ? (item as AffiliateItem).link ?? ""
            : ""
  );
  const [referralCode, setReferralCode] = useState(
    tab === "supplements"
      ? (item as Supplement).referralCode ?? ""
      : tab === "accessories"
        ? (item as Accessory).referralCode ?? ""
        : tab === "wellness"
          ? (item as SavedWellnessItem).referralCode ?? ""
          : tab === "affiliates"
            ? (item as AffiliateItem).referralCode ?? ""
            : ""
  );
  const [notes, setNotes] = useState(
    tab === "affiliates"
      ? (item as AffiliateItem).description ?? ""
      : ("notes" in item ? (item as { notes: string | null }).notes : "") ?? ""
  );
  const [photoUrl, setPhotoUrl] = useState(("photoUrl" in item ? (item as { photoUrl: string | null }).photoUrl : "") ?? "");
  const [tagsText, setTagsText] = useState((item.tags ?? []).join(", "));
  const [affiliateCategory, setAffiliateCategory] = useState(
    tab === "affiliates" ? (item as AffiliateItem).category : "OTHER"
  );
  const [subcategoryTagsText, setSubcategoryTagsText] = useState(
    tab === "affiliates" ? ((item as AffiliateItem).subcategoryTags ?? []).join(", ") : ""
  );
  const [ctaLabel, setCtaLabel] = useState(
    tab === "affiliates" ? (item as AffiliateItem).ctaLabel ?? "" : ""
  );
  const [logoUrl, setLogoUrl] = useState(
    tab === "affiliates" ? (item as AffiliateItem).logoUrl ?? "" : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }

    const parsedTags = dedupeTags(parseTagsText(tagsText));
    const tagsError = getTagValidationError(parsedTags);
    if (tagsError) {
      setError(tagsError);
      return;
    }

    if (tab === "workouts") {
      try {
        JSON.parse(exercisesJson || "[]");
      } catch {
        setError("Exercises must be valid JSON");
        return;
      }
    }

    const payload: Record<string, unknown> = {};
    const addIfChanged = (key: string, value: unknown, original: unknown) => {
      const left = Array.isArray(value) ? JSON.stringify(value) : value;
      const right = Array.isArray(original) ? JSON.stringify(original) : original;
      if (left !== right) payload[key] = value;
    };

    addIfChanged("name", name.trim(), item.name);
    addIfChanged("tags", parsedTags, item.tags ?? []);

    if (tab === "meals") {
      const original = item as SavedMeal;
      addIfChanged(
        "ingredients",
        ingredients.split(",").map((s) => s.trim()).filter(Boolean),
        original.ingredients ?? []
      );
      addIfChanged("calories", calories ? parseInt(calories) : undefined, original.calories ?? undefined);
      addIfChanged("protein", protein ? parseFloat(protein) : undefined, original.protein ?? undefined);
      addIfChanged("carbs", carbs ? parseFloat(carbs) : undefined, original.carbs ?? undefined);
      addIfChanged("fat", fat ? parseFloat(fat) : undefined, original.fat ?? undefined);
      addIfChanged("recipeSourceUrl", recipeSourceUrl.trim(), original.recipeSourceUrl ?? "");
      addIfChanged("photoUrl", photoUrl || undefined, original.photoUrl ?? undefined);
      addIfChanged("notes", notes.trim(), original.notes ?? "");
    } else if (tab === "workouts") {
      const original = item as SavedWorkout;
      addIfChanged("exercisesJson", exercisesJson.trim(), original.exercisesJson ?? "");
      addIfChanged("videoUrl", videoUrl.trim(), original.videoUrl ?? "");
      addIfChanged("notes", notes.trim(), original.notes ?? "");
    } else if (tab === "supplements") {
      const original = item as Supplement;
      addIfChanged("brand", brand.trim(), original.brand ?? "");
      addIfChanged("dose", dose.trim(), original.dose ?? "");
      addIfChanged("schedule", schedule.trim(), original.schedule ?? "");
      addIfChanged("notes", notes.trim(), original.notes ?? "");
      addIfChanged("photoUrl", photoUrl || undefined, original.photoUrl ?? undefined);
      addIfChanged("link", link.trim(), original.link ?? "");
      addIfChanged("referralCode", referralCode.trim(), original.referralCode ?? "");
    } else if (tab === "accessories") {
      const original = item as Accessory;
      addIfChanged("type", type.trim(), original.type ?? "");
      addIfChanged("link", link.trim(), original.link ?? "");
      addIfChanged("photoUrl", photoUrl || undefined, original.photoUrl ?? undefined);
      addIfChanged("referralCode", referralCode.trim(), original.referralCode ?? "");
      addIfChanged("notes", notes.trim(), original.notes ?? "");
    } else if (tab === "wellness") {
      const original = item as SavedWellnessItem;
      addIfChanged("activityType", activityType.trim(), original.activityType ?? "");
      addIfChanged(
        "durationMinutes",
        durationMinutes ? parseInt(durationMinutes) : undefined,
        original.durationMinutes ?? undefined
      );
      addIfChanged("link", link.trim(), original.link ?? "");
      addIfChanged("photoUrl", photoUrl || undefined, original.photoUrl ?? undefined);
      addIfChanged("referralCode", referralCode.trim(), original.referralCode ?? "");
      addIfChanged("notes", notes.trim(), original.notes ?? "");
    } else if (tab === "affiliates") {
      const original = item as AffiliateItem;
      addIfChanged("description", notes.trim(), original.description ?? "");
      addIfChanged("brand", brand.trim(), original.brand ?? "");
      addIfChanged("link", link.trim(), original.link ?? "");
      addIfChanged("referralCode", referralCode.trim(), original.referralCode ?? "");
      addIfChanged("category", affiliateCategory, original.category);
      addIfChanged("subcategoryTags", dedupeTags(parseTagsText(subcategoryTagsText)), original.subcategoryTags ?? []);
      addIfChanged("ctaLabel", ctaLabel.trim() || undefined, original.ctaLabel ?? undefined);
      addIfChanged("logoUrl", logoUrl.trim() || undefined, original.logoUrl ?? undefined);
      addIfChanged("photoUrl", photoUrl || undefined, original.photoUrl ?? undefined);
    }

    if (Object.keys(payload).length === 0) {
      setError("No changes to save");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/catalog/${tab}?id=${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update");
        return;
      }
      const updated = await res.json();
      onSave(updated);
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const namePlaceholder = (): string => {
    if (tab === "meals") return "Meal name (e.g. Chicken Bowl)";
    if (tab === "workouts") return "Workout name (e.g. Push Day)";
    if (tab === "supplements") return "Product name (e.g. Whey Protein)";
    if (tab === "accessories") return "Item name (e.g. Resistance Bands)";
    if (tab === "wellness") return "Activity name (e.g. Morning Run)";
    if (tab === "affiliates") return "Brand or offer name (e.g. Dutch Meadows Farm)";
    return "Name";
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md flex flex-col max-h-[85vh] rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(36,63,22,0.08)" }}>
          <h3 className="text-base font-semibold truncate">Edit {item.name}</h3>
          <button onClick={onClose} className="ml-2 shrink-0 p-1.5 rounded-full" style={{ background: "rgba(24,25,15,0.09)" }}>
            <HiX className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-4 space-y-3" style={{ WebkitOverflowScrolling: "touch" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={namePlaceholder()} className={inputCls} />

          {tab === "meals" && (
            <>
              <input value={recipeSourceUrl} onChange={(e) => setRecipeSourceUrl(e.target.value)} placeholder="Recipe URL (optional)" className={inputCls} />
              <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingredients (comma-separated, optional)" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calories" className={inputCls} />
                <input type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein (g)" className={inputCls} />
                <input type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs (g)" className={inputCls} />
                <input type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fat (g)" className={inputCls} />
              </div>
            </>
          )}
          {tab === "workouts" && (
            <>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL (optional)" className={inputCls} />
              <textarea value={exercisesJson} onChange={(e) => setExercisesJson(e.target.value)} rows={4} placeholder='Exercises JSON (e.g. [{"name":"Squat","sets":3}])' className="textarea-dark w-full resize-none" />
            </>
          )}
          {tab === "supplements" && (
            <>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand (e.g. Optimum Nutrition)" className={inputCls} />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Website / Shop URL" className={inputCls} />
              <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Promo or referral code" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose (optional)" className={inputCls} />
                <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Schedule (optional)" className={inputCls} />
              </div>
            </>
          )}
          {tab === "accessories" && (
            <>
              <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Item type (e.g. Resistance Band)" className={inputCls} />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Website / Shop URL" className={inputCls} />
              <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Promo or referral code" className={inputCls} />
            </>
          )}
          {tab === "wellness" && (
            <>
              <input value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="Activity type (e.g. Yoga, HIIT)" className={inputCls} />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Website / App URL" className={inputCls} />
              <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Promo or referral code" className={inputCls} />
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="Duration (minutes, optional)" className={inputCls} />
            </>
          )}
          {tab === "affiliates" && (
            <>
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Affiliate / referral link (the URL to share)" className={inputCls} />
              <div className="space-y-1">
                <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Promo code (e.g. SAVE20) — optional" className={inputCls} />
                <p className="text-xs pl-1" style={{ color: "var(--text-muted)" }}>Short code only — not the same URL as above</p>
              </div>
              <select value={affiliateCategory} onChange={(e) => setAffiliateCategory(e.target.value)} className="select-dark w-full">
                {AFFILIATE_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Primary CTA label (optional)" className={inputCls} />
              <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo image URL (optional)" className={inputCls} />
              <input value={subcategoryTagsText} onChange={(e) => setSubcategoryTagsText(e.target.value)} placeholder="Subcategory tags (comma-separated, optional)" className={inputCls} />
            </>
          )}

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={tab === "affiliates" ? "Description (optional)" : "Notes (optional)"} className="textarea-dark w-full resize-none" />
          {tab === "affiliates" && (
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name (optional)" className={inputCls} />
          )}
          {tab !== "workouts" && <PhotoUpload photoUrl={photoUrl || null} onUpload={setPhotoUrl} />}
          <TagsInput tagsText={tagsText} setTagsText={setTagsText} />
          {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
        </div>

        {/* Sticky footer */}
        <div
          className="px-4 py-3 shrink-0"
          style={{
            borderTop: "1px solid rgba(36,63,22,0.08)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold btn-gradient disabled:opacity-50"
            style={{ color: "#ffffff" }}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Site Logo (for affiliate items without a photo) ───────────────────────────

function SiteLogo({ url, name, gradient }: { url: string | null; name: string; gradient: string }) {
  const [imgError, setImgError] = useState(false);
  const domain = url
    ? (() => {
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })()
    : null;

  if (!domain || imgError) {
    return (
      <div className={`w-full h-28 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-5xl font-bold text-white/70">{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-28 flex items-center justify-center" style={{ background: "var(--surface)" }}>
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        className="max-h-16 max-w-[55%] object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function ItemDetailModal({
  item,
  tab,
  onClose,
  onEdit,
  onDelete,
}: {
  item: AnyItem;
  tab: CatalogTab;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tabLabel = getItemDisplayLabel(item, tab);
  const tabGradient = getItemGradient(item, tab);
  const detailTags = getCatalogDisplayTags({
    tags: item.tags,
    subcategoryTags: tab === "affiliates" ? (item as AffiliateItem).subcategoryTags : null,
    brand: tab === "supplements" || tab === "affiliates" ? (item as Supplement | AffiliateItem).brand : null,
    type: tab === "accessories" ? (item as Accessory).type : null,
    activityType: tab === "wellness" ? (item as SavedWellnessItem).activityType : null,
    categoryLabel:
      tab === "affiliates" && (item as AffiliateItem).category !== "OTHER"
        ? AFFILIATE_CATEGORY_LABELS[(item as AffiliateItem).category]
        : null,
  });

  const photoUrl = "photoUrl" in item ? (item as { photoUrl: string | null }).photoUrl : null;
  const logoUrl = tab === "affiliates" ? (item as AffiliateItem).logoUrl : null;
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

  const getLinkLabel = (): string => {
    if (tab === "affiliates" && (item as AffiliateItem).ctaLabel) {
      return (item as AffiliateItem).ctaLabel!;
    }
    if (tab === "workouts") return "Watch Video";
    if (tab === "meals") return "View Recipe";
    if (tab === "wellness") return "Open Link";
    if (referralCode && link) return "Shop with Code";
    if (link) return "Open Link";
    return "View Deal";
  };

  const itemLink =
    link ||
    (tab === "meals" ? (item as SavedMeal).recipeSourceUrl : null) ||
    (tab === "workouts" ? (item as SavedWorkout).videoUrl : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-0"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md flex flex-col max-h-[85dvh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid rgba(36,63,22,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(36,63,22,0.08)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-xs px-2.5 py-0.5 rounded-full shrink-0"
              style={{ background: "rgba(36,63,22,0.12)", color: "#528531" }}
            >
              {tabLabel}
            </span>
            <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{item.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="ml-2 shrink-0 p-1.5 rounded-full"
            style={{ background: "rgba(24,25,15,0.09)", color: "var(--text)" }}
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain flex-1" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Image / logo */}
          {photoUrl || logoUrl ? (
            <div className="w-full aspect-[4/3]">
              <img src={(photoUrl || logoUrl)!} alt={item.name} className="w-full h-full object-cover" />
            </div>
          ) : tab === "affiliates" ? (
            <SiteLogo url={link} name={item.name} gradient={tabGradient} />
          ) : (
            <div
              className={`w-full h-24 bg-gradient-to-br ${tabGradient} flex items-center justify-center`}
            >
              <span className="text-lg font-semibold uppercase tracking-[0.12em] text-white/90">
                {tabLabel}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Brand */}
            {("brand" in item && (item as { brand: string | null }).brand) && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                by {(item as { brand: string | null }).brand}
              </p>
            )}

            {detailTags.length > 0 && (
              <SubcategoryChips tags={detailTags} />
            )}

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

            {/* Affiliate description */}
            {tab === "affiliates" && (item as AffiliateItem).description && (
              <p className="text-sm" style={{ color: "var(--text)" }}>
                {(item as AffiliateItem).description}
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
                <div className="min-w-0 overflow-hidden mr-3">
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Promo Code
                  </p>
                  <p className="text-base font-bold tracking-wider break-all" style={{ color: "#528531" }}>
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
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
            )}

            {/* Link button */}
            {itemLink && (
              <a
                href={itemLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (isCapacitorNative()) {
                    e.preventDefault();
                    openExternalLink(itemLink);
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold btn-gradient transition-all"
                style={{ color: "#ffffff" }}
              >
                <HiExternalLink className="w-4 h-4" />
                {getLinkLabel()}
              </a>
            )}
          </div>
        </div>

        {/* Sticky footer — Edit + Delete always visible */}
        <div
          className="flex gap-2 px-4 py-3 shrink-0"
          style={{
            borderTop: "1px solid rgba(36,63,22,0.08)",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          }}
        >
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(82,133,49,0.12)", color: "#528531", border: "1px solid rgba(82,133,49,0.25)" }}
          >
            <HiPencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <HiTrash className="w-4 h-4" />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Picker ───────────────────────────────────────────────────────────

const CATEGORY_PICKER_OPTIONS: { key: CatalogTab; label: string; emoji: string }[] = [
  { key: "meals",       label: "Meals",        emoji: "🍽" },
  { key: "workouts",    label: "Workout",      emoji: "💪" },
  { key: "supplements", label: "Supps",        emoji: "💊" },
  { key: "accessories", label: "Gear",         emoji: "⚙️" },
  { key: "wellness",    label: "Wellness",     emoji: "🧘" },
  { key: "affiliates",  label: "Import Links", emoji: "📋" },
];

function CategoryPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (cat: CatalogTab) => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="mb-4 p-3 rounded-xl space-y-2"
      style={{ background: "rgba(36,63,22,0.04)", border: "1px solid rgba(36,63,22,0.10)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          What are you adding?
        </p>
        <button onClick={onCancel} style={{ color: "var(--text-muted)" }}>
          <HiX className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_PICKER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
            style={{ background: "rgba(36,63,22,0.08)", color: "#528531" }}
          >
            <span>{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [addingCategory, setAddingCategory] = useState<CatalogTab | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<AnyItem | null>(null);
  const [editingItem, setEditingItem] = useState<AnyItem | null>(null);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedItem || editingItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedItem, editingItem]);

  // Ref to track if we should auto-open the upload form on first load (from ?upload=true)
  const uploadOnMount = useRef(searchParams.get("upload") === "true");

  const [allItems, setAllItems] = useState<AnyItemWithType[]>([]);
  const [loading, setLoading] = useState(true);

  const endpointMap: Record<CatalogTab, string> = {
    meals: "/api/catalog/meals",
    workouts: "/api/catalog/workouts",
    supplements: "/api/catalog/supplements",
    accessories: "/api/catalog/accessories",
    wellness: "/api/catalog/wellness",
    affiliates: "/api/catalog/affiliates",
  };

  const fetchAllItems = () => {
    setLoading(true);
    const catalogTabs: CatalogTab[] = ["affiliates", "meals", "workouts", "supplements", "accessories", "wellness"];
    Promise.all(
      catalogTabs.map((t) =>
        fetch(endpointMap[t])
          .then((r) => r.json())
          .then((data) => {
            const items: AnyItem[] = Array.isArray(data) ? data : [];
            return items.map((item) => ({ ...item, _catalogType: t } as AnyItemWithType));
          })
          .catch(() => [] as AnyItemWithType[])
      )
    ).then((results) => {
      const merged = results
        .flat()
        .sort((a, b) => {
          const aTime = "createdAt" in a && a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
          const bTime = "createdAt" in b && b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
          return bTime - aTime;
        });
      setAllItems(merged);
      setLoading(false);

      // Auto-open the upload form when navigating with ?upload=true
      if (uploadOnMount.current) {
        setAddingCategory("affiliates");
        uploadOnMount.current = false;
      }
    });
  };

  useEffect(() => {
    fetchAllItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string, itemCatalogType?: CatalogTab) => {
    const effectiveTab = itemCatalogType ?? "meals";
    const res = await fetch(`${endpointMap[effectiveTab]}?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAllItems((p) => p.filter((m) => m.id !== id));
    }
    setSelectedItem(null);
  };

  const handleSaveEdited = (updated: AnyItem, itemCatalogType?: CatalogTab) => {
    const effectiveTab = itemCatalogType ?? "meals";
    const updatedWithType = { ...updated, _catalogType: effectiveTab } as AnyItemWithType;
    setAllItems((p) => p.map((item) => (item.id === updated.id ? updatedWithType : item)));
    setSelectedItem(updatedWithType);
  };

  const getItemCatalogType = (item: AnyItem): CatalogTab | null => {
    if ("_catalogType" in item) return (item as AnyItemWithType)._catalogType;
    return null;
  };

  const items = allItems as AnyItem[];
  const muted = "var(--text-muted)";

  const getItemPhotoUrl = (item: AnyItem): string | null => {
    if ("photoUrl" in item && (item as { photoUrl: string | null }).photoUrl) return (item as { photoUrl: string | null }).photoUrl;
    if ("logoUrl" in item) return (item as { logoUrl: string | null }).logoUrl;
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

  const getDisplayTags = (item: AnyItem): string[] => {
    const effectiveTab = getItemCatalogType(item) ?? "meals";
    return getCatalogDisplayTags({
      tags: item.tags,
      subcategoryTags: effectiveTab === "affiliates" && "subcategoryTags" in item ? item.subcategoryTags as string[] : null,
      brand: effectiveTab === "supplements" || effectiveTab === "affiliates" ? ("brand" in item ? item.brand : null) : null,
      type: effectiveTab === "accessories" && "type" in item ? item.type : null,
      activityType: effectiveTab === "wellness" && "activityType" in item ? item.activityType : null,
      categoryLabel:
        effectiveTab === "affiliates" && "category" in item && item.category !== "OTHER"
          ? AFFILIATE_CATEGORY_LABELS[item.category as string]
          : null,
    });
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
          {/* Add button — always shows picker */}
          <button
            onClick={() => {
              if (addingCategory !== null || showPicker) {
                setAddingCategory(null);
                setShowPicker(false);
              } else {
                setShowPicker(true);
              }
            }}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "#528531" }}
          >
            {addingCategory !== null || showPicker ? (
              <HiX className="w-4 h-4" />
            ) : (
              <HiPlus className="w-4 h-4" />
            )}
            {addingCategory !== null || showPicker ? "Cancel" : "Add"}
          </button>
        </div>
      </div>

      {/* Category picker */}
      {showPicker && (
        <CategoryPicker
          onSelect={(cat) => {
            setAddingCategory(cat);
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {/* Add form — driven by addingCategory, independent of current tab */}
      {addingCategory !== null && (
        <div className="mb-4">
          {addingCategory === "meals" && (
            <AddMealForm
              onAdd={(m) => {
                setAllItems((p) => [{ ...m, _catalogType: "meals" as CatalogTab }, ...p]);
                setAddingCategory(null);
              }}
            />
          )}
          {addingCategory === "workouts" && (
            <AddWorkoutForm
              onAdd={(w) => {
                setAllItems((p) => [{ ...w, _catalogType: "workouts" as CatalogTab }, ...p]);
                setAddingCategory(null);
              }}
            />
          )}
          {addingCategory === "supplements" && (
            <AddSupplementForm
              onAdd={(s) => {
                setAllItems((p) => [{ ...s, _catalogType: "supplements" as CatalogTab }, ...p]);
                setAddingCategory(null);
              }}
            />
          )}
          {addingCategory === "accessories" && (
            <AddAccessoryForm
              onAdd={(a) => {
                setAllItems((p) => [{ ...a, _catalogType: "accessories" as CatalogTab }, ...p]);
                setAddingCategory(null);
              }}
            />
          )}
          {addingCategory === "wellness" && (
            <AddWellnessForm
              onAdd={(w) => {
                setAllItems((p) => [{ ...w, _catalogType: "wellness" as CatalogTab }, ...p]);
                setAddingCategory(null);
              }}
            />
          )}
          {addingCategory === "affiliates" && (
            <AddAffiliateForm
              onAdd={(a) => {
                setAllItems((p) => [{ ...a, _catalogType: "affiliates" as CatalogTab }, ...p]);
              }}
              onBulkSaveComplete={async () => {
                fetchAllItems();
                setAddingCategory(null);
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
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-stone-600/80 to-stone-800/80 flex items-center justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/95">
              Catalog
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: muted }}>Your catalog is empty</p>
          <p className="text-xs mt-1 mb-3" style={{ color: muted }}>Tap Add above to get started</p>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-3 gap-0.5">
          {items.map((item) => {
            const itemCatalogType = getItemCatalogType(item) ?? "meals";
            const tileGradient = getItemGradient(item, itemCatalogType);
            const tileShortLabel = getItemDisplayLabel(item, itemCatalogType);
            return (
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
                    className={`w-full h-full bg-gradient-to-br ${tileGradient} flex items-center justify-center`}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90 px-1 text-center">
                      {tileShortLabel}
                    </span>
                  </div>
                )}

                {/* Bottom gradient overlay with name */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                  <p className="text-[10px] font-medium text-white truncate leading-tight">{item.name}</p>
                </div>

                {/* Category badge — always visible */}
                <div className="absolute top-1.5 left-1.5">
                  <span
                    className="text-[9px] leading-none px-1.5 py-1 rounded-full"
                    style={{ background: "rgba(24,25,15,0.72)", color: "#FDFAF5" }}
                  >
                    {tileShortLabel}
                  </span>
                </div>

                {/* Link/referral badge */}
                {(getItemLink(item) || getItemReferralCode(item)) && (
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-full" style={{ background: "rgba(36,63,22,0.85)" }}>
                    <HiLink className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* Edit indicator — pencil badge so users know tapping opens edit/delete */}
                <div className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-black/50">
                  <HiPencil className="w-2.5 h-2.5 text-white" />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-2">
          {items.map((item) => {
            const displayTags = getDisplayTags(item);
            const listCatalogType = getItemCatalogType(item) ?? "meals";
            const listLabel = getItemDisplayLabel(item, listCatalogType);
            const listGradient = getItemGradient(item, listCatalogType);
            return (
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
                    className={`w-14 h-14 rounded-lg bg-gradient-to-br ${listGradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/90 text-center px-1">
                      {listLabel}
                    </span>
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
                    <SubcategoryChips tags={displayTags} limit={2} />
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
                        Open Link
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (() => {
        const itemType = getItemCatalogType(selectedItem) ?? "meals";
        return (
          <ItemDetailModal
            item={selectedItem}
            tab={itemType}
            onClose={() => setSelectedItem(null)}
            onEdit={() => setEditingItem(selectedItem)}
            onDelete={() => handleDelete(selectedItem.id, itemType)}
          />
        );
      })()}

      {editingItem && (() => {
        const itemType = getItemCatalogType(editingItem) ?? "meals";
        return (
          <EditItemModal
            item={editingItem}
            tab={itemType}
            onClose={() => setEditingItem(null)}
            onSave={(updated) => handleSaveEdited(updated, itemType)}
          />
        );
      })()}
    </div>
  );
}
