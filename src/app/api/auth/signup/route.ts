import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "auth-signup", 8, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const rawData = signUpSchema.parse(body);
    const data = { ...rawData, email: rawData.email.toLowerCase() };

    // Waitlist gate — only allow signup if the email is approved.
    // Controlled by the WAITLIST_GATE_ENABLED env var (set to "true" to enable).
    if (process.env.WAITLIST_GATE_ENABLED === "true") {
      const approved = await prisma.waitlistUser.findFirst({
        where: {
          email: data.email.toLowerCase(),
          status: { in: ["APPROVED", "INVITED", "ACTIVATED"] },
        },
      });
      if (!approved) {
        return NextResponse.json(
          {
            error:
              "You're on the waitlist — we'll email you when you're approved.",
          },
          { status: 403 }
        );
      }
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Optional referral code — passed by the client if the user arrived via /r/<code>
    const refCode =
      typeof body.refCode === "string" && body.refCode.trim().length <= 50
        ? body.refCode.trim()
        : null;

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        passwordHash,
      },
    });

    // Welcome email — failure must not block account creation
    try {
      await sendWelcomeEmail(user.email);
    } catch {
      // non-blocking
    }

    // Founding member claim — first 100 users get the badge
    try {
      const FOUNDING_MEMBER_CAP = 100;
      const foundingCount = await prisma.user.count({ where: { foundingMember: true } });
      if (foundingCount < FOUNDING_MEMBER_CAP) {
        const token = randomBytes(8).toString("hex");
        await prisma.user.update({
          where: { id: user.id },
          data: { foundingMember: true, foundingMemberSeen: false },
        });
        await prisma.foundingMemberInvite.create({
          data: { inviterId: user.id, token },
        });
      }
    } catch {
      // Founding member claim failure must not block account creation
    }

    // Attribution: if a valid refCode was passed, record the referral and auto-follow
    if (refCode) {
      try {
        const link = await prisma.referralLink.findUnique({
          where: { id: refCode },
          select: { id: true, userId: true },
        });
        if (link && link.userId !== user.id) {
          await prisma.$transaction([
            prisma.referralAttribution.create({
              data: { referralLinkId: link.id, newUserId: user.id },
            }),
            prisma.follow.create({
              data: { followerId: user.id, followingId: link.userId },
            }),
          ]);
        }
      } catch {
        // Attribution failure must not block account creation
      }
    }

    return NextResponse.json(
      { id: user.id, username: user.username },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
