/**
 * Recommendation Engine (MVP: rules-based)
 *
 * Interface designed for future replacement with ML-based engine.
 * Current implementation uses simple heuristics based on recent activity.
 */

export interface Recommendation {
  type: "workout" | "meal" | "wellness" | "general";
  title: string;
  message: string;
  priority: number; // 1-10, higher = more important
}

export interface UserActivitySummary {
  workoutsThisWeek: number;
  mealsLoggedThisWeek: number;
  wellnessMinutesThisWeek: number;
  avgProteinThisWeek: number | null;
  proteinTarget: number; // default 150g
  lastWorkoutMuscleGroups: string[]; // muscle groups from most recent workout
  daysSinceLastPost: number;
  daysSinceLastWorkout: number;
  daysSinceLastWellness: number;
  uniqueMuscleGroupsThisWeek: string[];
  totalMuscleGroups: number; // all-time unique muscle groups trained
  currentStreak: number;
}

export interface RecommendationEngine {
  getRecommendations(activity: UserActivitySummary): Recommendation[];
}

const ALL_MUSCLE_GROUPS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "glutes",
  "cardio",
];

export class RulesBasedRecommendationEngine implements RecommendationEngine {
  getRecommendations(activity: UserActivitySummary): Recommendation[] {
    const recs: Recommendation[] = [];

    // ── Streak / consistency ──────────────────────────────────────────────
    if (activity.daysSinceLastPost >= 2) {
      recs.push({
        type: "general",
        title: "Keep your streak alive!",
        message: `You haven't posted in ${activity.daysSinceLastPost} days. Log a quick activity to keep the momentum going.`,
        priority: 8,
      });
    }

    if (activity.currentStreak >= 7) {
      recs.push({
        type: "general",
        title: `${activity.currentStreak}-day streak! 🔥`,
        message: "You're on fire. Keep it up — one more day and you're closer to the Week Warrior badge.",
        priority: 3,
      });
    }

    // ── Workout frequency ─────────────────────────────────────────────────
    if (activity.workoutsThisWeek === 0) {
      recs.push({
        type: "workout",
        title: "Time to move!",
        message:
          "You haven't logged a workout this week. Even a quick 20-minute session counts!",
        priority: 7,
      });
    } else if (activity.workoutsThisWeek >= 5) {
      recs.push({
        type: "wellness",
        title: "Recovery day?",
        message:
          "You've been crushing it with 5+ workouts this week. Consider adding a recovery session — stretching, sauna, or meditation.",
        priority: 6,
      });
    }

    // ── Muscle group variety ──────────────────────────────────────────────
    if (activity.workoutsThisWeek > 0 && activity.uniqueMuscleGroupsThisWeek.length === 1) {
      const trained = activity.uniqueMuscleGroupsThisWeek[0];
      const untrained = ALL_MUSCLE_GROUPS.filter(
        (mg) => !activity.uniqueMuscleGroupsThisWeek.includes(mg)
      );
      const suggestion = untrained[Math.floor(Math.random() * Math.min(untrained.length, 3))];
      recs.push({
        type: "workout",
        title: "Mix it up",
        message: `You've only hit ${trained} this week. Try training ${suggestion ?? "a new muscle group"} to build balance and unlock the Full Body Boss badge.`,
        priority: 5,
      });
    }

    // ── Post-legs mobility suggestion ─────────────────────────────────────
    if (
      activity.lastWorkoutMuscleGroups.some((mg) =>
        ["legs", "glutes"].includes(mg.toLowerCase())
      )
    ) {
      recs.push({
        type: "wellness",
        title: "Legs day recovery",
        message:
          "You hit legs or glutes recently — log a mobility or stretching session to aid recovery and reduce soreness.",
        priority: 5,
      });
    }

    // ── Protein target ────────────────────────────────────────────────────
    if (
      activity.avgProteinThisWeek !== null &&
      activity.avgProteinThisWeek < activity.proteinTarget * 0.8
    ) {
      recs.push({
        type: "meal",
        title: "Protein check",
        message: `Your average protein this week (${Math.round(activity.avgProteinThisWeek)}g) is below your ${activity.proteinTarget}g target. Add a high-protein meal!`,
        priority: 7,
      });
    }

    // ── Meal logging ──────────────────────────────────────────────────────
    if (activity.mealsLoggedThisWeek < 3) {
      recs.push({
        type: "meal",
        title: "Log your meals",
        message:
          "Tracking meals helps you hit your nutrition goals. Aim for at least one log a day!",
        priority: 4,
      });
    }

    // ── Wellness ──────────────────────────────────────────────────────────
    if (activity.wellnessMinutesThisWeek === 0) {
      recs.push({
        type: "wellness",
        title: "Wellness matters",
        message:
          "No wellness activities logged this week. Try breathwork, meditation, yoga, or a cold plunge!",
        priority: 5,
      });
    }

    // ── Rest day ──────────────────────────────────────────────────────────
    if (activity.daysSinceLastWorkout === 0 && activity.workoutsThisWeek >= 3) {
      recs.push({
        type: "general",
        title: "Rest is productive",
        message:
          "Great workout today! Muscles grow during recovery — consider a rest or active recovery day tomorrow.",
        priority: 3,
      });
    }

    // ── Explorer nudge ────────────────────────────────────────────────────
    if (activity.totalMuscleGroups > 0 && activity.totalMuscleGroups < 6) {
      const remaining = 6 - activity.totalMuscleGroups;
      recs.push({
        type: "workout",
        title: "Unlock Full Body Boss",
        message: `Train ${remaining} more muscle group${remaining > 1 ? "s" : ""} across your workouts to earn the Full Body Boss badge.`,
        priority: 2,
      });
    }

    return recs.sort((a, b) => b.priority - a.priority);
  }
}

// Singleton for the app to use — swap implementation here for Phase 2
export const recommendationEngine: RecommendationEngine =
  new RulesBasedRecommendationEngine();
