/**
 * Achievement System
 *
 * Defines all user-level achievements, their unlock criteria, and
 * the server-side function to check + award newly earned achievements.
 */

import { PrismaClient } from "@prisma/client";

export interface AchievementDef {
  key: string;
  name: string;
  emoji: string;
  description: string;
  category: "workout" | "meal" | "wellness" | "streak" | "social" | "explorer";
  gradient: string;
  /** Returns true if the user has earned this achievement given their stats */
  check(stats: AchievementStats): boolean;
  /** Optional progress toward milestone (0–1), for locked display */
  progress?(stats: AchievementStats): number;
}

export interface AchievementStats {
  workoutCount: number;
  mealCount: number;
  wellnessCount: number;
  totalPosts: number;
  currentStreak: number;
  longestStreak: number;
  followerCount: number;
  followingCount: number;
  likesReceived: number;
  uniqueMuscleGroups: string[];
  hasPostedAllTypes: boolean;
  totalVolumeLbs: number;
  totalSets: number;
  wellnessMinutes: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── WORKOUT MILESTONES ────────────────────────────────────────────────────
  {
    key: "workout_first",
    name: "First Rep",
    emoji: "🏋️",
    description: "Log your first workout",
    category: "workout",
    gradient: "linear-gradient(135deg, #6360e8, #9b98ff)",
    check: (s) => s.workoutCount >= 1,
    progress: (s) => Math.min(s.workoutCount / 1, 1),
  },
  {
    key: "workout_10",
    name: "Iron Will",
    emoji: "💪",
    description: "Log 10 workouts",
    category: "workout",
    gradient: "linear-gradient(135deg, #5b58e8 0%, #7c79f5 100%)",
    check: (s) => s.workoutCount >= 10,
    progress: (s) => Math.min(s.workoutCount / 10, 1),
  },
  {
    key: "workout_25",
    name: "Grind Mode",
    emoji: "🔥",
    description: "Log 25 workouts",
    category: "workout",
    gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    check: (s) => s.workoutCount >= 25,
    progress: (s) => Math.min(s.workoutCount / 25, 1),
  },
  {
    key: "workout_50",
    name: "Half Century",
    emoji: "⚡",
    description: "Log 50 workouts",
    category: "workout",
    gradient: "linear-gradient(135deg, #eab308 0%, #fbbf24 100%)",
    check: (s) => s.workoutCount >= 50,
    progress: (s) => Math.min(s.workoutCount / 50, 1),
  },
  {
    key: "workout_100",
    name: "Centurion",
    emoji: "🏆",
    description: "Log 100 workouts",
    category: "workout",
    gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    check: (s) => s.workoutCount >= 100,
    progress: (s) => Math.min(s.workoutCount / 100, 1),
  },
  {
    key: "workout_250",
    name: "Obsessed",
    emoji: "👑",
    description: "Log 250 workouts",
    category: "workout",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
    check: (s) => s.workoutCount >= 250,
    progress: (s) => Math.min(s.workoutCount / 250, 1),
  },
  {
    key: "workout_500",
    name: "Legend",
    emoji: "🦁",
    description: "Log 500 workouts — you are the gym",
    category: "workout",
    gradient: "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)",
    check: (s) => s.workoutCount >= 500,
    progress: (s) => Math.min(s.workoutCount / 500, 1),
  },
  {
    key: "volume_100k",
    name: "Volume King",
    emoji: "📦",
    description: "Lift 100,000 lbs total",
    category: "workout",
    gradient: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
    check: (s) => s.totalVolumeLbs >= 100000,
    progress: (s) => Math.min(s.totalVolumeLbs / 100000, 1),
  },
  {
    key: "sets_500",
    name: "Set Machine",
    emoji: "🔩",
    description: "Complete 500 sets",
    category: "workout",
    gradient: "linear-gradient(135deg, #374151 0%, #6b7280 100%)",
    check: (s) => s.totalSets >= 500,
    progress: (s) => Math.min(s.totalSets / 500, 1),
  },

