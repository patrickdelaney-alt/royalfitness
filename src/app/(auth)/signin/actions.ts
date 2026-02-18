"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function signInAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/feed",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Invalid email or password. Please try again.";
    }
    // Re-throw so Next.js can handle the redirect
    throw error;
  }
  return null;
}
