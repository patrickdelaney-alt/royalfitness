/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { proxy, config } from "../proxy";
import { PATHNAME_HEADER } from "@/lib/onboarding-guard";

describe("proxy", () => {
  it("forwards the requested pathname to the onboarding layout", () => {
    const res = proxy(new NextRequest("https://royalwellness.app/onboarding/follow?x=1"));
    // NextResponse.next({ request: { headers } }) exposes overridden request headers this way
    expect(res.headers.get(`x-middleware-request-${PATHNAME_HEADER}`)).toBe("/onboarding/follow");
  });

  it("overwrites a client-supplied pathname header", () => {
    const req = new NextRequest("https://royalwellness.app/onboarding/profile", {
      headers: { [PATHNAME_HEADER]: "/onboarding/follow" },
    });
    expect(proxy(req).headers.get(`x-middleware-request-${PATHNAME_HEADER}`)).toBe("/onboarding/profile");
  });

  it("only runs for onboarding routes", () => {
    expect(config.matcher).toEqual(["/onboarding/:path*"]);
  });
});
