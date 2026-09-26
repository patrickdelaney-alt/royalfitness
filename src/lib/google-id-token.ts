import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Verifies a Google ID token produced by native Google Sign-In in the iOS app.
 *
 * Why this exists: inside the Capacitor wrapper, the normal web OAuth redirect
 * can't work — iOS opens accounts.google.com in Safari, so Google redirects back
 * to Safari, which doesn't have the PKCE cookie that was set in the app's
 * webview (Auth.js then fails with "pkceCodeVerifier value could not be parsed").
 * Instead, the app signs in with Google natively and sends us the ID token.
 */

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface VerifiedGoogleIdentity {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

/** Client IDs a native ID token may be issued to (its `aud` claim). */
export function allowedGoogleAudiences(): string[] {
  return [process.env.GOOGLE_IOS_CLIENT_ID, process.env.GOOGLE_CLIENT_ID].filter(
    (v): v is string => !!v
  );
}

/**
 * Returns the verified identity, or null if the token is invalid, expired,
 * issued for a different app, or the email isn't verified by Google.
 */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<VerifiedGoogleIdentity | null> {
  const audience = allowedGoogleAudiences();
  if (!idToken || audience.length === 0) return null;

  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience,
      clockTolerance: 30,
    });

    const email = typeof payload.email === "string" ? payload.email : null;
    const verified = payload.email_verified === true || payload.email_verified === "true";
    if (!email || !verified || !payload.sub) return null;

    return {
      sub: payload.sub,
      email: email.toLowerCase(),
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
    };
  } catch (err) {
    console.error("[google-native] ID token rejected:", String(err));
    return null;
  }
}
