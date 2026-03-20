import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { affiliateItemSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliates = await prisma.affiliateItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(affiliates);
  } catch (error) {
    console.error("GET /api/catalog/affiliates error:", error);
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
    const data = affiliateItemSchema.parse(body);

    const affiliate = await prisma.affiliateItem.create({
      data: {
        userId: session.user.id,
        name: data.name,
        brand: data.brand,
        description: data.description,
        link: data.link || null,
        referralCode: data.referralCode,
        category: data.category,
        photoUrl: data.photoUrl,
        tags: data.tags,
        subcategoryTags: data.subcategoryTags,
        ctaLabel: data.ctaLabel,
        logoUrl: data.logoUrl,
        enrichmentConfidence: data.enrichmentConfidence,
        needsReview: data.needsReview,
      },
    });

    return NextResponse.json(affiliate, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("POST /api/catalog/affiliates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const existing = await prisma.affiliateItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Affiliate item not found" },
        { status: 404 }
      );
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = affiliateItemSchema.partial().parse(body);

    const updated = await prisma.affiliateItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.link !== undefined && { link: data.link || null }),
        ...(data.referralCode !== undefined && { referralCode: data.referralCode }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.subcategoryTags !== undefined && { subcategoryTags: data.subcategoryTags }),
        ...(data.ctaLabel !== undefined && { ctaLabel: data.ctaLabel }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.enrichmentConfidence !== undefined && { enrichmentConfidence: data.enrichmentConfidence }),
        ...(data.needsReview !== undefined && { needsReview: data.needsReview }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("PATCH /api/catalog/affiliates error:", error);
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

    const affiliate = await prisma.affiliateItem.findUnique({ where: { id } });

    if (!affiliate) {
      return NextResponse.json(
        { error: "Affiliate item not found" },
        { status: 404 }
      );
    }

    if (affiliate.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.affiliateItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/catalog/affiliates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
