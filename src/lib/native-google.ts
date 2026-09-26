"use client";

import { signIn } from "next-auth/react";
import { isCapacitorNative } from "./link-handler";

/**
 * Native Google Sign-In for the iOS app.
 *
 * The web OAuth redirect can't complete inside the Capacitor wrapper (Google's
 * page opens in Safari, which lacks the app's PKCE cookie). App builds that
 * include @capgo/capacitor-social-login sign in with Google natively instead,
 * then hand the ID token to the server's "google-native" provider.
 *
 * Older App Store builds don't have the plugin, so callers must fall back to
 * the regular web flow when this returns false.
 */
export function canUseNativeGoogle(iosClientId?: string | null): boolean {
  if (!iosClientId || !isCapacitorNative()) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return !!cap?.isPluginAvailable?.("SocialLogin");
}

export type NativeGoogleResult =
  | { ok: true; url: string }
  | { ok: false; cancelled: boolean };

/** Runs the native Google sheet and signs the user in. */
export async function nativeGoogleSignIn(
  iosClientId: string,
  callbackUrl = "/feed"
): Promise<NativeGoogleResult> {
  const { SocialLogin } = await import("@capgo/capacitor-social-login");

  let idToken: string | null | undefined;
  try {
    await SocialLogin.initialize({
      google: { iOSClientId: iosClientId, mode: "online" },
    });
    const res = await SocialLogin.login({
      provider: "google",
      options: { scopes: ["email", "profile"] },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    idToken = (res.result as any)?.idToken;
  } catch (err) {
    // Closing the Google sheet surfaces as an error; don't show it as a failure.
    const msg = String((err as Error)?.message ?? err).toLowerCase();
    const cancelled = msg.includes("cancel");
    if (!cancelled) console.error("[native-google]", err);
    return { ok: false, cancelled };
  }

  if (!idToken) return { ok: false, cancelled: false };

  const result = await signIn("google-native", {
    idToken,
    redirect: false,
    redirectTo: callbackUrl,
  });
  if (!result || result.error) return { ok: false, cancelled: false };

  // The signIn callback may send new users to the waitlist instead.
  return { ok: true, url: result.url && !result.url.includes("error=") ? result.url : callbackUrl };
}
