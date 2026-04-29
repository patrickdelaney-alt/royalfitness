import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validations";

// GET /api/posts/[id]/comments — Get paginated comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const session = await safeAuth();
    const userId = session?.user?.id;

    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const skip = cursor ? Math.max(0, parseInt(cursor, 10)) : 0;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      50
    );

    // Verify the post exists and is accessible
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, visibility: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check visibility
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

    // Check if blocked
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

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        take: limit + 1,
        skip,
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      }),
      prisma.comment.count({ where: { postId } }),
    ]);

    let nextCursor: string | undefined;
    if (comments.length > limit) {
      comments.pop();
      nextCursor = String(skip + limit);
    }

    return NextResponse.json({
      comments,
      nextCursor,
      total,
    });
  } catch (error) {
    console.error("GET /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments — Create a comment on a post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the post exists (include author notification preference)
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        visibility: true,
        author: { select: { notifyOnComment: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check visibility permissions for commenting
    if (post.visibility === "PRIVATE" && post.authorId !== userId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.visibility === "FOLLOWERS" && post.authorId !== userId) {
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

    // Check if blocked
    if (userId !== post.authorId) {
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

    const comment = await prisma.comment.create({
      data: {
        text: parsed.data.text,
        authorId: userId,
        postId,
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    // Notify the post author (skip if own comment, skip if preference off)
    if (post.authorId !== userId && post.author.notifyOnComment) {
      try {
        await prisma.notification.create({
          data: {
            type: "COMMENT",
            recipientId: post.authorId,
            actorId: userId,
            postId,
          },
        });
      } catch (err) {
        console.error("Failed to create comment notification:", err);
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
