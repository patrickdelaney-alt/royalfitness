"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const STORAGE_KEY = "rf_welcome_seen";

const steps = [
  {
    emoji: "🌿",
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
  const [showConfirmDismiss, setShowConfirmDismiss] = useState(false);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    onClose();
  }, [onClose]);

  const requestDismiss = useCallback(() => {
    if (step === 0) {
      dismiss();
      return;
    }
    setShowConfirmDismiss(true);
  }, [dismiss, step]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestDismiss();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestDismiss]);

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(24,25,15,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          requestDismiss();
        }
      }}
    >
      <div className="relative w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] card-shell">
        <div className="card-core p-6 pb-8 rounded-t-[28px] sm:rounded-[28px]">
          {/* Close button */}
          <button
            onClick={requestDismiss}
            className="absolute top-6 right-6 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "rgba(36,63,22,0.06)", color: "var(--text-muted)" }}
            aria-label="Close onboarding"
          >
            ✕
          </button>

          {/* Content */}
          <div className="text-center mt-2">
            <div className="text-5xl mb-4">{current.emoji}</div>
            <h2 className="text-xl font-normal mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>{current.title}</h2>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Step {step + 1} of {steps.length}
            </p>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--brand)" }}>
              {current.subtitle}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {current.body}
            </p>
          </div>

          {/* CTA button */}
          {current.cta && (
            <Link
              href={current.cta.href}
              onClick={dismiss}
              className="mt-6 block w-full text-center btn-primary justify-center rounded-full py-3 text-sm font-medium"
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
                  className="rounded-full"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    background: i === step ? "var(--brand)" : "var(--surface-2)",
                    transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
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
                  className="btn-secondary px-4 py-1.5 rounded-full text-xs font-semibold"
                >
                  Back
                </button>
              )}
              {isLast ? (
                <button
                  onClick={dismiss}
                  className="btn-primary px-4 py-1.5 rounded-full text-xs font-medium"
                >
                  Get started
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="btn-primary px-4 py-1.5 rounded-full text-xs font-medium"
                >
                  Next
                </button>
              )}
            </div>
          </div>

          {showConfirmDismiss && (
            <div
              className="absolute inset-0 flex items-end sm:items-center justify-center p-4"
              style={{ background: "rgba(24,25,15,0.2)", backdropFilter: "blur(2px)" }}
            >
              <div className="w-full rounded-t-[32px] sm:rounded-[32px] card-shell">
                <div className="card-core p-4 sm:p-5 rounded-t-[28px] sm:rounded-[28px] text-center">
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
                    Leave onboarding?
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                    You can revisit it later from your profile settings.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setShowConfirmDismiss(false)}
                      className="btn-secondary w-full rounded-full py-2 text-sm font-semibold"
                    >
                      Continue onboarding
                    </button>
                    <button
                      onClick={dismiss}
                      className="btn-primary w-full rounded-full py-2 text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function shouldShowOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}
