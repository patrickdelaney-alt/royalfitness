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

type AggRow = {
  authorId: string;
  workoutCount: bigint;
  mealsLogged: bigint;
  wellnessMinutes: bigint;
};

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

    // Aggregate post counts per user in Postgres — no rows fetched to Node.js.
    // For period="all" we use epoch as cutoff so the query plan is stable (no
    // nullable parameter) and all historical posts are included.
    const effectiveCutoff = periodStart ?? new Date(0);

    const aggRows = await prisma.$queryRaw<AggRow[]>`
      SELECT
        p."authorId",
        COUNT(*) FILTER (WHERE p.type = 'WORKOUT')                                AS "workoutCount",
        COUNT(*) FILTER (WHERE p.type = 'MEAL')                                   AS "mealsLogged",
        COALESCE(SUM(wd."durationMinutes") FILTER (WHERE p.type = 'WELLNESS'), 0) AS "wellnessMinutes"
      FROM "Post" p
      LEFT JOIN "WellnessDetail" wd ON wd."postId" = p.id AND p.type = 'WELLNESS'
      WHERE p."authorId" = ANY(${uniqueUserIds}::text[])
        AND p."createdAt" >= ${effectiveCutoff}
      GROUP BY p."authorId"
    `;

    // Build statsMap — COUNT returns BigInt in Node.js, convert to number
    const statsMap = new Map<string, UserStats>();
    for (const uid of uniqueUserIds) {
      statsMap.set(uid, { workoutCount: 0, wellnessMinutes: 0, mealsLogged: 0 });
    }
    for (const row of aggRows) {
      statsMap.set(row.authorId, {
        workoutCount: Number(row.workoutCount),
        wellnessMinutes: Number(row.wellnessMinutes),
        mealsLogged: Number(row.mealsLogged),
      });
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

    return NextResponse.json(
      {
        period,
        workoutCount: buildLeaderboard("workoutCount"),
        wellnessMinutes: buildLeaderboard("wellnessMinutes"),
        mealsLogged: buildLeaderboard("mealsLogged"),
      },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
