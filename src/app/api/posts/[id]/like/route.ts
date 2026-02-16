import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/posts/[id]/like — Toggle like (create if not exists)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Verify the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, visibility: true },
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
    const session = await auth();
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
