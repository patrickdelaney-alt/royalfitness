import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/posts/[id] — Get a single post by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await safeAuth();
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
        affiliateDetail: true,
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

// PATCH /api/posts/[id] — Edit a post (author only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { caption, visibility, workoutName, mealName, activityType } = body;

    if (
      visibility !== undefined &&
      !["PUBLIC", "FOLLOWERS", "PRIVATE"].includes(visibility)
    ) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true, type: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.update({
      where: { id },
      data: {
        ...(caption !== undefined ? { caption: caption || null } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
      },
    });

    if (workoutName !== undefined && post.type === "WORKOUT") {
      await prisma.workoutDetail.update({
        where: { postId: id },
        data: { workoutName },
      });
    }
    if (mealName !== undefined && post.type === "MEAL") {
      await prisma.mealDetail.update({
        where: { postId: id },
        data: { mealName },
      });
    }
    if (activityType !== undefined && post.type === "WELLNESS") {
      await prisma.wellnessDetail.update({
        where: { postId: id },
        data: { activityType },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/posts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE /api/posts/[id] — Delete a post (author only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await safeAuth();
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
