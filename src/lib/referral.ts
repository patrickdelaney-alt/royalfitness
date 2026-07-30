import { prisma } from "@/lib/prisma";

/** Cookie set by /r/[code] when someone opens a referral link. httpOnly, so it
 *  can only be read server-side — which is why every signup path has to claim it
 *  explicitly. */
export const REFERRAL_COOKIE = "_royal_ref";

/**
 * Record that `userId` signed up through `refCode`, and follow the referrer.
 *
 * Returns true when an attribution was written. Never throws: a failed claim
 * must not block account creation. Safe to call twice — the unique constraint on
 * newUserId makes the second call a no-op.
 */
export async function claimReferral(
  userId: string,
  refCode?: string | null,
): Promise<boolean> {
  const code = typeof refCode === "string" ? refCode.trim() : "";
  if (!code || code.length > 50) return false;

  try {
    const link = await prisma.referralLink.findUnique({
      where: { id: code },
      select: { id: true, userId: true },
    });
    // Self-referral earns nothing.
    if (!link || link.userId === userId) return false;

    await prisma.$transaction([
      prisma.referralAttribution.create({
        data: { referralLinkId: link.id, newUserId: userId },
      }),
      prisma.follow.create({
        data: { followerId: userId, followingId: link.userId },
      }),
    ]);
    return true;
  } catch {
    // Already attributed, already following, or the DB is unhappy — either way,
    // the account itself is fine.
    return false;
  }
}
