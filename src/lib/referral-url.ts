// Public origin for links that leave the app (messages, share sheets, QR codes).
// Deliberately not NEXTAUTH_URL / AUTH_URL: those are auth config, may be unset
// in production, and produced relative "/r/<code>" links when they were.
export const PUBLIC_APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://royalwellness.app"
).replace(/\/+$/, "");

/** Absolute, openable referral URL: https://royalwellness.app/r/<code>. */
export function referralUrl(code: string): string {
  return `${PUBLIC_APP_URL}/r/${encodeURIComponent(code)}`;
}
