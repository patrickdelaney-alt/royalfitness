import { Suspense } from "react";
import { redirect } from "next/navigation";
import { safeAuth } from "@/lib/safe-auth";
import SignInClient from "./SignInClient";

// Must be dynamic so env vars are read at request time (not baked at build).
export const dynamic = "force-dynamic";

function SignInSkeleton() {
  return (
    <div className="flex justify-center py-12">
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "rgba(36,63,22,0.35)", borderTopColor: "transparent" }}
      />
    </div>
  );
}

// Suspense is here (in the SERVER component) so that useSearchParams() inside
// SignInClient can properly suspend during SSR in Next.js 16.
export default async function SignInPage() {
  // A user who is already signed in (e.g. the iOS WKWebView reloads a
  // /signin tab it had open before the user last logged in) should land on
  // their feed, not be shown the login form again — same check as the root
  // page (src/app/page.tsx).
  const session = await safeAuth();
  if (session?.user?.id) {
    redirect("/feed");
  }

  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInClient
        appleEnabled={!!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET}
        googleEnabled={!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET}
        googleIosClientId={process.env.GOOGLE_IOS_CLIENT_ID ?? null}
      />
    </Suspense>
  );
}

