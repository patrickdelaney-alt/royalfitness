import { NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications/unread-count — Lightweight count for badge
export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.notification.count({
      where: { recipientId: session.user.id, read: false },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET /api/notifications/unread-count error:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
