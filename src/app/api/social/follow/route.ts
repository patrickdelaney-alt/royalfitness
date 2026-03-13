import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// POST /api/social/follow - Follow a user (or send follow request if private)
export async function POST(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isPrivate: true, notifyOnFollow: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Check if there's already a pending follow request
    const existingRequest = await prisma.followRequest.findUnique({
      where: {
        senderId_targetId: {
          senderId: session.user.id,
          targetId: targetUserId,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Follow request already sent" },
        { status: 400 }
      );
    }

    // If target user is private, create a follow request
    if (targetUser.isPrivate) {
      const followRequest = await prisma.followRequest.create({
        data: {
          senderId: session.user.id,
          targetId: targetUserId,
        },
      });

      // Notify the target about the follow request (if preference is on)
      if (targetUser.notifyOnFollow) {
        await prisma.notification.create({
          data: {
            type: "FOLLOW_REQUEST",
            recipientId: targetUserId,
            actorId: session.user.id,
          },
        }).catch((err) => console.error("Failed to create follow request notification:", err));
      }

      return NextResponse.json(
        { followRequest, status: "requested" },
        { status: 201 }
      );
    }

    // If target user is public, create a follow directly
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    });

    // Notify the user about the new follower (if preference is on)
    if (targetUser.notifyOnFollow) {
      await prisma.notification.create({
        data: {
          type: "FOLLOW",
          recipientId: targetUserId,
          actorId: session.user.id,
        },
      }).catch((err) => console.error("Failed to create follow notification:", err));
    }

    return NextResponse.json(
      { follow, status: "following" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/social/follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/social/follow - Unfollow a user
export async function DELETE(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

    // Delete the follow record
    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "You are not following this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/social/follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
