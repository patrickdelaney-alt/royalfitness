/**
 * @jest-environment node
 */
import OnboardingLayout from "../layout";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

jest.mock("@/lib/safe-auth", () => ({ safeAuth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: jest.fn() } } }));
jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const mockSafeAuth = safeAuth as jest.Mock;
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockHeaders = headers as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;

function signedIn(tokenStep: string | null) {
  mockSafeAuth.mockResolvedValue({
    user: { id: "u1", username: "u", onboardingStep: tokenStep },
    expires: "",
  });
}

function requesting(pathname: string) {
  mockHeaders.mockResolvedValue(new Headers({ "x-royal-pathname": pathname }));
}

/** Renders the layout; returns the redirect target, or null if it rendered. */
async function run(): Promise<string | null> {
  try {
    await OnboardingLayout({ children: null });
    return null;
  } catch (e) {
    const m = String((e as Error).message).match(/^NEXT_REDIRECT:(.*)$/);
    if (m) return m[1];
    throw e;
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFindUnique.mockResolvedValue(null);
});

describe("onboarding layout guard", () => {
  it("renders the saved step's page after logout → login instead of redirecting to itself", async () => {
    // After re-login the JWT carries the saved step, which used to 307 loop.
    signedIn("follow");
    mockFindUnique.mockResolvedValue({ onboardingStep: "follow" });
    requesting("/onboarding/follow");
    expect(await run()).toBeNull();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects exactly once to the saved step (Google sign-up callback lands on /onboarding/profile)", async () => {
    signedIn("follow");
    mockFindUnique.mockResolvedValue({ onboardingStep: "follow" });
    requesting("/onboarding/profile");
    expect(await run()).toBe("/onboarding/follow");

    // Following that redirect must render, not redirect again.
    requesting("/onboarding/follow");
    expect(await run()).toBeNull();
  });

  it("uses the saved step over a stale token step", async () => {
    // Token says "follow" (set at sign-in); user has since advanced to "catalog".
    signedIn("follow");
    mockFindUnique.mockResolvedValue({ onboardingStep: "catalog" });
    requesting("/onboarding/catalog");
    expect(await run()).toBeNull();

    mockFindUnique.mockResolvedValue({ onboardingStep: "done" });
    expect(await run()).toBe("/feed");
  });

  it("falls back to the token step if the DB read fails", async () => {
    signedIn("follow");
    mockFindUnique.mockRejectedValue(new Error("db down"));
    requesting("/onboarding/follow");
    expect(await run()).toBeNull();
    requesting("/onboarding/profile");
    expect(await run()).toBe("/onboarding/follow");
  });

  it("lets a brand-new account continue onboarding", async () => {
    signedIn(null);
    mockFindUnique.mockResolvedValue({ onboardingStep: null });
    requesting("/onboarding/profile");
    expect(await run()).toBeNull();
  });

  it("renders for signed-out visitors without touching the DB", async () => {
    mockSafeAuth.mockResolvedValue(null);
    requesting("/onboarding/profile");
    expect(await run()).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});