  // ── MEAL MILESTONES ───────────────────────────────────────────────────────
  {
    key: "meal_first",
    name: "First Bite",
    emoji: "🍽️",
    description: "Log your first meal",
    category: "meal",
    gradient: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
    check: (s) => s.mealCount >= 1,
    progress: (s) => Math.min(s.mealCount / 1, 1),
  },
  {
    key: "meal_10",
    name: "Macro Tracker",
    emoji: "📊",
    description: "Log 10 meals",
    category: "meal",
    gradient: "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
    check: (s) => s.mealCount >= 10,
    progress: (s) => Math.min(s.mealCount / 10, 1),
  },
  {
    key: "meal_25",
    name: "Meal Prep Pro",
    emoji: "🥗",
    description: "Log 25 meals",
    category: "meal",
    gradient: "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
    check: (s) => s.mealCount >= 25,
    progress: (s) => Math.min(s.mealCount / 25, 1),
  },
  {
    key: "meal_50",
    name: "Nutrition Nerd",
    emoji: "🧪",
    description: "Log 50 meals",
    category: "meal",
    gradient: "linear-gradient(135deg, #0f4c27 0%, #166534 100%)",
    check: (s) => s.mealCount >= 50,
    progress: (s) => Math.min(s.mealCount / 50, 1),
  },
  {
    key: "meal_100",
    name: "Macro Master",
    emoji: "🍳",
    description: "Log 100 meals",
    category: "meal",
    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
    check: (s) => s.mealCount >= 100,
    progress: (s) => Math.min(s.mealCount / 100, 1),
  },

