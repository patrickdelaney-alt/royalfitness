import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const gym = await prisma.gym.findUnique({ where: { id } });
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const existing = await prisma.gymMembership.findUnique({
      where: {
        userId_gymId: {
          userId: session.user.id,
          gymId: id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already a member" },
        { status: 409 }
      );
    }

    const membership = await prisma.gymMembership.create({
      data: {
        userId: session.user.id,
        gymId: id,
        role: "MEMBER",
      },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("POST /api/gyms/[id]/membership error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const membership = await prisma.gymMembership.findUnique({
      where: {
        userId_gymId: {
          userId: session.user.id,
          gymId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member" },
        { status: 404 }
      );
    }

    await prisma.gymMembership.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/gyms/[id]/membership error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
