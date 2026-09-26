/**
 * @jest-environment node
 */
import SignUpPage from "../page";
import { safeAuth } from "@/lib/safe-auth";
import { redirect } from "next/navigation";

jest.mock("@/lib/safe-auth", () => ({ safeAuth: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
jest.mock("../SignUpClient", () => ({
  __esModule: true,
  default: () => null,
}));

const mockSafeAuth = safeAuth as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;

/** Renders the page; returns the redirect target, or null if it rendered. */
async function run(): Promise<string | null> {
  try {
    await SignUpPage();
    return null;
  } catch (e) {
    const m = String((e as Error).message).match(/^NEXT_REDIRECT:(.*)$/);
    if (m) return m[1];
    throw e;
  }
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SignUpPage", () => {
  it("redirects an already-signed-in user to /feed instead of showing the form again", async () => {
    mockSafeAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" });
    expect(await run()).toBe("/feed");
    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });

  it("renders the sign-up form for a signed-out visitor", async () => {
    mockSafeAuth.mockResolvedValue(null);
    expect(await run()).toBeNull();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
