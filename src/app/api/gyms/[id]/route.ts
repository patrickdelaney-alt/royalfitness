import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const gym = await prisma.gym.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: { select: { comments: true, likes: true } },
          },
        },
      },
    });

    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const membership = await prisma.gymMembership.findUnique({
      where: {
        userId_gymId: {
          userId: session.user.id,
          gymId: id,
        },
      },
    });

    return NextResponse.json({
      ...gym,
      isMember: !!membership,
      myRole: membership?.role ?? null,
    });
  } catch (error) {
    console.error("GET /api/gyms/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
