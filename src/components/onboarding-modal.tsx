"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "rf_welcome_seen";

const steps = [
  {
    emoji: "👑",
    title: "Welcome to Royal",
    subtitle: "Your fitness journey starts here.",
    body: "Log workouts, meals, and wellness activities. Build streaks, earn badges, and connect with people who share your goals.",
    cta: null,
  },
  {
    emoji: "💪",
    title: "Log your first activity",
    subtitle: "Every rep, meal, and recovery counts.",
    body: "Tap the + button to log a workout, a meal, a wellness activity, or anything on your mind.",
    cta: { label: "Create my first post →", href: "/create" },
  },
  {
    emoji: "🤝",
    title: "Find your community",
    subtitle: "Training is better together.",
    body: "Search for friends, fellow gym-goers, or anyone crushing their goals. Follow them and cheer each other on.",
    cta: { label: "Find people to follow →", href: "/explore" },
  },
];

interface Props {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0);

  function dismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    onClose();
  }

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 pb-8"
        style={{
          background: "linear-gradient(160deg, #12131f 0%, #0d0e1a 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          aria-label="Skip onboarding"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center mt-2">
          <div className="text-5xl mb-4">{current.emoji}</div>
          <h2 className="text-xl font-bold text-white mb-1">{current.title}</h2>
          <p className="text-sm font-semibold mb-3" style={{ color: "#a8a6ff" }}>
            {current.subtitle}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            {current.body}
          </p>
        </div>

        {/* CTA button */}
        {current.cta && (
          <Link
            href={current.cta.href}
            onClick={dismiss}
            className="mt-6 block w-full text-center py-3 rounded-xl text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #6360e8, #9b98ff)",
              boxShadow: "0 4px 20px rgba(120,117,255,0.3)",
            }}
          >
            {current.cta.label}
          </Link>
        )}

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background: i === step ? "#a8a6ff" : "rgba(255,255,255,0.2)",
                }}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Next / Finish */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={dismiss}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6360e8, #9b98ff)" }}
              >
                Get started
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6360e8, #9b98ff)" }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function shouldShowOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}
