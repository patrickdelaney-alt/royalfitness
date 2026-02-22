import SignInClient from "./SignInClient";

// Must be dynamic so env vars are read at request time (not baked at build).
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <SignInClient
      appleEnabled={!!process.env.APPLE_CLIENT_ID}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
    />
  );
}
