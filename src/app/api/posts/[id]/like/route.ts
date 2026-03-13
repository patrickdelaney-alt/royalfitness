import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// POST /api/posts/[id]/like — Toggle like (create if not exists)
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

    // Verify the post exists (include author's notification preference)
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        visibility: true,
        author: { select: { notifyOnLike: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      // Already liked — return the existing like
      const likesCount = await prisma.like.count({ where: { postId } });
      return NextResponse.json({
        liked: true,
        likesCount,
      });
    }

    // Create the like
    await prisma.like.create({
      data: { userId, postId },
    });

    // Notify the post author (skip if liking own post, skip if preference off, skip if already notified)
    if (post.authorId !== userId && post.author.notifyOnLike) {
      try {
        const existingNotification = await prisma.notification.findFirst({
          where: { type: "LIKE", actorId: userId, postId },
        });
        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              type: "LIKE",
              recipientId: post.authorId,
              actorId: userId,
              postId,
            },
          });
        }
      } catch (err) {
        console.error("Failed to create like notification:", err);
      }
    }

    const likesCount = await prisma.like.count({ where: { postId } });

    return NextResponse.json(
      { liked: true, likesCount },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/posts/[id]/like error:", error);
    return NextResponse.json(
      { error: "Failed to like post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id]/like — Remove like
export async function DELETE(
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

    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: "Like not found" },
        { status: 404 }
      );
    }

    await prisma.like.delete({
      where: {
        userId_postId: { userId, postId },
      },
    });

    const likesCount = await prisma.like.count({ where: { postId } });

    return NextResponse.json({ liked: false, likesCount });
  } catch (error) {
    console.error("DELETE /api/posts/[id]/like error:", error);
    return NextResponse.json(
      { error: "Failed to unlike post" },
      { status: 500 }
    );
  }
}
