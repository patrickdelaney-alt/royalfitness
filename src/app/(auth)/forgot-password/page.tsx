import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="text-center">
      <h2 className="mb-4 text-2xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>Reset Password</h2>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
        Automated password reset is not yet available.
        <br />
        Please contact{" "}
        <a
          href="mailto:support@royalwellness.app"
          className="font-semibold underline"
          style={{ color: "var(--brand)" }}
        >
          support@royalwellness.app
        </a>{" "}
        and we&apos;ll reset your password manually within 24 hours.
      </p>
      <Link
        href="/signin"
        className="text-sm font-semibold"
        style={{ color: "var(--brand)" }}
      >
        &larr; Back to Sign In
      </Link>
    </div>
  );
}
