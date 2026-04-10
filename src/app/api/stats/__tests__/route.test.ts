/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/stats/route";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/safe-auth", () => ({
  safeAuth: jest.fn(),
}));

jest.mock("@/lib/user-stats", () => ({
  getOrRefreshStreaks: jest.fn().mockResolvedValue({ currentStreak: 0, workoutStreak: 0 }),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    exerciseSet: {
      aggregate: jest.fn(),
    },
    wellnessDetail: {
      aggregate: jest.fn(),
    },
    workoutDetail: {
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock("@/lib/timezone", () => ({
  safeTimeZone: jest.fn(() => "UTC"),
  getUserToday: jest.fn(() => "2026-03-23"),
  midnightInTzToUTC: jest.fn(() => new Date("2026-03-23T00:00:00.000Z")),
  utcToLocalDateStr: jest.fn(() => "2026-03-23"),
  getDayName: jest.fn(() => "Mon"),
  getMonday: jest.fn(() => "2026-03-23"),
  getWeekDays: jest.fn(() => [
    "2026-03-23",
    "2026-03-24",
    "2026-03-25",
    "2026-03-26",
    "2026-03-27",
    "2026-03-28",
    "2026-03-29",
  ]),
  getMonthStart: jest.fn(() => "2026-03-01"),
  getYearStart: jest.fn(() => "2026-01-01"),
  addDaysToDateStr: jest.fn(() => "2026-03-30"),
}));

const mockedSafeAuth = safeAuth as jest.MockedFunction<typeof safeAuth>;
const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock };
  post: { findMany: jest.Mock };
  exerciseSet: { aggregate: jest.Mock };
  wellnessDetail: { aggregate: jest.Mock };
  workoutDetail: { aggregate: jest.Mock };
  $queryRaw: jest.Mock;
};

describe("GET /api/stats access control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@royalfitness.com";

    mockedPrisma.user.findUnique.mockReset();
    mockedPrisma.post.findMany.mockReset();
    mockedPrisma.exerciseSet.aggregate.mockReset();
    mockedPrisma.wellnessDetail.aggregate.mockReset();
    mockedPrisma.workoutDetail.aggregate.mockReset();
    mockedPrisma.$queryRaw.mockReset();

    // Period posts and weekly posts both return empty arrays
    mockedPrisma.post.findMany.mockResolvedValue([]);
    mockedPrisma.exerciseSet.aggregate.mockResolvedValue({ _count: { id: 0 } });
    // Volume raw SQL returns zero
    mockedPrisma.$queryRaw.mockResolvedValue([{ total: null }]);

    mockedPrisma.wellnessDetail.aggregate
      .mockResolvedValueOnce({ _sum: { durationMinutes: 0 } })
      .mockResolvedValueOnce({ _avg: { moodAfter: null }, _count: { moodAfter: 0 } });

    mockedPrisma.workoutDetail.aggregate.mockResolvedValue({
      _avg: { moodAfter: null },
      _count: { moodAfter: 0 },
    });
  });

  it("Case A: returns own stats for an authenticated user when no userId is provided", async () => {
    mockedSafeAuth.mockResolvedValue({
      user: { id: "self-user", email: "self@royalfitness.com" },
      expires: "2099-01-01",
    } as never);

    const req = new NextRequest("http://localhost:3000/api/stats?period=week");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.userId).toBe("self-user");
    expect(mockedPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ authorId: "self-user" }),
      })
    );
  });

  it("Case B: returns 403 when an authenticated user requests a different private user's stats", async () => {
    mockedSafeAuth.mockResolvedValue({
      user: { id: "self-user", email: "self@royalfitness.com" },
      expires: "2099-01-01",
    } as never);
    mockedPrisma.user.findUnique.mockResolvedValue({ isPrivate: true });

    const req = new NextRequest(
      "http://localhost:3000/api/stats?period=week&userId=other-user"
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "other-user" },
      select: { isPrivate: true },
    });
  });

  it("Case C: returns 401 for an unauthenticated request", async () => {
    mockedSafeAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/stats?period=week");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
