import { referralUrl } from "@/lib/referral-url";

describe("referralUrl", () => {
  it("builds an absolute, openable referral URL", () => {
    expect(referralUrl("cmuijywp0000004l3ufy9mosd")).toBe(
      "https://royalwellness.app/r/cmuijywp0000004l3ufy9mosd",
    );
  });

  it("never returns a relative path", () => {
    expect(referralUrl("abc")).toMatch(/^https:\/\/[^/]+\/r\/abc$/);
  });
});
