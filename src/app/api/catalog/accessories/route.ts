import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { wellnessAccessorySchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessories = await prisma.wellnessAccessory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(accessories);
  } catch (error) {
    console.error("GET /api/catalog/accessories error:", error);
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
    const data = wellnessAccessorySchema.parse(body);

    const accessory = await prisma.wellnessAccessory.create({
      data: {
        userId: session.user.id,
        name: data.name,
        type: data.type,
        link: data.link,
        photoUrl: data.photoUrl,
        tags: data.tags,
        notes: data.notes,
      },
    });

    return NextResponse.json(accessory, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("POST /api/catalog/accessories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    const accessory = await prisma.wellnessAccessory.findUnique({
      where: { id },
    });

    if (!accessory) {
      return NextResponse.json(
        { error: "Accessory not found" },
        { status: 404 }
      );
    }

    if (accessory.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.wellnessAccessory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/catalog/accessories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
