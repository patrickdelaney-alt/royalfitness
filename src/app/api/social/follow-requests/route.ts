// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/social/follow-requests - Get pending follow requests for the current user
export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followRequests = await prisma.followRequest.findMany({
      where: {
        targetId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ followRequests });
  } catch (error) {
    console.error("Error in GET /api/social/follow-requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/social/follow-requests - Accept a follow request
export async function POST(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await req.json();

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    // Find the follow request and verify it belongs to the current user
    const followRequest = await prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!followRequest) {
      return NextResponse.json(
        { error: "Follow request not found" },
        { status: 404 }
      );
    }

    if (followRequest.targetId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only accept your own follow requests" },
        { status: 403 }
      );
    }

    // Use a transaction to delete the request and create the follow
    const follow = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.followRequest.delete({
        where: { id: requestId },
      });

      return tx.follow.create({
        data: {
          followerId: followRequest.senderId,
          followingId: session.user.id,
        },
      });
    });

    // Notify the requester that their follow request was accepted
    await prisma.notification.create({
      data: {
        type: "FOLLOW",
        recipientId: followRequest.senderId,
        actorId: session.user.id,
      },
    }).catch((err) => console.error("Failed to create follow-accept notification:", err));

    return NextResponse.json({ follow, message: "Follow request accepted" });
  } catch (error) {
    console.error("Error in POST /api/social/follow-requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/social/follow-requests - Reject a follow request
export async function DELETE(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await req.json();

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    // Find the follow request and verify it belongs to the current user
    const followRequest = await prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!followRequest) {
      return NextResponse.json(
        { error: "Follow request not found" },
        { status: 404 }
      );
    }

    if (followRequest.targetId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only reject your own follow requests" },
        { status: 403 }
      );
    }

    await prisma.followRequest.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ message: "Follow request rejected" });
  } catch (error) {
    console.error("Error in DELETE /api/social/follow-requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
