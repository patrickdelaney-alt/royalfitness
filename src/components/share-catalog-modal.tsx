"use client";

import { useState, useEffect, useCallback } from "react";
import { HiX, HiShare, HiCalendar, HiExclamation, HiPhotograph } from "react-icons/hi";
import toast from "react-hot-toast";
import { fixedCtaBottomOffset } from "@/components/layout/bottom-inset";
import { BottomCtaBar, BottomCtaRow } from "@/components/layout/bottom-cta";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CatalogItemType =
  | "MEAL"
  | "WORKOUT"
  | "SUPPLEMENT"
  | "ACCESSORY"
  | "WELLNESS"
  | "AFFILIATE";

export interface ShareCatalogItem {
  id: string;
  catalogType: CatalogItemType;
  name: string;
  photoUrl?: string | null;
  brand?: string | null;
}

interface ShareCatalogModalProps {
  item: ShareCatalogItem;
  onClose: () => void;
  /** Called after a successful share so the parent can react (e.g. update UI) */
  onSuccess?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function LoadingSpinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-4 h-4 border-2" : "w-5 h-5 border-2";
  return (
    <div
      className={`${dim} border-t-transparent rounded-full animate-spin flex-shrink-0`}
      style={{ borderColor: "rgba(253,250,245,0.5)", borderTopColor: "transparent" }}
    />
  );
}

