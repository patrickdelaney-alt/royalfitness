import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import {
  safeTimeZone,
  getUserToday,
  midnightInTzToUTC,
  utcToLocalDateStr,
  getDayName,
  getMonday,
  getWeekDays,
  getMonthStart,
  getYearStart,
  addDaysToDateStr,
} from "@/lib/timezone";

export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const period = searchParams.get("period") ?? "week";
    // Access scope:
    // - Default is strict self-only stats for the authenticated user.
    // - A cross-user `userId` is only allowed for admins or users with a public profile.
    const requestedUserId = searchParams.get("userId");
    let userId = session.user.id;

    if (requestedUserId && requestedUserId !== session.user.id) {
      const isAdmin =
        !!session.user.email && session.user.email === process.env.ADMIN_EMAIL;

      if (!isAdmin) {
        const targetUser = await prisma.user.findUnique({
          where: { id: requestedUserId },
          select: { isPrivate: true },
        });

        const hasPublicStatsOptIn = !!targetUser && !targetUser.isPrivate;
        if (!hasPublicStatsOptIn) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      userId = requestedUserId;
    }

    const tz = safeTimeZone(searchParams.get("tz"));

    // Calculate period boundaries in user's timezone, converted to UTC
    const todayStr = getUserToday(tz);
    let periodStartStr: string;

    switch (period) {
      case "month":
        periodStartStr = getMonthStart(todayStr);
        break;
      case "year":
        periodStartStr = getYearStart(todayStr);
        break;
      case "week":
      default:
        periodStartStr = getMonday(todayStr);
        break;
    }

    const periodStart = midnightInTzToUTC(periodStartStr, tz);

    // Fetch all posts in the period for this user
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        createdAt: { gte: periodStart },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
      },
    });

    // Count workout posts
    const workoutPostIds: string[] = [];
    let mealsPosted = 0;

    for (const post of posts) {
      if (post.type === "WORKOUT") {
        workoutPostIds.push(post.id);
      } else if (post.type === "MEAL") {
        mealsPosted++;
      }
    }

    const workoutCount = workoutPostIds.length;

    // Total sets and total volume from workout exercises
    let totalSets = 0;
    let totalVolume = 0;

    if (workoutPostIds.length > 0) {
      const setsAgg = await prisma.exerciseSet.aggregate({
        _count: { id: true },
        where: {
          exercise: {
            workoutDetail: {
              postId: { in: workoutPostIds },
            },
          },
        },
      });
      totalSets = setsAgg._count.id;

      // Calculate total volume: sum of (weight * reps) where both are present
      const volumeSets = await prisma.exerciseSet.findMany({
        where: {
          exercise: {
            workoutDetail: {
              postId: { in: workoutPostIds },
            },
          },
          weight: { not: null },
          reps: { not: null },
        },
        select: {
          weight: true,
          reps: true,
        },
      });

      for (const s of volumeSets) {
        if (s.weight !== null && s.reps !== null) {
          totalVolume += s.weight * s.reps;
        }
      }
    }

    // Wellness minutes: sum of durationMinutes from WellnessDetail
    const wellnessAgg = await prisma.wellnessDetail.aggregate({
      _sum: { durationMinutes: true },
      where: {
        post: {
          authorId: userId,
          createdAt: { gte: periodStart },
        },
      },
    });
    const wellnessMinutes = wellnessAgg._sum.durationMinutes ?? 0;

    // Average moodAfter across WorkoutDetail and WellnessDetail in the period
    const workoutMoodAgg = await prisma.workoutDetail.aggregate({
      _avg: { moodAfter: true },
      _count: { moodAfter: true },
      where: {
        post: {
          authorId: userId,
          createdAt: { gte: periodStart },
        },
        moodAfter: { not: null },
      },
    });

    const wellnessMoodAgg = await prisma.wellnessDetail.aggregate({
      _avg: { moodAfter: true },
      _count: { moodAfter: true },
      where: {
        post: {
          authorId: userId,
          createdAt: { gte: periodStart },
        },
        moodAfter: { not: null },
      },
    });

    const totalMoodCount =
      workoutMoodAgg._count.moodAfter + wellnessMoodAgg._count.moodAfter;
    const avgMoodAfter =
      totalMoodCount > 0
        ? ((workoutMoodAgg._avg.moodAfter ?? 0) *
            workoutMoodAgg._count.moodAfter +
            (wellnessMoodAgg._avg.moodAfter ?? 0) *
              wellnessMoodAgg._count.moodAfter) /
          totalMoodCount
        : null;

    // Streak calculations: fetch all post dates for the user (any type) ordered desc
    const allPostDates = await prisma.post.findMany({
      where: { authorId: userId },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: "desc" },
    });

    const allDates: Date[] = [];
    const workoutDates: Date[] = [];

    for (const post of allPostDates) {
      allDates.push(post.createdAt);
      if (post.type === "WORKOUT") {
        workoutDates.push(post.createdAt);
      }
    }

    const currentStreak = calculateStreak(allDates, tz);
    const workoutStreak = calculateStreak(workoutDates, tz);

    // Weekly workout breakdown: Mon-Sun of current calendar week in user's TZ
    const weekDays = getWeekDays(todayStr);
    const weekStartUTC = midnightInTzToUTC(weekDays[0], tz);
    const weekEndUTC = midnightInTzToUTC(addDaysToDateStr(weekDays[6], 1), tz);

    const weeklyPosts = await prisma.post.findMany({
      where: {
        authorId: userId,
        type: "WORKOUT",
        createdAt: { gte: weekStartUTC, lt: weekEndUTC },
      },
      select: {
        createdAt: true,
        workoutDetail: { select: { muscleGroups: true } },
      },
    });

    // Build day map keyed by YYYY-MM-DD in user's timezone
    const dayMap = new Map<
      string,
      { workoutCount: number; muscleGroups: string[] }
    >();
    for (const dayStr of weekDays) {
      dayMap.set(dayStr, { workoutCount: 0, muscleGroups: [] });
    }

    for (const post of weeklyPosts) {
      const localDay = utcToLocalDateStr(post.createdAt, tz);
      if (dayMap.has(localDay)) {
        const entry = dayMap.get(localDay)!;
        entry.workoutCount++;
        if (post.workoutDetail?.muscleGroups) {
          for (const mg of post.workoutDetail.muscleGroups) {
            if (!entry.muscleGroups.includes(mg)) {
              entry.muscleGroups.push(mg);
            }
          }
        }
      }
    }

    const weeklyWorkouts = weekDays.map((dayStr) => {
      const data = dayMap.get(dayStr)!;
      return {
        date: dayStr,
        dayName: getDayName(dayStr, tz),
        isToday: dayStr === todayStr,
        workoutCount: data.workoutCount,
        muscleGroups: data.muscleGroups,
      };
    });

    // Muscle group frequency for the selected period
    const periodWorkoutPosts = await prisma.post.findMany({
      where: {
        authorId: userId,
        type: "WORKOUT",
        createdAt: { gte: periodStart },
      },
      select: {
        workoutDetail: { select: { muscleGroups: true } },
      },
    });

    const muscleGroupCounts: Record<string, number> = {};
    for (const post of periodWorkoutPosts) {
      if (post.workoutDetail?.muscleGroups) {
        for (const mg of post.workoutDetail.muscleGroups) {
          muscleGroupCounts[mg] = (muscleGroupCounts[mg] ?? 0) + 1;
        }
      }
    }

    return NextResponse.json({
      workoutCount,
      totalSets,
      totalVolume,
      wellnessMinutes,
      mealsPosted,
      avgMoodAfter:
        avgMoodAfter !== null
          ? Math.round(avgMoodAfter * 10) / 10
          : null,
      currentStreak,
      workoutStreak,
      weeklyWorkouts,
      muscleGroupCounts,
      period,
      userId,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Calculate consecutive days with at least one post, counting back from today
 * in the user's timezone. If there is no post today, the streak is 0.
 */
function calculateStreak(dates: Date[], timeZone: string): number {
  if (dates.length === 0) return 0;

  // Convert each UTC date to the user's local date string and deduplicate
  const uniqueDays = new Set<string>();
  for (const d of dates) {
    uniqueDays.add(utcToLocalDateStr(d, timeZone));
  }

  const todayStr = getUserToday(timeZone);

  if (!uniqueDays.has(todayStr)) {
    return 0;
  }

  let streak = 1;
  let checkDate = new Date(todayStr + "T12:00:00Z");

  while (true) {
    checkDate = new Date(checkDate.getTime() - 86400000);
    const checkStr = utcToLocalDateStr(checkDate, timeZone);
    if (uniqueDays.has(checkStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
