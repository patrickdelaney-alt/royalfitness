// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[username] - Get user profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await safeAuth();
    const currentUserId = session?.user?.id;

    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
        instagramUrl: true,
        tiktokUrl: true,
        createdAt: true,
        notifyOnLike: true,
        notifyOnComment: true,
        notifyOnFollow: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }


    // Respect blocking relationship in either direction
    if (currentUserId && currentUserId !== user.id) {
      const blocked = await prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: currentUserId, blockedId: user.id },
            { blockerId: user.id, blockedId: currentUserId },
          ],
        },
      });

      if (blocked) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Check if current user follows this user
    let isFollowing = false;
    let hasRequestedFollow = false;

    if (currentUserId && currentUserId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;

      if (!isFollowing) {
        const followRequest = await prisma.followRequest.findUnique({
          where: {
            senderId_targetId: {
              senderId: currentUserId,
              targetId: user.id,
            },
          },
        });
        hasRequestedFollow = !!followRequest;
      }
    }

    const isOwnProfile = currentUserId === user.id;

    // Determine if we should include posts
    // Show posts if: it's the user's own profile, the profile is public, or the current user follows them
    const canViewPosts = isOwnProfile || !user.isPrivate || isFollowing;

    let recentPosts: unknown[] = [];

    if (canViewPosts) {
      const postWhere: Prisma.PostWhereInput = {
        authorId: user.id,
      };

      if (!isOwnProfile) {
        postWhere.visibility = isFollowing
          ? { in: ["PUBLIC", "FOLLOWERS"] }
          : "PUBLIC";
      }

      recentPosts = await prisma.post.findMany({
        where: postWhere,
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          type: true,
          caption: true,
          mediaUrl: true,
          visibility: true,
          tags: true,
          createdAt: true,
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      user: {
        ...user,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        _count: undefined,
        // Only expose notification prefs on own profile
        ...(!isOwnProfile && {
          notifyOnLike: undefined,
          notifyOnComment: undefined,
          notifyOnFollow: undefined,
        }),
      },
      isFollowing,
      hasRequestedFollow,
      isOwnProfile,
      recentPosts,
    });
  } catch (error) {
    console.error("Error in GET /api/users/[username]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
