import SignInClient from "./SignInClient";

// Server component — reads env vars at request time and passes provider
// availability flags to the client component so OAuth buttons are only
// rendered when the credentials are actually configured in the environment.
export default function SignInPage() {
  return (
    <SignInClient
      appleEnabled={!!process.env.APPLE_CLIENT_ID}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
    />
  );
}
