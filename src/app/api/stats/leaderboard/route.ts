import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

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
    const period = searchParams.get("period") ?? "week";

    // Calculate the start date based on the requested period
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case "month":
        periodStart = subDays(now, 30);
        break;
      case "week":
      default:
        periodStart = subDays(now, 7);
        break;
    }

    // Get all users the current user follows
    const followRecords = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    // Include the current user + everyone they follow
    const followingIds: string[] = [];
    for (const record of followRecords) {
      followingIds.push(record.followingId);
    }
    const uniqueUserIds = [...new Set([currentUserId, ...followingIds])];

    // Fetch user profile info for all participants
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map<string, UserProfile>();
    for (const user of users) {
      userMap.set(user.id, user);
    }

    // Fetch all posts in the period for these users
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: uniqueUserIds },
        createdAt: { gte: periodStart },
      },
      select: {
        id: true,
        type: true,
        authorId: true,
        wellnessDetail: {
          select: { durationMinutes: true },
        },
      },
    });

    // Accumulate stats per user
    const statsMap = new Map<string, UserStats>();

    // Initialize all users with zero stats
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

    // Build sorted leaderboard arrays
    function buildLeaderboard(
      metric: keyof UserStats
    ): LeaderboardEntry[] {
      return uniqueUserIds
        .map((uid: string) => {
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
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.value - a.value)
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
