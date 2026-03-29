// @ts-nocheck
import { NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import {
  recommendationEngine,
  type UserActivitySummary,
} from "@/services/recommendations";

export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      workoutsThisWeek,
      mealsThisWeek,
      wellnessThisWeek,
      proteinThisWeek,
      lastWorkout,
      lastPost,
      lastWellness,
      muscleGroupsThisWeek,
      allTimeMuscleGroups,
      streakPosts,
      affiliateItemCount,
    ] = await Promise.all([
      prisma.post.count({
        where: { authorId: userId, type: "WORKOUT", createdAt: { gte: weekAgo } },
      }),
      prisma.post.count({
        where: { authorId: userId, type: "MEAL", createdAt: { gte: weekAgo } },
      }),
      prisma.wellnessDetail.aggregate({
        where: { post: { authorId: userId, createdAt: { gte: weekAgo } } },
        _sum: { durationMinutes: true },
      }),
      prisma.mealDetail.aggregate({
        where: { post: { authorId: userId, createdAt: { gte: weekAgo } } },
        _avg: { protein: true },
      }),
      prisma.post.findFirst({
        where: { authorId: userId, type: "WORKOUT" },
        orderBy: { createdAt: "desc" },
        include: { workoutDetail: { select: { muscleGroups: true } } },
      }),
      prisma.post.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.post.findFirst({
        where: { authorId: userId, type: "WELLNESS" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.workoutDetail.findMany({
        where: { post: { authorId: userId, createdAt: { gte: weekAgo } } },
        select: { muscleGroups: true },
      }),
      prisma.workoutDetail.findMany({
        where: { post: { authorId: userId } },
        select: { muscleGroups: true },
      }),
      prisma.post.findMany({
        where: { authorId: userId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.affiliateItem.count({ where: { userId } }),
    ]);

    const dayMs = 24 * 60 * 60 * 1000;
    const daysSinceLastPost = lastPost
      ? Math.floor((now.getTime() - lastPost.createdAt.getTime()) / dayMs)
      : 999;
    const daysSinceLastWorkout = lastWorkout
      ? Math.floor((now.getTime() - lastWorkout.createdAt.getTime()) / dayMs)
      : 999;
    const daysSinceLastWellness = lastWellness
      ? Math.floor((now.getTime() - lastWellness.createdAt.getTime()) / dayMs)
      : 999;

    const uniqueMuscleGroupsThisWeek = [
      ...new Set(muscleGroupsThisWeek.flatMap((r) => r.muscleGroups)),
    ];
    const uniqueAllTimeMuscleGroups = [
      ...new Set(allTimeMuscleGroups.flatMap((r) => r.muscleGroups)),
    ];

    // Current streak
    const daySet = new Set(
      streakPosts.map((p) => p.createdAt.toISOString().split("T")[0])
    );
    const days = [...daySet].sort().reverse();
    const today = now.toISOString().split("T")[0];
    const yesterday = new Date(now.getTime() - dayMs).toISOString().split("T")[0];
    let currentStreak = 0;
    if (days[0] === today || days[0] === yesterday) {
      const startDate = new Date(
        (days[0] === today ? today : yesterday) + "T12:00:00Z"
      );
      let cursor = startDate;
      for (const day of days) {
        if (day === cursor.toISOString().split("T")[0]) {
          currentStreak++;
          cursor = new Date(cursor.getTime() - dayMs);
        } else break;
      }
    }

    const summary: UserActivitySummary = {
      workoutsThisWeek,
      mealsLoggedThisWeek: mealsThisWeek,
      wellnessMinutesThisWeek: wellnessThisWeek._sum.durationMinutes ?? 0,
      avgProteinThisWeek: proteinThisWeek._avg.protein ?? null,
      proteinTarget: 150,
      lastWorkoutMuscleGroups: lastWorkout?.workoutDetail?.muscleGroups ?? [],
      daysSinceLastPost,
      daysSinceLastWorkout,
      daysSinceLastWellness,
      uniqueMuscleGroupsThisWeek,
      totalMuscleGroups: uniqueAllTimeMuscleGroups.length,
      currentStreak,
    };

    const recommendations = recommendationEngine
      .getRecommendations(summary)
      .slice(0, 3);

    if (affiliateItemCount === 0) {
      recommendations.unshift({
        type: "catalog",
        title: "Start earning with your catalog",
        message: "Add your referral links and codes to your catalog. Share them to your feed and earn royalties when followers click through.",
        priority: 9,
      });
    }

    return NextResponse.json({ recommendations: recommendations.slice(0, 3) });
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