const CATALOG_TYPE_LABELS: Record<CatalogItemType, string> = {
  MEAL: "Meal",
  WORKOUT: "Workout",
  SUPPLEMENT: "Supplement",
  ACCESSORY: "Accessory",
  WELLNESS: "Wellness",
  AFFILIATE: "Product",
};

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC",    label: "Public",    desc: "Everyone" },
  { value: "FOLLOWERS", label: "Followers", desc: "Followers only" },
  { value: "PRIVATE",   label: "Private",   desc: "Only you" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShareCatalogModal({
  item,
  onClose,
  onSuccess,
}: ShareCatalogModalProps) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);
  const [alreadySharedToday, setAlreadySharedToday] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_CAPTION = 2000;
  const captionRemaining = MAX_CAPTION - caption.length;

  // ── Check cooldown on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setCheckLoading(true);

    fetch(
      `/api/catalog/share-check?itemId=${encodeURIComponent(item.id)}&itemType=${encodeURIComponent(item.catalogType)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setAlreadySharedToday(!!data.alreadySharedToday);
          setCheckLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCheckLoading(false);
      });

    return () => { cancelled = true; };
  }, [item.id, item.catalogType]);

  // ── Dismiss on backdrop click ───────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !loading) onClose();
    },
    [loading, onClose]
  );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (loading || alreadySharedToday) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CATALOG_SHARE",
          caption: caption.trim() || undefined,
          visibility,
          catalogShare: {
            catalogItemId: item.id,
            catalogItemType: item.catalogType,
          },
        }),
      });

      if (res.status === 409) {
        setAlreadySharedToday(true);
        setError("You've already shared this item today. Come back tomorrow.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success("Shared to your feed!", {
        style: {
          background: "var(--surface)",
          color: "var(--text)",
          border: "1px solid var(--border)",
        },
      });
      onSuccess?.();
      onClose();
    } catch {
      setError("Failed to share. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, alreadySharedToday, caption, visibility, item, onSuccess, onClose]);

  // ── Keyboard shortcut ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, onClose]);

  const showForm = !checkLoading && !alreadySharedToday;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-[var(--fixed-cta-bottom-offset)] sm:items-center sm:pb-0"
      style={{
        ["--fixed-cta-bottom-offset" as string]: fixedCtaBottomOffset,
        background: "rgba(24,25,15,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleBackdropClick}
    >
      {/* Sheet wrapper — flex column so footer stays pinned */}
      <div
        className="relative w-full max-w-sm flex flex-col"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Outer bezel */}
        <div
          className="rounded-t-[32px] sm:rounded-[32px] p-[2px] flex flex-col overflow-hidden"
          style={{
            background: "rgba(154,123,46,0.18)",
            boxShadow: "0 24px 80px rgba(24,25,15,0.32), 0 1px 0 rgba(255,255,255,0.06) inset",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Inner card */}
          <div
            className="rounded-t-[30px] sm:rounded-[30px] flex flex-col overflow-hidden"
            style={{
              background: "#FDFAF5",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* ── Drag handle ── */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div
                className="w-9 h-1 rounded-full"
                style={{ background: "rgba(36,63,22,0.15)" }}
              />
            </div>

            {/* ── Scrollable content ── */}
            <div className="overflow-y-auto flex-1 min-h-0 px-6 pt-4 pb-4 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className="font-bold text-lg leading-tight"
                    style={{ color: "#18190F", fontFamily: "var(--font-display)", fontStyle: "italic" }}
                  >
                    Share to Feed
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "#7A7560" }}>
                    {CATALOG_TYPE_LABELS[item.catalogType]} · {item.name}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="p-2 rounded-full transition-colors disabled:opacity-50"
                  style={{ background: "rgba(36,63,22,0.06)", color: "#7A7560" }}
                  aria-label="Close"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>

              {/* ── Item preview card ── */}
              <div
                className="rounded-2xl overflow-hidden flex gap-3 p-3"
                style={{
                  background: "rgba(154,123,46,0.06)",
                  border: "1px solid rgba(154,123,46,0.20)",
                }}
              >
                {/* Thumbnail */}
                <div
                  className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: "rgba(154,123,46,0.12)" }}
                >
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HiPhotograph className="w-6 h-6" style={{ color: "#9A7B2E" }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  {item.brand && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9A7B2E" }}>
                      {item.brand}
                    </p>
                  )}
                  <p className="font-semibold text-sm leading-snug truncate" style={{ color: "#18190F" }}>
                    {item.name}
                  </p>
                  <span
                    className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(154,123,46,0.14)", color: "#9A7B2E" }}
                  >
                    {CATALOG_TYPE_LABELS[item.catalogType]}
                  </span>
                </div>
              </div>

              {/* ── Already-shared-today state ── */}
              {!checkLoading && alreadySharedToday && (
                <div
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{
                    background: "rgba(154,123,46,0.08)",
                    border: "1px solid rgba(154,123,46,0.22)",
                  }}
                >
                  <HiCalendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#9A7B2E" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#9A7B2E" }}>
                      Already shared today
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#7A7560" }}>
                      You can share this item again tomorrow. Check back in!
                    </p>
                  </div>
                </div>
              )}

              {/* ── Loading state (cooldown check) ── */}
              {checkLoading && (
                <div className="flex items-center justify-center py-4">
                  <div
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: "rgba(154,123,46,0.3)", borderTopColor: "#9A7B2E" }}
                  />
                </div>
              )}

              {/* ── Form fields (caption + visibility) ── */}
              {showForm && (
                <>
                  {/* Caption */}
                  <div className="space-y-1.5">
                    <label
                      className="block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#7A7560" }}
                    >
                      Caption <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{
                        background: "rgba(36,63,22,0.04)",
                        border: "1px solid rgba(36,63,22,0.12)",
                      }}
                    >
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
                        placeholder="What do you love about this? Add a note for your followers…"
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-transparent resize-none focus:outline-none"
                        style={{ color: "#18190F" }}
                      />
                      <div className="flex justify-end px-3 pb-2">
                        <span
                          className="text-[11px]"
                          style={{ color: captionRemaining < 100 ? "#f87171" : "#7A7560" }}
                        >
                          {captionRemaining}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-2">
                    <label
                      className="block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#7A7560" }}
                    >
                      Visibility
                    </label>
                    <BottomCtaRow>
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setVisibility(opt.value)}
                          className="min-w-[96px] flex-1 px-2 py-2.5 rounded-xl text-xs font-semibold leading-tight text-center transition-all duration-200"
                          style={
                            visibility === opt.value
                              ? { background: "#243F16", color: "#FDFAF5", boxShadow: "0 2px 8px rgba(36,63,22,0.28)" }
                              : { background: "rgba(36,63,22,0.06)", color: "#7A7560" }
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </BottomCtaRow>
                  </div>
                </>
              )}
            </div>

            {/* ── Sticky footer — always above the keyboard ── */}
            {showForm && (
              <BottomCtaBar className="px-6 space-y-3" style={{ background: "#FDFAF5" }}>
                {/* Inline error */}
                {error && (
                  <div
                    className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}
                  >
                    <HiExclamation className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed" style={{ color: "#dc2626" }}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleShare}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                  style={{
                    background: "linear-gradient(135deg, #243F16 0%, #3A6122 100%)",
                    color: "#FDFAF5",
                    boxShadow: loading ? "none" : "0 4px 16px rgba(36,63,22,0.30)",
                  }}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      <span>Sharing…</span>
                    </>
                  ) : (
                    <>
                      <HiShare className="w-4 h-4" />
                      <span>Share to Feed</span>
                    </>
                  )}
                </button>
              </BottomCtaBar>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
