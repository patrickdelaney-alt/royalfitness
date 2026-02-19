import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/posts/[id] — Get a single post by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        workoutDetail: {
          include: {
            exercises: {
              include: { sets: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        mealDetail: true,
        wellnessDetail: true,
        gym: { select: { id: true, name: true } },
        externalContent: true,
        _count: { select: { likes: true, comments: true } },
        ...(userId
          ? { likes: { where: { userId }, select: { id: true } } }
          : {}),
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check visibility permissions
    if (post.visibility === "PRIVATE" && post.authorId !== userId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.visibility === "FOLLOWERS" && post.authorId !== userId) {
      if (!userId) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      const isFollowing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: post.authorId,
          },
        },
      });
      if (!isFollowing) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    // Check if the viewer is blocked by the author or vice versa
    if (userId && userId !== post.authorId) {
      const blocked = await prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: post.authorId, blockedId: userId },
            { blockerId: userId, blockedId: post.authorId },
          ],
        },
      });
      if (blocked) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    const likes =
      "likes" in post
        ? (post as typeof post & { likes: { id: string }[] }).likes
        : [];
    const responsePost = {
      ...post,
      likedByMe: likes.length > 0,
      likes: undefined,
    };

    return NextResponse.json(responsePost);
  } catch (error) {
    console.error("GET /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] — Delete a post (author only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
