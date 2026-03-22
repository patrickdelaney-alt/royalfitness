import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

function isAdmin(email: string | null | undefined): boolean {
  return !!email && email === process.env.ADMIN_EMAIL;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!isAdmin(session?.user?.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { to } = await req.json();
    if (!to || typeof to !== "string") {
      return NextResponse.json(
        { error: '"to" email is required' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured in environment" },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: "Royal Fitness <noreply@royalwellness.app>",
      to,
      subject: "Test email from Royal Fitness",
      html: `<h2>Test Email</h2>
             <p>This is a test email sent at ${new Date().toISOString()}.</p>
             <p>If you received this, Resend email delivery is working correctly for <strong>royalwellness.app</strong>.</p>
             <p>— Royal Fitness</p>`,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, emailId: data?.id });
  } catch (err) {
    console.error("[test-email]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
