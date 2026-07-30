/** @jest-environment node */

import { claimReferral } from "@/lib/referral";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    referralLink: { findUnique: jest.fn() },
    referralAttribution: { create: jest.fn() },
    follow: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const findUnique = prisma.referralLink.findUnique as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;

describe("claimReferral", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockResolvedValue([]);
  });

  it("records the attribution and follows the referrer", async () => {
    findUnique.mockResolvedValue({ id: "link-1", userId: "referrer" });

    await expect(claimReferral("new-user", "link-1")).resolves.toBe(true);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(prisma.referralAttribution.create).toHaveBeenCalledWith({
      data: { referralLinkId: "link-1", newUserId: "new-user" },
    });
    expect(prisma.follow.create).toHaveBeenCalledWith({
      data: { followerId: "new-user", followingId: "referrer" },
    });
  });

  it("ignores a missing code", async () => {
    await expect(claimReferral("new-user", null)).resolves.toBe(false);
    await expect(claimReferral("new-user", "   ")).resolves.toBe(false);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("pays nobody for referring themselves", async () => {
    findUnique.mockResolvedValue({ id: "link-1", userId: "new-user" });
    await expect(claimReferral("new-user", "link-1")).resolves.toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("never throws when the write fails — the account still gets created", async () => {
    findUnique.mockResolvedValue({ id: "link-1", userId: "referrer" });
    transaction.mockRejectedValue(new Error("unique constraint"));
    await expect(claimReferral("new-user", "link-1")).resolves.toBe(false);
  });
});
