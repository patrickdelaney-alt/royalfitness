import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = waitlistSchema.parse(body);

    const email = data.email.trim().toLowerCase();
    const name = data.name?.trim() || null;
    const source = data.source.trim().toLowerCase();

    const existingEntry = await prisma.waitlistEntry.findUnique({
      where: { email },
    });

    if (existingEntry) {
      return NextResponse.json(
        {
          ok: true,
          alreadyJoined: true,
          message: "You're already on the waitlist.",
        },
        { status: 200 }
      );
    }

    await prisma.waitlistEntry.create({
      data: {
        email,
        name,
        source,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        alreadyJoined: false,
        message: "You're on the waitlist! We'll be in touch soon.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