  // ── WELLNESS MILESTONES ───────────────────────────────────────────────────
  {
    key: "wellness_first",
    name: "Zen Beginner",
    emoji: "🧘",
    description: "Log your first wellness activity",
    category: "wellness",
    gradient: "linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)",
    check: (s) => s.wellnessCount >= 1,
    progress: (s) => Math.min(s.wellnessCount / 1, 1),
  },
  {
    key: "wellness_10",
    name: "Inner Peace",
    emoji: "☯️",
    description: "Log 10 wellness activities",
    category: "wellness",
    gradient: "linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)",
    check: (s) => s.wellnessCount >= 10,
    progress: (s) => Math.min(s.wellnessCount / 10, 1),
  },
  {
    key: "wellness_25",
    name: "Recovery Royalty",
    emoji: "💆",
    description: "Log 25 wellness activities",
    category: "wellness",
    gradient: "linear-gradient(135deg, #581c87 0%, #7c3aed 100%)",
    check: (s) => s.wellnessCount >= 25,
    progress: (s) => Math.min(s.wellnessCount / 25, 1),
  },
  {
    key: "wellness_60min",
    name: "Deep Rest",
    emoji: "🌙",
    description: "Log 60+ minutes of wellness in a week",
    category: "wellness",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)",
    check: (s) => s.wellnessMinutes >= 60,
    progress: (s) => Math.min(s.wellnessMinutes / 60, 1),
  },

  // ── STREAK MILESTONES ─────────────────────────────────────────────────────
  {
    key: "streak_3",
    name: "On a Roll",
    emoji: "🔥",
    description: "Maintain a 3-day activity streak",
    category: "streak",
    gradient: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)",
    check: (s) => s.longestStreak >= 3 || s.currentStreak >= 3,
    progress: (s) => Math.min(Math.max(s.longestStreak, s.currentStreak) / 3, 1),
  },
  {
    key: "streak_7",
    name: "Week Warrior",
    emoji: "📅",
    description: "Maintain a 7-day activity streak",
    category: "streak",
    gradient: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
    check: (s) => s.longestStreak >= 7 || s.currentStreak >= 7,
    progress: (s) => Math.min(Math.max(s.longestStreak, s.currentStreak) / 7, 1),
  },
  {
    key: "streak_14",
    name: "Fortnight Fit",
    emoji: "🗓️",
    description: "Maintain a 14-day activity streak",
    category: "streak",
    gradient: "linear-gradient(135deg, #92400e 0%, #b45309 100%)",
    check: (s) => s.longestStreak >= 14 || s.currentStreak >= 14,
    progress: (s) => Math.min(Math.max(s.longestStreak, s.currentStreak) / 14, 1),
  },
  {
    key: "streak_30",
    name: "Month Monarch",
    emoji: "💎",
    description: "Maintain a 30-day activity streak",
    category: "streak",
    gradient: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)",
    check: (s) => s.longestStreak >= 30 || s.currentStreak >= 30,
    progress: (s) => Math.min(Math.max(s.longestStreak, s.currentStreak) / 30, 1),
  },

  // ── SOCIAL MILESTONES ─────────────────────────────────────────────────────
  {
    key: "social_debut",
    name: "Royal Debut",
    emoji: "🎉",
    description: "Share your first post",
    category: "social",
    gradient: "linear-gradient(135deg, #be185d 0%, #ec4899 100%)",
    check: (s) => s.totalPosts >= 1,
    progress: (s) => Math.min(s.totalPosts / 1, 1),
  },
  {
    key: "social_10_posts",
    name: "Content Creator",
    emoji: "📸",
    description: "Share 10 posts",
    category: "social",
    gradient: "linear-gradient(135deg, #9d174d 0%, #db2777 100%)",
    check: (s) => s.totalPosts >= 10,
    progress: (s) => Math.min(s.totalPosts / 10, 1),
  },
  {
    key: "social_10_followers",
    name: "Inner Circle",
    emoji: "🤝",
    description: "Earn 10 followers",
    category: "social",
    gradient: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)",
    check: (s) => s.followerCount >= 10,
    progress: (s) => Math.min(s.followerCount / 10, 1),
  },
  {
    key: "social_50_followers",
    name: "Squad Goals",
    emoji: "👥",
    description: "Earn 50 followers",
    category: "social",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)",
    check: (s) => s.followerCount >= 50,
    progress: (s) => Math.min(s.followerCount / 50, 1),
  },
  {
    key: "social_10_likes",
    name: "Crowd Pleaser",
    emoji: "❤️",
    description: "Receive 10 likes on your posts",
    category: "social",
    gradient: "linear-gradient(135deg, #9f1239 0%, #e11d48 100%)",
    check: (s) => s.likesReceived >= 10,
    progress: (s) => Math.min(s.likesReceived / 10, 1),
  },
  {
    key: "social_100_likes",
    name: "Fan Favourite",
    emoji: "🌟",
    description: "Receive 100 likes on your posts",
    category: "social",
    gradient: "linear-gradient(135deg, #78350f 0%, #d97706 100%)",
    check: (s) => s.likesReceived >= 100,
    progress: (s) => Math.min(s.likesReceived / 100, 1),
  },

  // ── EXPLORER MILESTONES ───────────────────────────────────────────────────
  {
    key: "explorer_3_muscles",
    name: "Jack of Lifts",
    emoji: "🗺️",
    description: "Train 3 different muscle groups",
    category: "explorer",
    gradient: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
    check: (s) => s.uniqueMuscleGroups.length >= 3,
    progress: (s) => Math.min(s.uniqueMuscleGroups.length / 3, 1),
  },
  {
    key: "explorer_6_muscles",
    name: "Full Body Boss",
    emoji: "🏅",
    description: "Train 6 different muscle groups",
    category: "explorer",
    gradient: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    check: (s) => s.uniqueMuscleGroups.length >= 6,
    progress: (s) => Math.min(s.uniqueMuscleGroups.length / 6, 1),
  },
  {
    key: "explorer_all_muscles",
    name: "Renaissance Athlete",
    emoji: "🎨",
    description: "Train every muscle group in the app",
    category: "explorer",
    gradient: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
    check: (s) => s.uniqueMuscleGroups.length >= 8,
    progress: (s) => Math.min(s.uniqueMuscleGroups.length / 8, 1),
  },
  {
    key: "explorer_all_types",
    name: "Lifestyle Logger",
    emoji: "🌈",
    description: "Post all 4 types: Workout, Meal, Wellness, and General",
    category: "explorer",
    gradient: "linear-gradient(135deg, #134e4a 0%, #0d9488 100%)",
    check: (s) => s.hasPostedAllTypes,
  },
];

/** Map for O(1) lookup by key */
export const ACHIEVEMENT_MAP = new Map<string, AchievementDef>(
  ACHIEVEMENTS.map((a) => [a.key, a])
);

/** Category display config */
export const CATEGORY_META: Record<
  AchievementDef["category"],
  { label: string; emoji: string }
