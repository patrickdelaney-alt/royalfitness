import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const submitSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  firstName: z
    .string()
    .max(50, "First name is too long.")
    .transform((v) => v.trim() || null)
    .nullish()
    .default(null),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = submitSchema.parse(body);
    const email = data.email.trim().toLowerCase();

    // Check for an existing entry — return a friendly 200 rather than an error.
    const existing = await prisma.waitlistUser.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ already: true }, { status: 200 });
    }

    await prisma.waitlistUser.create({
      data: {
        email,
        firstName: data.firstName ?? null,
        // status defaults to PENDING via the schema
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    console.error("POST /api/waitlist error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
