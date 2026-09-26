import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";
import SignUpClient from "./SignUpClient";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  // Same as /signin — an already-signed-in user shouldn't see the signup
  // form again (see src/app/page.tsx for the same check on the root page).
  const session = await safeAuth();
  if (session?.user?.id) {
    redirect("/feed");
  }

  return (
    <SignUpClient
      appleEnabled={!!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET}
      googleIosClientId={process.env.GOOGLE_IOS_CLIENT_ID ?? null}
      waitlistGated={process.env.WAITLIST_GATE_ENABLED === "true"}
    />
  );
}
