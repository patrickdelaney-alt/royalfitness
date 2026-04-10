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
import { getOrRefreshStreaks } from "@/lib/user-stats";

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

    // Fetch all posts in the period for this user, including muscleGroups so
    // we avoid a second round-trip later for the muscle group breakdown.
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        createdAt: { gte: periodStart },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        workoutDetail: { select: { muscleGroups: true } },
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

    // Total sets from workout exercises (aggregate count at DB level)
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

      // Total volume: push SUM(weight * reps) to Postgres — no rows returned to Node.js
      const [volumeResult] = await prisma.$queryRaw<[{ total: number | null }]>`
        SELECT SUM(es.weight * es.reps) AS total
        FROM "ExerciseSet" es
        JOIN "Exercise" e ON e.id = es."exerciseId"
        JOIN "WorkoutDetail" wd ON wd.id = e."workoutDetailId"
        WHERE wd."postId" = ANY(${workoutPostIds}::text[])
          AND es.weight IS NOT NULL
          AND es.reps IS NOT NULL
      `;
      totalVolume = Number(volumeResult?.total ?? 0);
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

    // Streaks: use lazy cache (bounded 730-day query, 2-min TTL, invalidated on write)
    const { currentStreak, workoutStreak } = await getOrRefreshStreaks(
      userId,
      tz
    );

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

    // Muscle group frequency for the selected period — reuse already-fetched posts
    const muscleGroupCounts: Record<string, number> = {};
    for (const post of posts) {
      if (post.type === "WORKOUT" && post.workoutDetail?.muscleGroups) {
        for (const mg of post.workoutDetail.muscleGroups) {
          muscleGroupCounts[mg] = (muscleGroupCounts[mg] ?? 0) + 1;
        }
      }
    }

    return NextResponse.json(
      {
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
      },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
