/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/referral-links/route";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/safe-auth", () => ({ safeAuth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    referralLink: { findFirst: jest.fn(), create: jest.fn() },
  },
}));

const mockedSafeAuth = safeAuth as jest.MockedFunction<typeof safeAuth>;
const mockedPrisma = prisma as unknown as {
  referralLink: { findFirst: jest.Mock; create: jest.Mock };
};

function post(body: unknown) {
  return new NextRequest("https://royalwellness.app/api/referral-links", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/referral-links", () => {
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    // Production had NEXTAUTH_URL unset, which produced "/r/<id>".
    delete process.env.NEXTAUTH_URL;
    mockedSafeAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  afterAll(() => {
    if (originalNextAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = originalNextAuthUrl;
  });

  it("returns an absolute URL for a new link even when NEXTAUTH_URL is unset", async () => {
    mockedPrisma.referralLink.findFirst.mockResolvedValue(null);
    mockedPrisma.referralLink.create.mockResolvedValue({ id: "newcode" });

    const res = await POST(post({ sourceType: "profile", sourceId: "user-1" }));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "newcode", url: "https://royalwellness.app/r/newcode" });
  });

  it("returns an absolute URL when reusing an existing link", async () => {
    mockedPrisma.referralLink.findFirst.mockResolvedValue({ id: "cmuijywp0000004l3ufy9mosd" });

    const res = await POST(post({ sourceType: "post", sourceId: "post-1" }));

    expect(res.status).toBe(200);
    expect((await res.json()).url).toBe("https://royalwellness.app/r/cmuijywp0000004l3ufy9mosd");
    expect(mockedPrisma.referralLink.create).not.toHaveBeenCalled();
  });
});
