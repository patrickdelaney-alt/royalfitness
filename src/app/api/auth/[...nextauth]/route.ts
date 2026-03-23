import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Wrap handlers with error logging to surface the real error
// behind NextAuth's generic "Configuration" error page.
async function wrappedGET(req: NextRequest) {
  try {
    return await handlers.GET(req);
  } catch (err) {
    console.error("[auth GET]", err);
    throw err;
  }
}

async function wrappedPOST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (err) {
    console.error("[auth POST]", err);
    throw err;
  }
}

export { wrappedGET as GET, wrappedPOST as POST };
