// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import {
  safeTimeZone,
  getUserToday,
  midnightInTzToUTC,
  getMonday,
  getMonthStart,
  getYearStart,
} from "@/lib/timezone";

interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

interface UserStats {
  workoutCount: number;
  wellnessMinutes: number;
  mealsLogged: number;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  value: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = req.nextUrl;
    // "all" means no date filter; "week"/"month"/"year" filter by period
    const period = searchParams.get("period") ?? "all";
    const tz = safeTimeZone(searchParams.get("tz"));

    // Compute period start only when a specific period is requested
    let periodStart: Date | null = null;
    if (period !== "all") {
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
      periodStart = midnightInTzToUTC(periodStartStr, tz);
    }

    // Get all users the current user follows
    const followRecords = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const uniqueUserIds = [
      ...new Set([currentUserId, ...followRecords.map((r) => r.followingId)]),
    ];

    // Fetch user profile info for all participants
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, username: true, name: true, avatarUrl: true },
    });

    const userMap = new Map<string, UserProfile>();
    for (const user of users) {
      userMap.set(user.id, user);
    }

    // Fetch posts — all time when period="all", otherwise filtered by period start
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: uniqueUserIds },
        ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
      },
      select: {
        type: true,
        authorId: true,
        wellnessDetail: { select: { durationMinutes: true } },
      },
    });

    // Accumulate stats per user
    const statsMap = new Map<string, UserStats>();
    for (const uid of uniqueUserIds) {
      statsMap.set(uid, { workoutCount: 0, wellnessMinutes: 0, mealsLogged: 0 });
    }

    for (const post of posts) {
      const stats = statsMap.get(post.authorId);
      if (!stats) continue;
      switch (post.type) {
        case "WORKOUT":
          stats.workoutCount++;
          break;
        case "MEAL":
          stats.mealsLogged++;
          break;
        case "WELLNESS":
          if (post.wellnessDetail?.durationMinutes) {
            stats.wellnessMinutes += post.wellnessDetail.durationMinutes;
          }
          break;
      }
    }

    function buildLeaderboard(metric: keyof UserStats): LeaderboardEntry[] {
      return uniqueUserIds
        .map((uid) => {
          const user = userMap.get(uid);
          const stats = statsMap.get(uid);
          return {
            userId: uid,
            username: user?.username ?? "",
            name: user?.name ?? null,
            avatarUrl: user?.avatarUrl ?? null,
            value: stats?.[metric] ?? 0,
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }

    return NextResponse.json({
      period,
      workoutCount: buildLeaderboard("workoutCount"),
      wellnessMinutes: buildLeaderboard("wellnessMinutes"),
      mealsLogged: buildLeaderboard("mealsLogged"),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
