import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "check-username", 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "username query parameter is required" },
      { status: 400 }
    );
  }

  const formatResult = signUpSchema.shape.username.safeParse(username);
  if (!formatResult.success) {
    return NextResponse.json({ available: false, reason: "format" });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return NextResponse.json(
      existing ? { available: false, reason: "taken" } : { available: true }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
