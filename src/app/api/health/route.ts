import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeAuth } from "@/lib/safe-auth";

const PUBLIC_HEALTH_RESPONSE = { status: "ok" };

function isAdmin(email: string | null | undefined): boolean {
  return !!email && email === process.env.ADMIN_EMAIL;
}

function hasValidInternalToken(req: NextRequest): boolean {
  const configuredToken = process.env.HEALTH_INTERNAL_TOKEN;
  if (!configuredToken) {
    return false;
  }

  return req.headers.get("x-health-token") === configuredToken;
}

function diagnosticsAllowedInEnv(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.HEALTH_DIAGNOSTICS_ENABLED === "true"
  );
}

export async function GET(req: NextRequest) {
  if (!diagnosticsAllowedInEnv()) {
    return NextResponse.json(PUBLIC_HEALTH_RESPONSE);
  }

  const internalTokenAuthorized = hasValidInternalToken(req);
  let adminAuthorized = false;

  if (!internalTokenAuthorized) {
    const session = await safeAuth();
    adminAuthorized = isAdmin(session?.user?.email);
  }

  if (!internalTokenAuthorized && !adminAuthorized) {
    return NextResponse.json(PUBLIC_HEALTH_RESPONSE);
  }

  let dbStatus: "ok" | "error" = "ok";
  try {
    await prisma.user.count();
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    diagnostics: {
      db_status: dbStatus,
    },
  });
}
