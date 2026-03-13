import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/suggestions — Active users to follow (not yet followed)
export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = req.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 30);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch current user's following and blocked lists in parallel
    const [followingRows, blockedByMe, blockedMe] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      prisma.blockedUser.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      prisma.blockedUser.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      }),
    ]);

    const followingIds = new Set(followingRows.map((f) => f.followingId));
    const blockedIds = new Set([
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ]);

    // Find most active PUBLIC posters in the last 7 days
    const recentPostGroups = await prisma.post.groupBy({
      by: ["authorId"],
      where: {
        createdAt: { gte: sevenDaysAgo },
        visibility: "PUBLIC",
        authorId: { not: userId },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit * 4, // over-fetch to account for filtering
    });

    // Filter out already-followed and blocked users
    const eligibleAuthorIds = recentPostGroups
      .filter(
        (g) => !followingIds.has(g.authorId) && !blockedIds.has(g.authorId)
      )
      .slice(0, limit)
      .map((g) => g.authorId);

    if (eligibleAuthorIds.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Fetch user details and post types in parallel
    const [users, postTypeRows] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { in: eligibleAuthorIds },
          isPrivate: false, // only suggest public accounts
        },
        select: { id: true, name: true, username: true, avatarUrl: true },
      }),
      prisma.post.findMany({
        where: {
          authorId: { in: eligibleAuthorIds },
          createdAt: { gte: sevenDaysAgo },
          visibility: "PUBLIC",
        },
        select: { authorId: true, type: true },
        distinct: ["authorId", "type"],
      }),
    ]);

    // Build a map of authorId -> post count
    const countMap = new Map(
      recentPostGroups.map((g) => [g.authorId, g._count.id])
    );

    // Build a map of authorId -> distinct post types
    const typeMap = new Map<string, string[]>();
    for (const row of postTypeRows) {
      const existing = typeMap.get(row.authorId) ?? [];
      if (!existing.includes(row.type)) existing.push(row.type);
      typeMap.set(row.authorId, existing);
    }

    // Assemble suggestions in eligibleAuthorIds order (already sorted by count)
    const userMap = new Map(users.map((u) => [u.id, u]));
    const suggestions = eligibleAuthorIds
      .map((id) => {
        const user = userMap.get(id);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          postCount: countMap.get(id) ?? 0,
          postTypes: typeMap.get(id) ?? [],
        };
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("GET /api/users/suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
