import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = [
  "Spam or fake",
  "Inappropriate content",
  "Harassment or bullying",
  "False health information",
  "Other",
] as const;

// POST /api/posts/[id]/report — Report a post
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
    const reporterId = session.user.id;

    const body = await req.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || !VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create the report (allow multiple reports per user per post)
    await prisma.report.create({
      data: { reporterId, postId, reason },
    });

    return NextResponse.json({ reported: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
