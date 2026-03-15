import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
        instagramUrl: true,
        tiktokUrl: true,
        notifyOnLike: true,
        notifyOnComment: true,
        notifyOnFollow: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().optional(),
  isPrivate: z.boolean().optional(),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  tiktokUrl: z.string().url().optional().or(z.literal("")),
  notifyOnLike: z.boolean().optional(),
  notifyOnComment: z.boolean().optional(),
  notifyOnFollow: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
        ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
        ...(data.instagramUrl !== undefined && { instagramUrl: data.instagramUrl || null }),
        ...(data.tiktokUrl !== undefined && { tiktokUrl: data.tiktokUrl || null }),
        ...(data.notifyOnLike !== undefined && { notifyOnLike: data.notifyOnLike }),
        ...(data.notifyOnComment !== undefined && { notifyOnComment: data.notifyOnComment }),
        ...(data.notifyOnFollow !== undefined && { notifyOnFollow: data.notifyOnFollow }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
        instagramUrl: true,
        tiktokUrl: true,
        notifyOnLike: true,
        notifyOnComment: true,
        notifyOnFollow: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
