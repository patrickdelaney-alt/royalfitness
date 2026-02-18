import SignUpClient from "./SignUpClient";

// Server component — checks which OAuth providers are configured and passes
// the flags down so the client only renders buttons that will actually work.
export default function SignUpPage() {
  return (
    <SignUpClient
      appleEnabled={!!process.env.APPLE_CLIENT_ID}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
    />
  );
}
