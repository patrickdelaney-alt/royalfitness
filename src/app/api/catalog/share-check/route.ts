import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { CATALOG_ITEM_TYPES } from "@/lib/validations";

// GET /api/catalog/share-check?itemId=xxx&itemType=AFFILIATE
// Returns whether the authenticated user can share this catalog item today.
// Called by the ShareCatalogModal on open to pre-check cooldown status.
export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = req.nextUrl;
    const itemId = searchParams.get("itemId");
    const itemType = searchParams.get("itemType");

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: "itemId and itemType are required" },
        { status: 400 }
      );
    }

    if (!CATALOG_ITEM_TYPES.includes(itemType as (typeof CATALOG_ITEM_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid itemType" },
        { status: 400 }
      );
    }

    // ── Cooldown check ────────────────────────────────────────────────────────
    // Current rule: one share per user per catalog item per UTC calendar day.
    //
    // To change to a rolling 24-hour window, replace the sharedDate query with:
    //   createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    //
    // To change to a 3-day cooldown, use:
    //   createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
    //
    // To add max-N-per-day: count records for userId+sharedDate and compare to N.
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.catalogShareCooldown.findFirst({
      where: {
        userId,
        catalogItemId: itemId,
        catalogItemType: itemType as (typeof CATALOG_ITEM_TYPES)[number],
        sharedDate: todayUTC,
      },
      select: { createdAt: true },
    });

    return NextResponse.json({
      canShare: !existing,
      alreadySharedToday: !!existing,
      // Convenience: when was it last shared (if applicable)
      lastSharedAt: existing?.createdAt ?? null,
    });
  } catch (error) {
    console.error("GET /api/catalog/share-check error:", error);
    return NextResponse.json(
      { error: "Failed to check share status" },
      { status: 500 }
    );
  }
}
