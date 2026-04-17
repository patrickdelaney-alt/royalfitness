-- Migration: add_onboarding_step
-- Adds onboardingStep column to User for tracking onboarding progress.
-- Nullable string so existing users default to NULL (no onboarding required).

ALTER TABLE "User" ADD COLUMN "onboardingStep" TEXT;
