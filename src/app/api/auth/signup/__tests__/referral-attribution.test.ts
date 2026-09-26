/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/signup/route";
import { prisma } from "@/lib/prisma";

// /r/<code> sets a _royal_ref cookie; signup must honour it when the client
// doesn't send refCode, otherwise the referral is silently dropped.

jest.mock("bcryptjs", () => ({ __esModule: true, default: { hash: jest.fn(() => Promise.resolve("hash")) } }));
jest.mock("@/lib/email", () => ({ sendWelcomeEmail: jest.fn(() => Promise.resolve()) }));
jest.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }) }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn(), count: jest.fn(), update: jest.fn() },
    foundingMemberInvite: { create: jest.fn() },
    referralLink: { findUnique: jest.fn() },
    referralAttribution: { create: jest.fn((args) => ({ op: "attribution", args })) },
    follow: { create: jest.fn((args) => ({ op: "follow", args })) },
    $transaction: jest.fn(() => Promise.resolve([])),
  },
}));

const p = prisma as unknown as {
  user: { findUnique: jest.Mock; create: jest.Mock; count: jest.Mock };
  referralLink: { findUnique: jest.Mock };
  referralAttribution: { create: jest.Mock };
  follow: { create: jest.Mock };
  $transaction: jest.Mock;
};

const form = { name: "New", username: "newuser", email: "new@example.com", password: "secret1" };

function signup(body: Record<string, unknown>, cookie?: string) {
  return new NextRequest("https://royalwellness.app/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: cookie ? { cookie } : {},
  });
}

describe("POST /api/auth/signup — referral attribution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.WAITLIST_GATE_ENABLED;
    p.user.findUnique.mockResolvedValue(null);
    p.user.create.mockResolvedValue({ id: "new-user", username: "newuser", email: "new@example.com" });
    p.user.count.mockResolvedValue(1000); // founding-member cap reached
    p.referralLink.findUnique.mockResolvedValue({ id: "code123", userId: "referrer" });
  });

  it("attributes from the _royal_ref cookie when no refCode is posted", async () => {
    const res = await POST(signup(form, "_royal_ref=code123"));

    expect(res.status).toBe(201);
    expect(p.referralLink.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "code123" } }),
    );
    expect(p.referralAttribution.create).toHaveBeenCalledWith({
      data: { referralLinkId: "code123", newUserId: "new-user" },
    });
    expect(p.follow.create).toHaveBeenCalledWith({
      data: { followerId: "new-user", followingId: "referrer" },
    });
    expect(p.$transaction).toHaveBeenCalledTimes(1);
  });

  it("prefers an explicit refCode over the cookie", async () => {
    await POST(signup({ ...form, refCode: "explicit" }, "_royal_ref=code123"));
    expect(p.referralLink.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "explicit" } }),
    );
  });

  it("does nothing when there is no referral code at all", async () => {
    const res = await POST(signup(form));
    expect(res.status).toBe(201);
    expect(p.referralLink.findUnique).not.toHaveBeenCalled();
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it("does not self-attribute", async () => {
    p.referralLink.findUnique.mockResolvedValue({ id: "code123", userId: "new-user" });
    await POST(signup(form, "_royal_ref=code123"));
    expect(p.$transaction).not.toHaveBeenCalled();
  });
});
