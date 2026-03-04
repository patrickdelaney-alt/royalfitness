import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const period = searchParams.get("period") ?? "week";
    const userId = searchParams.get("userId") ?? session.user.id;

    // Calculate the start date based on the requested period
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case "month":
        periodStart = startOfMonth(now);
        break;
      case "year":
        periodStart = startOfYear(now);
        break;
      case "week":
      default:
        periodStart = startOfWeek(now, { weekStartsOn: 1 });
        break;
    }

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

    const currentStreak = calculateStreak(allDates);
    const workoutStreak = calculateStreak(workoutDates);

    // Weekly workout breakdown (last 7 days, always, regardless of period)
    const weeklyPosts = await prisma.post.findMany({
      where: {
        authorId: userId,
        type: "WORKOUT",
        createdAt: { gte: subDays(now, 6) },
      },
      select: {
        createdAt: true,
        workoutDetail: { select: { muscleGroups: true } },
      },
    });

    // Build a map for last 7 days (day 0 = today, day 6 = 6 days ago)
    const dayMap = new Map<
      string,
      { workoutCount: number; muscleGroups: string[] }
    >();
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(now, i));
      dayMap.set(day.toISOString(), { workoutCount: 0, muscleGroups: [] });
    }

    for (const post of weeklyPosts) {
      const dayKey = startOfDay(post.createdAt).toISOString();
      if (dayMap.has(dayKey)) {
        const entry = dayMap.get(dayKey)!;
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

    const weeklyWorkouts = Array.from(dayMap.entries()).map(
      ([dateIso, data]) => ({
        date: dateIso,
        dayName: format(new Date(dateIso), "EEE"),
        workoutCount: data.workoutCount,
        muscleGroups: data.muscleGroups,
      })
    );

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
 * Calculate consecutive days with at least one post, counting back from today.
 * If there is no post today, the streak is 0.
 */
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Normalize all dates to start-of-day and deduplicate
  const uniqueDays = new Set<string>();
  for (const d of dates) {
    const day = startOfDay(d).toISOString();
    uniqueDays.add(day);
  }

  const today = startOfDay(new Date());

  // Check if today has a post
  if (!uniqueDays.has(today.toISOString())) {
    return 0;
  }

  let streak = 1;
  let checkDate = subDays(today, 1);

  while (uniqueDays.has(checkDate.toISOString())) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  return streak;
}
