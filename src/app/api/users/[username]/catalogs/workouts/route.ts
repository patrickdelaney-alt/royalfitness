import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[username]/catalogs/workouts — Get another user's saved workouts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await safeAuth();
    const { username } = await params;

    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "30", 10), 1),
      50
    );

    // Find the user
    const profileUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });

    if (!profileUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check access permissions
    const isOwnProfile = session?.user?.id === profileUser.id;
    const isFollowing =
      session?.user?.id &&
      (await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: profileUser.id,
          },
        },
      }));

    const canAccess = isOwnProfile || !profileUser.isPrivate || !!isFollowing;

    if (!canAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const workouts = await prisma.savedWorkout.findMany({
      where: {
        userId: profileUser.id,
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | undefined;
    if (workouts.length > limit) {
      const nextItem = workouts.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({ workouts, nextCursor });
  } catch (error) {
    console.error("GET /api/users/[username]/catalogs/workouts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workouts" },
      { status: 500 }
    );
  }
}
