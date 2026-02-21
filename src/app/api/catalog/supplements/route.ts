import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { supplementSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supplements = await prisma.supplement.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(supplements);
  } catch (error) {
    console.error("GET /api/catalog/supplements error:", error);
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
    const data = supplementSchema.parse(body);

    const supplement = await prisma.supplement.create({
      data: {
        userId: session.user.id,
        name: data.name,
        brand: data.brand,
        dose: data.dose,
        schedule: data.schedule,
        notes: data.notes,
        photoUrl: data.photoUrl,
        link: data.link,
        tags: data.tags,
      },
    });

    return NextResponse.json(supplement, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("POST /api/catalog/supplements error:", error);
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

    const supplement = await prisma.supplement.findUnique({
      where: { id },
    });

    if (!supplement) {
      return NextResponse.json(
        { error: "Supplement not found" },
        { status: 404 }
      );
    }

    if (supplement.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.supplement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/catalog/supplements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
