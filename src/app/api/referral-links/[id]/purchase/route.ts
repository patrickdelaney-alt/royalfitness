import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/referral-links/[id]/purchase
//
// Stub endpoint — call this manually (or wire to a payment webhook) when a
// purchase is attributed to a referral link.  Payments are not live yet.
//
// Protected by x-purchase-secret header matching PURCHASE_WEBHOOK_SECRET env var.
// Body: { productName: string }
//
// On success, creates a REFERRAL_PURCHASE in-app notification for the link owner.
// Copy: "Someone used your {productName} link." — no emoji, no exclamation mark.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = process.env.PURCHASE_WEBHOOK_SECRET;
  const provided = req.headers.get("x-purchase-secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const link = await prisma.referralLink
    .findUnique({ where: { id }, select: { id: true, userId: true } })
    .catch(() => null);

  if (!link) {
    return NextResponse.json({ error: "Referral link not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const productName =
    typeof body.productName === "string" && body.productName.trim()
      ? body.productName.trim()
      : "your item";

  await prisma.notification.create({
    data: {
      type: "REFERRAL_PURCHASE",
      recipientId: link.userId,
      actorId: null, // buyer is anonymous
      referralLinkId: link.id,
      body: `Someone used your ${productName} link.`,
    },
  });

  return NextResponse.json({ ok: true });
}
