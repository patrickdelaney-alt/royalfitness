import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await safeAuth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { step } = await req.json();
  if (typeof step !== "string" || step.length > 50)
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingStep: step },
  });

  return NextResponse.json({ ok: true });
}
