import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /r/[code]
// Public redirect endpoint for referral links.
// 1. Increments the link's click count.
// 2. Sets a _royal_ref cookie so attribution can be claimed at signup.
// 3. Sends post referrals to the post itself — it has an OG image and a "Join
//    Free" CTA, so the link previews properly and the visitor sees something
//    before being asked to install. Everything else goes to the App Store.

const APP_STORE_URL =
  process.env.APP_STORE_URL?.replace(/\/$/, "") ??
  "https://apps.apple.com/us/app/royal-fitness-wellness/id6759988491";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || typeof code !== "string") {
    return NextResponse.redirect(APP_STORE_URL);
  }

  const link = await prisma.referralLink
    .findUnique({
      where: { id: code },
      select: { id: true, sourceType: true, sourceId: true },
    })
    .catch(() => null);

  if (!link) {
    return NextResponse.redirect(APP_STORE_URL);
  }

  // Increment click count — fire-and-forget, don't block the redirect
  prisma.referralLink
    .update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } })
    .catch(() => {});

  const destination =
    link.sourceType === "post" && link.sourceId
      ? new URL(`/p/${link.sourceId}`, req.nextUrl.origin).toString()
      : APP_STORE_URL;

  const response = NextResponse.redirect(destination, { status: 307 });

  // Store the referral code for attribution at signup (7 days). Same-origin for
  // the post destination, so it survives all the way to /signup.
  response.cookies.set("_royal_ref", link.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
