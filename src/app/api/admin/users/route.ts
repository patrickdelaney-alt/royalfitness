// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(email: string | null | undefined): boolean {
  return !!email && email === process.env.ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!isAdmin(session?.user?.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
          passwordHash: true,
          // Include account to detect OAuth provider
          accounts: { select: { provider: true }, take: 1 },
        },
      }),
      prisma.user.count(),
    ]);

    let nextCursor: string | undefined;
    if (users.length > limit) {
      nextCursor = users.pop()!.id;
    }

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      signupMethod: u.accounts[0]?.provider ?? (u.passwordHash ? "email" : "unknown"),
    }));

    return NextResponse.json({ users: result, nextCursor, totalCount });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
