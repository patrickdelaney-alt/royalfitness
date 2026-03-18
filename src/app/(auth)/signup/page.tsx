import SignUpClient from "./SignUpClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (process.env.WAITLIST_ONLY === "true") {
    redirect("/waitlist");
  }

  return (
    <SignUpClient
      appleEnabled={!!process.env.APPLE_CLIENT_ID}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
    />
  );
}
