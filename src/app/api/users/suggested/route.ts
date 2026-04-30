import { NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/suggested — All public users ranked by total post count, excluding followed/blocked
export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

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

    const excludedIds = [
      userId,
      ...followingRows.map((f) => f.followingId),
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ];

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
        isPrivate: false,
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        _count: { select: { posts: true } },
      },
      orderBy: {
        posts: { _count: "desc" },
      },
      take: 20,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users/suggested error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
