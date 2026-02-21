import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

/**
 * Wraps auth() so a missing AUTH_URL / NEXTAUTH_URL env var (common on
 * first Vercel deploy) doesn't crash API routes with an unhandled 500.
 * Returns null when auth cannot be resolved instead of throwing.
 */
export async function safeAuth(): Promise<Session | null> {
  try {
    return (await auth()) as Session | null;
  } catch {
    return null;
  }
}
