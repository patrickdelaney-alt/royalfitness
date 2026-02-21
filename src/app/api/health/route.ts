import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Temporary diagnostic endpoint — remove after debugging
export async function GET() {
  const info: Record<string, unknown> = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_preview: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:\/\/[^@]+@/, "://<credentials>@").slice(0, 80)
      : null,
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
    NEXTAUTH_URL_set: !!process.env.NEXTAUTH_URL,
  };

  try {
    // Minimal query — just count users
    const userCount = await prisma.user.count();
    info.db_status = "ok";
    info.user_count = userCount;
  } catch (err) {
    info.db_status = "error";
    info.db_error =
      err instanceof Error
        ? { message: err.message, name: err.name }
        : String(err);
  }

  return NextResponse.json(info);
}
