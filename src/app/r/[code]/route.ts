import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /r/[code]
// Public redirect endpoint for referral links.
// 1. Increments the link's click count.
// 2. Sets a _royal_ref cookie so attribution can be claimed at signup.
// 3. Redirects to the linked post or the feed.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || typeof code !== "string") {
    return NextResponse.redirect(new URL("/feed", _req.url));
  }

  const link = await prisma.referralLink
    .findUnique({ where: { id: code }, select: { id: true, sourceType: true, sourceId: true } })
    .catch(() => null);

  if (!link) {
    return NextResponse.redirect(new URL("/feed", _req.url));
  }

  // Increment click count — fire-and-forget, don't block the redirect
  prisma.referralLink
    .update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } })
    .catch(() => {});

  const destination =
    link.sourceType === "post"
      ? new URL(`/posts/${link.sourceId}`, _req.url)
      : new URL("/feed", _req.url);

  const response = NextResponse.redirect(destination, { status: 307 });

  // Store the referral code for attribution at signup (7 days)
  response.cookies.set("_royal_ref", link.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
