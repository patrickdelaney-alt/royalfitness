"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

/**
 * Server action for credentials sign-in.
 *
 * Using the server-side signIn (from @/lib/auth) instead of the client-side
 * one (from next-auth/react) fixes two auth.js v5 beta issues:
 *
 * 1. The client-side signIn returns undefined (not an error object) on failure
 *    in some beta builds, making it impossible to detect bad credentials.
 * 2. The session cookie is guaranteed to be set in the server response before
 *    the client receives control, so window.location.href = "/feed" always
 *    sees a valid session on the very first request.
 */
export async function credentialsSignIn(
  email: string,
  password: string
): Promise<{ error?: string }> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password. Please try again." };
    }
    // Unexpected error — bubble it so the client's catch block shows
    // "Something went wrong" rather than silently swallowing it.
    throw err;
  }
}
