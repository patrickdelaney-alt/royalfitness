import SignUpClient from "./SignUpClient";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <SignUpClient
      appleEnabled={!!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET}
      waitlistGated={process.env.WAITLIST_GATE_ENABLED === "true"}
    />
  );
}
