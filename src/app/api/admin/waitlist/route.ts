// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";
import { WaitlistStatus } from "@prisma/client";

function isAdmin(email: string | null | undefined): boolean {
  return !!email && email === process.env.ADMIN_EMAIL;
}

// ─── GET /api/admin/waitlist ──────────────────────────────────────
// Query params: status (optional), limit (1-100), cursor (optional)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!isAdmin(session?.user?.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const statusFilter = searchParams.get("status") as WaitlistStatus | null;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100
    );

    const where = statusFilter ? { status: statusFilter } : {};

    const [entries, totalCount, countByStatus] = await Promise.all([
      prisma.waitlistUser.findMany({
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.waitlistUser.count({ where }),
      // Return counts per status so the admin UI can show badges
      prisma.waitlistUser.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    let nextCursor: string | undefined;
    if (entries.length > limit) {
      nextCursor = entries.pop()!.id;
    }

    const statusCounts: Record<string, number> = {};
    for (const row of countByStatus) {
      statusCounts[row.status] = row._count.status;
    }

    return NextResponse.json({ entries, nextCursor, totalCount, statusCounts });
  } catch (error) {
    console.error("GET /api/admin/waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/admin/waitlist ────────────────────────────────────
// Body: { id: string, action: "approve" | "mark_invited" | "activate" }
const patchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "mark_invited", "activate"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!isAdmin(session?.user?.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action } = patchSchema.parse(body);

    let updateData: {
      status: WaitlistStatus;
      approvedAt?: Date;
      inviteSentAt?: Date;
    };

    switch (action) {
      case "approve":
        updateData = { status: "APPROVED", approvedAt: new Date() };
        break;
      case "mark_invited":
        updateData = { status: "INVITED", inviteSentAt: new Date() };
        break;
      case "activate":
        updateData = { status: "ACTIVATED" };
        break;
    }

    const updated = await prisma.waitlistUser.update({
      where: { id },
      data: updateData,
    });

    // Fire the invite email placeholder when marking as invited
    if (action === "mark_invited") {
      await sendInviteEmail(updated.email, updated.firstName);
    }

    return NextResponse.json({ entry: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}
