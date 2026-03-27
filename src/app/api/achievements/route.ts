// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  checkAndAwardAchievements,
  type AchievementStats,
} from "@/lib/achievements";
import { safeTimeZone, getUserToday, utcToLocalDateStr, addDaysToDateStr } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const targetUserId = searchParams.get("userId") ?? session.user.id;
    const tz = safeTimeZone(searchParams.get("tz"));

    // Only allow viewing other users' achievements if it's your own profile
    const viewingOwn = targetUserId === session.user.id;

    // Run the checker to award any new achievements (own profile only)
    if (viewingOwn) {
      await checkAndAwardAchievements(targetUserId, prisma, tz).catch(() => {});
    }

    // Fetch earned achievements
    const earned = await prisma.userAchievement.findMany({
      where: { userId: targetUserId },
      select: { badgeKey: true, earnedAt: true },
    });
    const earnedMap = new Map(earned.map((e: { badgeKey: string; earnedAt: Date | null }) => [e.badgeKey, e.earnedAt]));

    // Gather stats for progress calculation (own profile only)
    let stats: Partial<AchievementStats> = {};
    if (viewingOwn) {
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
        wellnessMinutesResult,
        recentPosts,
      ] = await Promise.all([
        prisma.post.count({ where: { authorId: targetUserId, type: "WORKOUT" } }),
        prisma.post.count({ where: { authorId: targetUserId, type: "MEAL" } }),
        prisma.post.count({ where: { authorId: targetUserId, type: "WELLNESS" } }),
        prisma.post.count({ where: { authorId: targetUserId } }),
        prisma.follow.count({ where: { followingId: targetUserId } }),
        prisma.like.count({ where: { post: { authorId: targetUserId } } }),
        prisma.workoutDetail.findMany({
          where: { post: { authorId: targetUserId } },
          select: { muscleGroups: true },
        }),
        prisma.post.findMany({
          where: { authorId: targetUserId },
          select: { type: true },
          distinct: ["type"],
        }),
        prisma.exerciseSet.aggregate({
          where: {
            exercise: {
              workoutDetail: { post: { authorId: targetUserId } },
            },
          },
          _sum: { weight: true },
        }),
        prisma.exerciseSet.count({
          where: {
            exercise: {
              workoutDetail: { post: { authorId: targetUserId } },
            },
          },
        }),
        prisma.wellnessDetail.aggregate({
          where: { post: { authorId: targetUserId } },
          _sum: { durationMinutes: true },
        }),
        prisma.post.findMany({
          where: { authorId: targetUserId },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
      ]);

      const uniqueMuscleGroups = [
        ...new Set(muscleGroupRows.flatMap((r) => r.muscleGroups)),
      ];
      const postedTypes = new Set(postTypeRows.map((r) => r.type));
      const hasPostedAllTypes =
        postedTypes.has("WORKOUT") &&
        postedTypes.has("MEAL") &&
        postedTypes.has("WELLNESS") &&
        postedTypes.has("GENERAL");

      // Streak calc (timezone-aware)
      const daySet = new Set(
        recentPosts.map((p) => utcToLocalDateStr(p.createdAt, tz))
      );
      const days = [...daySet].sort().reverse();
      const today = getUserToday(tz);
      const yesterday = addDaysToDateStr(today, -1);
      let currentStreak = 0;
      if (days[0] === today || days[0] === yesterday) {
        const startDate = new Date(
          (days[0] === today ? today : yesterday) + "T12:00:00Z"
        );
        let cursor = startDate;
        for (const day of days) {
          if (day === utcToLocalDateStr(cursor, tz)) {
            currentStreak++;
            cursor = new Date(cursor.getTime() - 86400000);
          } else break;
        }
      }
      let longestStreak = 0;
      let run = 1;
      const sortedAsc = [...daySet].sort();
      for (let i = 1; i < sortedAsc.length; i++) {
        const prev = new Date(sortedAsc[i - 1] + "T12:00:00Z");
        const curr = new Date(sortedAsc[i] + "T12:00:00Z");
        const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (diff === 1) {
          run++;
          longestStreak = Math.max(longestStreak, run);
        } else {
          run = 1;
        }
      }
      longestStreak = Math.max(longestStreak, run, currentStreak);

      stats = {
        workoutCount,
        mealCount,
        wellnessCount,
        totalPosts,
        currentStreak,
        longestStreak,
        followerCount,
        followingCount: 0,
        likesReceived,
        uniqueMuscleGroups,
        hasPostedAllTypes,
        totalVolumeLbs: Math.round(volumeResult._sum.weight ?? 0),
        totalSets: setsResult,
        wellnessMinutes: wellnessMinutesResult._sum.durationMinutes ?? 0,
      };
    }

    // Build response: all achievements with earned status + progress
    const result = ACHIEVEMENTS.map((def) => {
      const earnedAt = earnedMap.get(def.key);
      const earned = !!earnedAt;
      const progressValue =
        !earned && def.progress && stats
          ? def.progress(stats as AchievementStats)
          : earned
          ? 1
          : 0;

      return {
        key: def.key,
        name: def.name,
        emoji: def.emoji,
        description: def.description,
        category: def.category,
        gradient: def.gradient,
        earned,
        earnedAt: earnedAt ?? null,
        progress: Math.round(progressValue * 100) / 100,
      };
    });

    const earnedCount = result.filter((a) => a.earned).length;

    return NextResponse.json({ achievements: result, earnedCount, total: ACHIEVEMENTS.length });
  } catch (error) {
    console.error("GET /api/achievements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
