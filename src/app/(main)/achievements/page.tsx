"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_META } from "@/lib/achievements";

type Category = "workout" | "meal" | "wellness" | "streak" | "social" | "explorer";

interface AchievementResult {
  key: string;
  name: string;
  emoji: string;
  description: string;
  category: Category;
  gradient: string;
  earned: boolean;
  earnedAt: string | null;
  progress: number; // 0–1
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(13,31,140,0.12)"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(42,184,208,0.65)"
        strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementResult }) {
  const earned = achievement.earned;

  return (
    <div
      className="relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
      style={{
        background: earned
          ? achievement.gradient
          : "rgba(13,31,140,0.04)",
        border: earned
          ? "none"
          : "1px solid rgba(13,31,140,0.10)",
        opacity: earned ? 1 : 0.7,
      }}
    >
      {/* Emoji / progress ring */}
      <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
        {!earned && achievement.progress > 0 && (
          <div className="absolute inset-0">
            <ProgressRing progress={achievement.progress} size={56} />
          </div>
        )}
        <span
          className="text-3xl"
          style={{
            filter: earned
              ? "none"
              : "grayscale(1) brightness(0.6)",
          }}
        >
          {achievement.emoji}
        </span>
        {!earned && (
          <span
            className="absolute bottom-0 right-0 text-xs font-bold rounded-full flex items-center justify-center"
            style={{
              width: 18,
              height: 18,
              background: "rgba(24,25,15,0.15)",
              color: "var(--text-muted)",
              fontSize: 10,
            }}
          >
            🔒
          </span>
        )}
      </div>

      {/* Name */}
      <p
        className="text-xs font-bold text-center leading-tight"
        style={{
          color: earned ? "#fff" : "var(--text-muted)",
          letterSpacing: "0.02em",
        }}
      >
        {achievement.name}
      </p>

      {/* Description / date earned */}
      <p
        className="text-center leading-tight"
        style={{
          fontSize: 10,
          color: earned ? "var(--text)" : "var(--text-muted)",
        }}
      >
        {earned && achievement.earnedAt
          ? `Earned ${formatDate(achievement.earnedAt)}`
          : achievement.description}
      </p>

      {/* Progress bar for locked, partial progress */}
      {!earned && achievement.progress > 0 && (
        <div
          className="w-full h-1 rounded-full overflow-hidden mt-1"
          style={{ background: "rgba(13,31,140,0.10)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${achievement.progress * 100}%`,
              background: "#0D1F8C",
            }}
          />
        </div>
      )}
    </div>
  );
}

const CATEGORY_ORDER: Category[] = [
  "workout",
  "meal",
  "wellness",
  "streak",
  "social",
  "explorer",
];

export default function AchievementsPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<AchievementResult[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((data) => {
        setAchievements(data.achievements ?? []);
        setEarnedCount(data.earnedCount ?? 0);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed =
    activeCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === activeCategory);

  const grouped = CATEGORY_ORDER.reduce<Record<Category, AchievementResult[]>>(
    (acc, cat) => {
      acc[cat] = displayed.filter((a) => a.category === cat);
      return acc;
    },
    {} as Record<Category, AchievementResult[]>
  );

  return (
    <div
      className="max-w-lg mx-auto px-4 pt-4 pb-10"
      style={{ color: "var(--text)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold flex-1">Badges</h1>
        {!loading && (
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: "var(--brand)",
              color: "#fff",
            }}
          >
            {earnedCount} / {total}
          </span>
        )}
      </div>

      {/* Progress bar overall */}
      {!loading && total > 0 && (
        <div className="mb-6">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(36,63,22,0.10)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(earnedCount / total) * 100}%`,
                background: "var(--brand)",
              }}
            />
          </div>
          <p
            className="text-xs mt-1.5 text-right"
            style={{ color: "var(--text-muted)" }}
          >
            {total - earnedCount} badges left to unlock
          </p>
        </div>
      )}

      {/* Category filter tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-3 mb-5"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          onClick={() => setActiveCategory("all")}
          className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
          style={
            activeCategory === "all"
              ? {
                  background:
                    "var(--brand)",
                  color: "#fff",
                }
              : {
                  background: "rgba(36,63,22,0.04)",
                  color: "var(--text-muted)",
                  border: "1px solid rgba(36,63,22,0.10)",
                }
          }
        >
          🏅 All
        </button>
        {CATEGORY_ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const catEarned = achievements.filter(
            (a) => a.category === cat && a.earned
          ).length;
          const catTotal = achievements.filter((a) => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
              style={
                activeCategory === cat
                  ? {
                      background:
                        "var(--brand)",
                      color: "#fff",
                    }
                  : {
                      background: "rgba(36,63,22,0.04)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(36,63,22,0.10)",
                    }
              }
            >
              {meta.emoji} {meta.label}{" "}
              <span style={{ opacity: 0.6 }}>
                {catEarned}/{catTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-32 animate-pulse"
              style={{ background: "rgba(36,63,22,0.04)" }}
            />
          ))}
        </div>
      ) : activeCategory === "all" ? (
        // Grouped view
        <div className="space-y-8">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            const meta = CATEGORY_META[cat];
            const catEarned = items.filter((a) => a.earned).length;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <h2
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {meta.emoji} {meta.label}
                  </h2>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {catEarned}/{items.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {items.map((a) => (
                    <AchievementCard key={a.key} achievement={a} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Filtered single-category view
        <div className="grid grid-cols-3 gap-3">
          {displayed.map((a) => (
            <AchievementCard key={a.key} achievement={a} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <p
          className="text-center py-16 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          No badges in this category yet
        </p>
      )}
    </div>
  );
}