> = {
  workout: { label: "Workout", emoji: "💪" },
  meal: { label: "Nutrition", emoji: "🥗" },
  wellness: { label: "Wellness", emoji: "🧘" },
  streak: { label: "Streaks", emoji: "🔥" },
  social: { label: "Social", emoji: "👥" },
  explorer: { label: "Explorer", emoji: "🗺️" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Server-side checker — called after post creation
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAndAwardAchievements(
  userId: string,
  prisma: PrismaClient
): Promise<string[]> {
  // Gather all stats in parallel
  const [
    workoutCount,
    mealCount,
    wellnessCount,
    totalPosts,
    followerCount,
    likesReceived,
    muscleGroupRows,
    postTypeRows,
    volumeResult,
    setsResult,
    existingAchievements,
    streakData,
    wellnessMinutesResult,
  ] = await Promise.all([
    prisma.post.count({ where: { authorId: userId, type: "WORKOUT" } }),
    prisma.post.count({ where: { authorId: userId, type: "MEAL" } }),
    prisma.post.count({ where: { authorId: userId, type: "WELLNESS" } }),
    prisma.post.count({ where: { authorId: userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.like.count({ where: { post: { authorId: userId } } }),
    prisma.workoutDetail.findMany({
      where: { post: { authorId: userId } },
      select: { muscleGroups: true },
    }),
    prisma.post.findMany({
      where: { authorId: userId },
      select: { type: true },
      distinct: ["type"],
    }),
    prisma.exerciseSet.findMany({
      where: {
        exercise: { workoutDetail: { post: { authorId: userId } } },
        weight: { not: null },
        reps: { not: null },
      },
      select: { weight: true, reps: true },
    }),
    prisma.exerciseSet.count({
      where: { exercise: { workoutDetail: { post: { authorId: userId } } } },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { badgeKey: true },
    }),
    // Last 90 days of posts for streak calculation
    prisma.post.findMany({
      where: { authorId: userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.wellnessDetail.aggregate({
      where: { post: { authorId: userId } },
      _sum: { durationMinutes: true },
    }),
  ]);

  // Compute unique muscle groups
  const uniqueMuscleGroups = [
    ...new Set(muscleGroupRows.flatMap((r) => r.muscleGroups)),
  ];

  // Compute if all 4 post types exist
  const postedTypes = new Set(postTypeRows.map((r) => r.type));
  const hasPostedAllTypes =
    postedTypes.has("WORKOUT") &&
    postedTypes.has("MEAL") &&
    postedTypes.has("WELLNESS") &&
    postedTypes.has("GENERAL");

  // Compute total volume (weight × reps per set, summed)
  const totalVolumeLbs = Math.round(
    volumeResult.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
  );

  // Compute streak (days with at least one post, consecutive back from today)
  const { longestStreak, currentStreak } = computeStreaks(
    streakData.map((p) => p.createdAt)
  );

  const wellnessMinutes = wellnessMinutesResult._sum.durationMinutes ?? 0;

  const stats: AchievementStats = {
    workoutCount,
    mealCount,
    wellnessCount,
    totalPosts,
    currentStreak,
    longestStreak,
    followerCount,
    followingCount: 0, // not needed for current achievements
    likesReceived,
    uniqueMuscleGroups,
    hasPostedAllTypes,
    totalVolumeLbs,
    totalSets: setsResult,
    wellnessMinutes,
  };

  const alreadyEarned = new Set(existingAchievements.map((a) => a.badgeKey));

  // Find newly earned achievements
  const newlyEarned = ACHIEVEMENTS.filter(
    (a) => !alreadyEarned.has(a.key) && a.check(stats)
  ).map((a) => a.key);

  if (newlyEarned.length > 0) {
    await prisma.userAchievement.createMany({
      data: newlyEarned.map((badgeKey) => ({ userId, badgeKey })),
      skipDuplicates: true,
    });
  }

  return newlyEarned;
}

function computeStreaks(dates: Date[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Normalize to unique date strings (YYYY-MM-DD)
  const daySet = new Set(
    dates.map((d) => d.toISOString().split("T")[0])
  );
  const days = [...daySet].sort().reverse(); // newest first

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Current streak: consecutive from today or yesterday
  let currentStreak = 0;
  if (days[0] === today || days[0] === yesterday) {
    const startFrom = days[0] === today ? today : yesterday;
    const startDate = new Date(startFrom + "T12:00:00Z");
    let cursor = startDate;
    for (const day of days) {
      const expected = cursor.toISOString().split("T")[0];
      if (day === expected) {
        currentStreak++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all days
  let longestStreak = 0;
  let run = 1;
  const sortedAsc = [...daySet].sort();
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1] + "T12:00:00Z");
    const curr = new Date(sortedAsc[i] + "T12:00:00Z");
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / 86400000
    );
    if (diffDays === 1) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }
  longestStreak = Math.max(longestStreak, run, currentStreak);

  return { currentStreak, longestStreak };
}
