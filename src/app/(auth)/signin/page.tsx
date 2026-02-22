import { Suspense } from "react";
import SignInClient from "./SignInClient";

// Must be dynamic so env vars are read at request time (not baked at build).
export const dynamic = "force-dynamic";

function SignInSkeleton() {
  return (
    <div className="flex justify-center py-12">
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "#8b88f8", borderTopColor: "transparent" }}
      />
    </div>
  );
}

// Suspense is here (in the SERVER component) so that useSearchParams() inside
// SignInClient can properly suspend during SSR in Next.js 16.
export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInClient
        appleEnabled={!!process.env.APPLE_CLIENT_ID}
        googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
      />
    </Suspense>
  );
}

