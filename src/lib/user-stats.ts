import { prisma } from "@/lib/prisma";
import { utcToLocalDateStr, getUserToday } from "@/lib/timezone";

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const STREAK_QUERY_DAYS = 730; // max lookback window (2 years)

/**
 * Returns { currentStreak, workoutStreak } for the given user using a lazy
 * DB cache in UserStats.
 *
 * Cache is valid for CACHE_TTL_MS (2 minutes). On cache miss or dirty cache
 * (streakComputedAt = null), streaks are recomputed from the last 730 days of
 * posts and the result is persisted. Streak queries are therefore always
 * bounded, never scanning all-time post history.
 *
 * The cache is invalidated by invalidateStreakCache() after post create/delete.
 */
export async function getOrRefreshStreaks(
  userId: string,
  tz: string
): Promise<{ currentStreak: number; workoutStreak: number }> {
  const now = new Date();

  const cached = await prisma.userStats.findUnique({
    where: { userId },
    select: {
      currentStreak: true,
      workoutStreak: true,
      streakComputedAt: true,
    },
  });

  // Cache hit: streakComputedAt is set and within TTL
  if (
    cached?.streakComputedAt != null &&
    now.getTime() - cached.streakComputedAt.getTime() < CACHE_TTL_MS
  ) {
    return {
      currentStreak: cached.currentStreak,
      workoutStreak: cached.workoutStreak,
    };
  }

  // Cache miss or dirty: recompute with a bounded query (max 730 days)
  const cutoff = new Date(now.getTime() - STREAK_QUERY_DAYS * 86_400_000);

  const recentPosts = await prisma.post.findMany({
    where: {
      authorId: userId,
      createdAt: { gte: cutoff },
    },
    select: { createdAt: true, type: true },
    orderBy: { createdAt: "desc" },
  });

  const allDates: Date[] = [];
  const workoutDates: Date[] = [];
  for (const post of recentPosts) {
    allDates.push(post.createdAt);
    if (post.type === "WORKOUT") {
      workoutDates.push(post.createdAt);
    }
  }

  const currentStreak = calculateStreak(allDates, tz);
  const workoutStreak = calculateStreak(workoutDates, tz);

  await prisma.userStats.upsert({
    where: { userId },
    create: { userId, currentStreak, workoutStreak, streakComputedAt: now },
    update: { currentStreak, workoutStreak, streakComputedAt: now },
  });

  return { currentStreak, workoutStreak };
}

/**
 * Marks the streak cache as dirty by setting streakComputedAt = null.
 * Called fire-and-forget after post creation or deletion so the next stats
 * read recomputes from updated data.
 */
export async function invalidateStreakCache(userId: string): Promise<void> {
  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak: 0,
      workoutStreak: 0,
      streakComputedAt: null,
    },
    update: { streakComputedAt: null },
  });
}

/**
 * Calculate consecutive days with at least one post, counting back from today
 * in the user's timezone. Returns 0 if there is no post today.
 */
function calculateStreak(dates: Date[], timeZone: string): number {
  if (dates.length === 0) return 0;

  const uniqueDays = new Set<string>();
  for (const d of dates) {
    uniqueDays.add(utcToLocalDateStr(d, timeZone));
  }

  const todayStr = getUserToday(timeZone);
  if (!uniqueDays.has(todayStr)) return 0;

  let streak = 1;
  let checkDate = new Date(todayStr + "T12:00:00Z");

  while (true) {
    checkDate = new Date(checkDate.getTime() - 86_400_000);
    const checkStr = utcToLocalDateStr(checkDate, timeZone);
    if (uniqueDays.has(checkStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
