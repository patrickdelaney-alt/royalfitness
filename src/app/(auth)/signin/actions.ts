"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function signInAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    // redirectTo causes NextAuth to set the session cookie then throw
    // NEXT_REDIRECT — the correct pattern for server actions in NextAuth v5.
    // Using redirect:false here does NOT reliably set the cookie.
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/feed",
    });
  } catch (error) {
    // Re-throw NEXT_REDIRECT so Next.js can perform the redirect
    if (
      typeof (error as Record<string, unknown>).digest === "string" &&
      ((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof AuthError) {
      return "Invalid email or password. Please try again.";
    }
    console.error("[signInAction]", error);
    return "Something went wrong. Please try again later.";
  }
  return null;
}
