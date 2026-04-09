import { NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/referral-attribution
//
// Returns the referring user's handle if the current user arrived via a referral
// link and hasn't yet seen the welcome line ("You found Royal through @handle.").
// Marks welcomeShown = true on first successful fetch so the banner only shows once.
export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ attribution: null }, { status: 401 });
    }

    const attribution = await prisma.referralAttribution.findUnique({
      where: { newUserId: session.user.id },
      include: {
        referralLink: {
          include: {
            user: { select: { username: true } },
          },
        },
      },
    });

    if (!attribution || attribution.welcomeShown) {
      return NextResponse.json({ attribution: null });
    }

    // Mark shown — fire-and-forget so it doesn't delay the response
    prisma.referralAttribution
      .update({ where: { id: attribution.id }, data: { welcomeShown: true } })
      .catch(() => {});

    return NextResponse.json({
      attribution: {
        referringHandle: attribution.referralLink.user.username,
      },
    });
  } catch (error) {
    console.error("GET /api/referral-attribution error:", error);
    return NextResponse.json({ attribution: null });
  }
}
