import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/search?q= - Search users by username or name
export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: { not: session.user.id },
          },
          {
            OR: [
              {
                username: {
                  contains: trimmedQuery,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: trimmedQuery,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
      take: 20,
      orderBy: {
        username: "asc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in GET /api/users/search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
