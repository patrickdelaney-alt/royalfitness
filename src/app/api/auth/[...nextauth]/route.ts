import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Wrap handlers with response logging to capture the redirect URL
// that NextAuth returns — reveals whether it's an error redirect.
async function wrappedGET(req: NextRequest) {
  try {
    const res = await handlers.GET(req);
    const url = req.nextUrl.pathname;
    if (url.includes("signin") || url.includes("callback")) {
      const location = res.headers.get("Location");
      console.error(`[auth-debug] GET ${url} → status=${res.status} location=${location}`);
    }
    return res;
  } catch (err) {
    console.error("[auth-debug] GET threw:", String(err));
    throw err;
  }
}

async function wrappedPOST(req: NextRequest) {
  try {
    const res = await handlers.POST(req);
    const url = req.nextUrl.pathname;
    // next-auth/react sends X-Auth-Return-Redirect, so the response is JSON
    // with { url: "..." } — clone and read it to log the redirect target.
    if (url.includes("signin")) {
      try {
        const clone = res.clone();
        const body = await clone.text();
        console.error(`[auth-debug] POST ${url} → status=${res.status} body=${body}`);
      } catch { /* ignore clone errors */ }
    }
    return res;
  } catch (err) {
    console.error("[auth-debug] POST threw:", String(err));
    throw err;
  }
}

export { wrappedGET as GET, wrappedPOST as POST };
