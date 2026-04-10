import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

const SOURCE_TYPES = ["post", "catalog_item", "profile"] as const;
type SourceType = (typeof SOURCE_TYPES)[number];

// POST /api/referral-links
// Creates a referral link for a post or catalog item.
// Returns { id, url } — the url is the /r/<id> redirect endpoint.
export async function POST(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { sourceType, sourceId } = body as {
      sourceType: unknown;
      sourceId: unknown;
    };

    if (
      typeof sourceType !== "string" ||
      !SOURCE_TYPES.includes(sourceType as SourceType)
    ) {
      return NextResponse.json(
        { error: "sourceType must be 'post', 'catalog_item', or 'profile'" },
        { status: 400 }
      );
    }

    if (typeof sourceId !== "string" || sourceId.trim().length === 0) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    // Return an existing link for the same user + source to avoid duplicates
    const existing = await prisma.referralLink.findFirst({
      where: { userId, sourceType, sourceId: sourceId.trim() },
      select: { id: true },
    });

    const linkId = existing
      ? existing.id
      : (
          await prisma.referralLink.create({
            data: { userId, sourceType, sourceId: sourceId.trim() },
            select: { id: true },
          })
        ).id;

    const base =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

    return NextResponse.json(
      { id: linkId, url: `${base}/r/${linkId}` },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    console.error("POST /api/referral-links error:", error);
    return NextResponse.json(
      { error: "Failed to create referral link" },
      { status: 500 }
    );
  }
}
