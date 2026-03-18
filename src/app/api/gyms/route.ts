// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { createGymSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");

    const gyms = await prisma.gym.findMany({
      where: q
        ? { name: { contains: q, mode: "insensitive" } }
        : undefined,
      include: {
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // If lat/lng provided, sort results by proximity (nearest first)
    if (!isNaN(lat) && !isNaN(lng)) {
      gyms.sort((a, b) => {
        const distA =
          a.latitude != null && a.longitude != null
            ? Math.sqrt(
                Math.pow(a.latitude - lat, 2) +
                  Math.pow(a.longitude - lng, 2)
              )
            : Infinity;
        const distB =
          b.latitude != null && b.longitude != null
            ? Math.sqrt(
                Math.pow(b.latitude - lat, 2) +
                  Math.pow(b.longitude - lng, 2)
              )
            : Infinity;
        return distA - distB;
      });
    }

    return NextResponse.json(gyms);
  } catch (error) {
    console.error("GET /api/gyms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createGymSchema.parse(body);

    const gym = await prisma.gym.create({
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json(gym, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("POST /api/gyms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
