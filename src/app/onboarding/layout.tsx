import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";

export const dynamic = "force-dynamic";

const STEP_ORDER = ["welcome", "account", "profile", "follow", "first-post", "catalog", "royalties", "done"];

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();
  if (session?.user?.id) {
    const step = session.user.onboardingStep;
    if (step === "done") redirect("/feed");
    if (step && step !== "welcome" && STEP_ORDER.includes(step)) {
      redirect(`/onboarding/${step}`);
    }
  }
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      {children}
    </div>
  );
}
