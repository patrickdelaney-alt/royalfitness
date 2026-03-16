import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// POST /api/social/block — Block a user
export async function POST(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const blockerId = session.user.id;

    const { targetUserId } = await req.json();
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }
    if (targetUserId === blockerId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Check target exists
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert block (idempotent)
    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId: targetUserId } },
      create: { blockerId, blockedId: targetUserId },
      update: {},
    });

    // Also remove any existing follows between the two users
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: targetUserId },
          { followerId: targetUserId, followingId: blockerId },
        ],
      },
    });

    // Remove any pending follow requests in either direction
    await prisma.followRequest.deleteMany({
      where: {
        OR: [
          { senderId: blockerId, targetId: targetUserId },
          { senderId: targetUserId, targetId: blockerId },
        ],
      },
    });

    return NextResponse.json({ blocked: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/social/block error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/social/block — Unblock a user
export async function DELETE(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const blockerId = session.user.id;

    const { targetUserId } = await req.json();
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    await prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId: targetUserId },
    });

    return NextResponse.json({ blocked: false });
  } catch (error) {
    console.error("DELETE /api/social/block error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
