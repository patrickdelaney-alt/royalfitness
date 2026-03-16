import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="text-center">
      <h2 className="mb-4 text-2xl font-bold text-foreground">Reset Password</h2>
      <p className="mb-6 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
        Automated password reset is not yet available.
        <br />
        Please contact{" "}
        <a
          href="mailto:support@royalwellness.app"
          className="font-semibold underline"
          style={{ color: "#a8a6ff" }}
        >
          support@royalwellness.app
        </a>{" "}
        and we&apos;ll reset your password manually within 24 hours.
      </p>
      <Link
        href="/signin"
        className="text-sm font-semibold"
        style={{ color: "#a8a6ff" }}
      >
        ← Back to Sign In
      </Link>
    </div>
  );
}
