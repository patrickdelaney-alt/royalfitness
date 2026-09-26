/**
 * Decides where the onboarding layout should send a signed-in user.
 *
 * The layout used to redirect to `/onboarding/<step>` without knowing which
 * onboarding page was being requested, so a user whose saved step was e.g.
 * "follow" who loaded /onboarding/follow was redirected to /onboarding/follow
 * forever (ERR_TOO_MANY_REDIRECTS — a blank, stuck screen in the iOS app).
 * It only showed up after logging out and back in, because that's when the
 * session token picks up the saved step.
 */

export const ONBOARDING_STEPS = [
  "welcome",
  "account",
  "profile",
  "follow",
  "first-post",
  "catalog",
  "royalties",
  "done",
] as const;

/** Request header, set by src/proxy.ts, carrying the requested pathname. */
export const PATHNAME_HEADER = "x-royal-pathname";

/**
 * Returns the path to redirect to, or null to render the requested page.
 * Never returns `pathname` itself, and never redirects to another onboarding
 * page when the requested path is unknown, so it cannot loop.
 */
export function onboardingRedirect(
  step: string | null | undefined,
  pathname: string | null | undefined
): string | null {
  if (step === "done") return "/feed";
  if (!step || step === "welcome") return null;
  if (!(ONBOARDING_STEPS as readonly string[]).includes(step)) return null;
  if (!pathname) return null;

  const target = `/onboarding/${step}`;
  const current = pathname.replace(/\/+$/, "");
  return current === target ? null : target;
}
