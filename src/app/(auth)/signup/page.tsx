import SignUpClient from "./SignUpClient";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <SignUpClient
      appleEnabled={!!process.env.APPLE_CLIENT_ID}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
    />
  );
}
