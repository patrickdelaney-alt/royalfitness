import { onboardingRedirect, ONBOARDING_STEPS } from "../onboarding-guard";

describe("onboardingRedirect", () => {
  it("never redirects a page to itself (the logout → login loop)", () => {
    for (const step of ONBOARDING_STEPS) {
      if (step === "done") continue;
      const target = onboardingRedirect(step, `/onboarding/${step}`);
      expect(target).not.toBe(`/onboarding/${step}`);
      expect(target).toBeNull();
    }
  });

  it("treats a trailing slash as the same page", () => {
    expect(onboardingRedirect("follow", "/onboarding/follow/")).toBeNull();
  });

  it("resumes at the saved step from another onboarding page", () => {
    // iOS "Continue with Google" on /signup lands on /onboarding/profile
    expect(onboardingRedirect("follow", "/onboarding/profile")).toBe("/onboarding/follow");
    expect(onboardingRedirect("catalog", "/onboarding/account")).toBe("/onboarding/catalog");
  });

  it("sends users who finished onboarding to the feed", () => {
    expect(onboardingRedirect("done", "/onboarding/profile")).toBe("/feed");
    expect(onboardingRedirect("done", null)).toBe("/feed");
  });

  it("lets new users (no step / welcome) stay on the requested page", () => {
    expect(onboardingRedirect(null, "/onboarding/profile")).toBeNull();
    expect(onboardingRedirect(undefined, "/onboarding/profile")).toBeNull();
    expect(onboardingRedirect("welcome", "/onboarding/account")).toBeNull();
  });

  it("ignores unknown steps", () => {
    expect(onboardingRedirect("bogus", "/onboarding/profile")).toBeNull();
  });

  it("does not redirect between onboarding pages when the path is unknown", () => {
    expect(onboardingRedirect("follow", null)).toBeNull();
    expect(onboardingRedirect("follow", "")).toBeNull();
  });
});
