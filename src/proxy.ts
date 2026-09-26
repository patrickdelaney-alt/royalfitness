import { NextResponse, type NextRequest } from "next/server";
import { PATHNAME_HEADER } from "@/lib/onboarding-guard";

// Layouts can't see the requested path, so pass it to the onboarding layout's
// resume-step guard (see src/lib/onboarding-guard.ts).
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/onboarding/:path*"],
};
