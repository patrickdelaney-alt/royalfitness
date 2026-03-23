/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/health/route";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/safe-auth", () => ({
  safeAuth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: jest.fn(),
    },
  },
}));

const mockedSafeAuth = safeAuth as jest.MockedFunction<typeof safeAuth>;
const mockedPrisma = prisma as unknown as {
  user: { count: jest.Mock };
};

describe("GET /api/health", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalHealthDiagnosticsEnabled = process.env.HEALTH_DIAGNOSTICS_ENABLED;
  const originalHealthToken = process.env.HEALTH_INTERNAL_TOKEN;
  const originalAdminEmail = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "development";
    process.env.HEALTH_DIAGNOSTICS_ENABLED = "true";
    process.env.HEALTH_INTERNAL_TOKEN = "internal-secret";
    process.env.ADMIN_EMAIL = "admin@royalfitness.com";
    mockedPrisma.user.count.mockResolvedValue(1);
    mockedSafeAuth.mockResolvedValue(null);
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.HEALTH_DIAGNOSTICS_ENABLED = originalHealthDiagnosticsEnabled;
    process.env.HEALTH_INTERNAL_TOKEN = originalHealthToken;
    process.env.ADMIN_EMAIL = originalAdminEmail;
  });

  it("returns minimal public response for unauthenticated requests", async () => {
    const req = new NextRequest("http://localhost:3000/api/health");

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
    expect(body).not.toHaveProperty("diagnostics");
    expect(mockedPrisma.user.count).not.toHaveBeenCalled();
  });

  it("returns controlled diagnostics for valid internal token requests", async () => {
    const req = new NextRequest("http://localhost:3000/api/health", {
      headers: { "x-health-token": "internal-secret" },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      diagnostics: {
        db_status: "ok",
      },
    });
    expect(mockedPrisma.user.count).toHaveBeenCalledTimes(1);
    expect(mockedSafeAuth).not.toHaveBeenCalled();
  });

  it("never exposes diagnostics in production even when authorized", async () => {
    process.env.NODE_ENV = "production";

    const req = new NextRequest("http://localhost:3000/api/health", {
      headers: { "x-health-token": "internal-secret" },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
    expect(body).not.toHaveProperty("diagnostics");
    expect(mockedPrisma.user.count).not.toHaveBeenCalled();
  });
});
