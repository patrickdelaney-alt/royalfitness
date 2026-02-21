-- AlterTable
ALTER TABLE "WorkoutDetail" ADD COLUMN "muscleGroups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
