import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    const { username } = await params;

    const profileUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });

    if (!profileUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const requesterId = session?.user?.id;
    const isOwner = requesterId === profileUser.id;

    if (profileUser.isPrivate && !isOwner) {
      // Check if requester follows this user
      if (!requesterId) {
        return NextResponse.json({ error: "Private account" }, { status: 403 });
      }
      const follows = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: requesterId, followingId: profileUser.id } },
      });
      if (!follows) {
        return NextResponse.json({ error: "Private account" }, { status: 403 });
      }
    }

    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 50);

    const follows = await prisma.follow.findMany({
      where: { followingId: profileUser.id },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        follower: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    let nextCursor: string | undefined;
    if (follows.length > limit) {
      nextCursor = follows.pop()!.id;
    }

    const users = follows.map((f) => f.follower);

    return NextResponse.json({ users, nextCursor });
  } catch (error) {
    console.error("GET /api/users/[username]/followers error:", error);
    return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 });
  }
}
