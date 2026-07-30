/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "@/app/r/[code]/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    referralLink: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

const findUnique = prisma.referralLink.findUnique as jest.Mock;
const update = prisma.referralLink.update as jest.Mock;

const APP_STORE = "https://apps.apple.com/us/app/royal-fitness-wellness/id6759988491";

function request() {
  return new NextRequest("https://royalwellness.app/r/link-1");
}

function params(code: string) {
  return { params: Promise.resolve({ code }) };
}

describe("GET /r/[code]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    update.mockResolvedValue({});
  });

  it("sends post referrals to the post, so the link previews and shows content", async () => {
    findUnique.mockResolvedValue({ id: "link-1", sourceType: "post", sourceId: "post-9" });

    const res = await GET(request(), params("link-1"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://royalwellness.app/p/post-9");
    expect(res.cookies.get("_royal_ref")?.value).toBe("link-1");
    expect(res.cookies.get("_royal_ref")?.httpOnly).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { clickCount: { increment: 1 } },
    });
  });

  it("keeps sending other referral types to the App Store", async () => {
    findUnique.mockResolvedValue({
      id: "link-1",
      sourceType: "profile",
      sourceId: "user-3",
    });

    const res = await GET(request(), params("link-1"));

    expect(res.headers.get("location")).toBe(APP_STORE);
    expect(res.cookies.get("_royal_ref")?.value).toBe("link-1");
  });

  it("sets no cookie for an unknown code", async () => {
    findUnique.mockResolvedValue(null);

    const res = await GET(request(), params("nope"));

    expect(res.headers.get("location")).toBe(APP_STORE);
    expect(res.cookies.get("_royal_ref")).toBeUndefined();
    expect(update).not.toHaveBeenCalled();
  });
});
