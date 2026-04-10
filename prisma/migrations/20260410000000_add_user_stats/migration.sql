-- Migration: add_user_stats
-- Adds UserStats table for caching streak values per user.
-- streakComputedAt = NULL means "cache is dirty, recompute on next stats read".
-- All changes are additive — no existing data is altered or dropped.

CREATE TABLE "UserStats" (
    "userId"           TEXT         NOT NULL,
    "currentStreak"    INTEGER      NOT NULL DEFAULT 0,
    "workoutStreak"    INTEGER      NOT NULL DEFAULT 0,
    "streakComputedAt" TIMESTAMP(3),

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserStats"
    ADD CONSTRAINT "UserStats_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
