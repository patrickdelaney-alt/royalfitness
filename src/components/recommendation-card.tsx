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
    color: "#8b88f8",
    bg: "rgba(109,106,245,0.12)",
    border: "rgba(139,136,248,0.2)",
    createType: "WORKOUT",
  },
  meal: {
    emoji: "🥗",
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.2)",
    createType: "MEAL",
  },
  wellness: {
    emoji: "🧘",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.2)",
    createType: "WELLNESS",
  },
  general: {
    emoji: "⭐",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.15)",
    createType: null,
  },
};

const DISMISS_KEY = "rf_rec_dismissed";

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export default function RecommendationCard() {
  const router = useRouter();
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if dismissed today
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      if (stored === getTodayKey()) {
        setDismissed(true);
        setLoading(false);
        return;
      }
    } catch {
      // localStorage may not be available
    }

    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((data) => {
        const recs: Recommendation[] = data.recommendations ?? [];
        if (recs.length > 0) setRec(recs[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        style={{ background: "rgba(255,255,255,0.06)" }}
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
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {rec.message}
        </p>
        {config.createType && (
          <button
            onClick={handleAction}
            className="mt-2 text-xs font-semibold"
            style={{ color: config.color }}
          >
            Log now →
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-sm leading-none mt-0.5"
        style={{ color: "rgba(255,255,255,0.25)" }}
        aria-label="Dismiss recommendation"
      >
        ✕
      </button>
    </div>
  );
}
