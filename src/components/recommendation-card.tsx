"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Recommendation {
  type: "workout" | "meal" | "wellness" | "general";
  title: string;
  message: string;
  priority: number;
}

const TYPE_CONFIG = {
  workout: {
    emoji: "💪",
    color: "var(--brand)",
    bg: "rgba(36,63,22,0.06)",
    border: "rgba(36,63,22,0.14)",
    createType: "WORKOUT",
  },
  meal: {
    emoji: "🥗",
    color: "var(--gold)",
    bg: "rgba(154,123,46,0.08)",
    border: "rgba(154,123,46,0.18)",
    createType: "MEAL",
  },
  wellness: {
    emoji: "🧘",
    color: "var(--brand-light)",
    bg: "rgba(82,133,49,0.08)",
    border: "rgba(82,133,49,0.18)",
    createType: "WELLNESS",
  },
  general: {
    emoji: "⭐",
    color: "var(--gold-light)",
    bg: "rgba(154,123,46,0.06)",
    border: "rgba(154,123,46,0.12)",
    createType: null,
  },
};

const DISMISS_KEY = "rf_rec_dismissed";

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function isDismissedToday(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(DISMISS_KEY) === getTodayKey();
  } catch {
    return false;
  }
}

export default function RecommendationCard() {
  const router = useRouter();
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [dismissed, setDismissed] = useState(isDismissedToday);
  const [loading, setLoading] = useState(() => !isDismissedToday());

  useEffect(() => {
    if (dismissed) return;

    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((data) => {
        const recs: Recommendation[] = data.recommendations ?? [];
        if (recs.length > 0) setRec(recs[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dismissed]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, getTodayKey());
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const handleAction = () => {
    if (!rec) return;
    const config = TYPE_CONFIG[rec.type];
    if (config.createType) {
      router.push(`/create?type=${config.createType}`);
    } else {
      handleDismiss();
    }
  };

  if (loading || dismissed || !rec) return null;

  const config = TYPE_CONFIG[rec.type];

  return (
    <div
      className="mb-4 rounded-2xl p-4 flex gap-3 items-start"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg"
        style={{ background: "rgba(36,63,22,0.06)" }}
      >
        {config.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold leading-tight mb-0.5"
          style={{ color: config.color }}
        >
          {rec.title}
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {rec.message}
        </p>
        {config.createType && (
          <button
            onClick={handleAction}
            className="mt-2 text-xs font-semibold"
            style={{ color: config.color }}
          >
            Log now &rarr;
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-sm leading-none mt-0.5"
        style={{ color: "var(--text-muted)" }}
        aria-label="Dismiss recommendation"
      >
        ✕
      </button>
    </div>
  );
}
