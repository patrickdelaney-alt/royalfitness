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
  lastWorkoutType: string | null; // e.g., "legs", "push"
  daysSinceLastPost: number;
  daysSinceLastWorkout: number;
  daysSinceLastWellness: number;
}

export interface RecommendationEngine {
  getRecommendations(activity: UserActivitySummary): Recommendation[];
}

export class RulesBasedRecommendationEngine implements RecommendationEngine {
  getRecommendations(activity: UserActivitySummary): Recommendation[] {
    const recs: Recommendation[] = [];

    // Streak maintenance
    if (activity.daysSinceLastPost >= 2) {
      recs.push({
        type: "general",
        title: "Keep your streak!",
        message: `You haven't posted in ${activity.daysSinceLastPost} days. Log a quick activity to keep your streak alive!`,
        priority: 8,
      });
    }

    // Workout frequency
    if (activity.workoutsThisWeek === 0) {
      recs.push({
        type: "workout",
        title: "Time to move!",
        message:
          "You haven't logged a workout this week. Even a quick session counts!",
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

    // Legs/mobility suggestion
    if (
      activity.lastWorkoutType &&
      ["legs", "leg day", "lower body", "squats"].includes(
        activity.lastWorkoutType.toLowerCase()
      )
    ) {
      recs.push({
        type: "wellness",
        title: "Mobility time",
        message:
          "You logged legs recently — add a mobility or stretching session to aid recovery.",
        priority: 5,
      });
    }

    // Protein target
    if (
      activity.avgProteinThisWeek !== null &&
      activity.avgProteinThisWeek < activity.proteinTarget * 0.8
    ) {
      recs.push({
        type: "meal",
        title: "Protein check",
        message: `Your average protein this week (${Math.round(activity.avgProteinThisWeek)}g) is below your target (${activity.proteinTarget}g). Try adding high-protein meals!`,
        priority: 7,
      });
    }

    // Meal logging
    if (activity.mealsLoggedThisWeek < 3) {
      recs.push({
        type: "meal",
        title: "Log your meals",
        message:
          "Tracking meals helps you hit your nutrition goals. Try logging at least one meal a day!",
        priority: 4,
      });
    }

    // Wellness
    if (activity.wellnessMinutesThisWeek === 0) {
      recs.push({
        type: "wellness",
        title: "Wellness matters",
        message:
          "No wellness activities logged this week. Try breathwork, meditation, or a cold plunge!",
        priority: 5,
      });
    }

    // Rest day
    if (activity.daysSinceLastWorkout === 0 && activity.workoutsThisWeek >= 3) {
      recs.push({
        type: "general",
        title: "Rest is productive",
        message:
          "Great workout today! Remember, muscles grow during recovery. Consider a rest day tomorrow.",
        priority: 3,
      });
    }

    return recs.sort((a, b) => b.priority - a.priority);
  }
}

// Singleton for the app to use — swap implementation here for Phase 2
export const recommendationEngine: RecommendationEngine =
  new RulesBasedRecommendationEngine();
