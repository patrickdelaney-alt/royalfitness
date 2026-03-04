-- Add isPrivate column to all catalog tables
-- These were added to the Prisma schema but never migrated to the database

ALTER TABLE "SavedMeal" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SavedWorkout" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Supplement" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WellnessAccessory" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SavedWellness" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
