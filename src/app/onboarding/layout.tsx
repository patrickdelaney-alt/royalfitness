import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { onboardingRedirect, PATHNAME_HEADER } from "@/lib/onboarding-guard";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();
  if (session?.user?.id) {
    // The token's onboardingStep is only set at sign-in, so it goes stale as
    // the user advances. Prefer the saved step; fall back to the token.
    let step = session.user.onboardingStep;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingStep: true },
      });
      if (dbUser) step = dbUser.onboardingStep;
    } catch {
      // keep the token's step
    }
    const target = onboardingRedirect(step, (await headers()).get(PATHNAME_HEADER));
    if (target) redirect(target);
  }
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      {children}
    </div>
  );
}
