import { createHash } from "crypto";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendWelcomeEmail } from "./email";

// AUTH_SECRET is required by NextAuth v5 for JWT signing and cookie encryption.
// Resolution order:
//  1. AUTH_SECRET   — canonical v5 name
//  2. NEXTAUTH_SECRET — v4 compat alias
//  3. Derived from DATABASE_URL — automatic fallback so the app works even
//     when neither secret is explicitly configured in the environment.
//     DATABASE_URL is always present (the DB would be unreachable otherwise)
//     and it's unique per deployment, giving a stable, hard-to-guess secret.
if (!process.env.AUTH_SECRET) {
  if (process.env.NEXTAUTH_SECRET) {
    process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
  } else if (process.env.DATABASE_URL) {
    process.env.AUTH_SECRET = createHash("sha256")
      .update("royalfitness-auth-v1:" + process.env.DATABASE_URL)
      .digest("hex");
    console.warn(
      "[auth] AUTH_SECRET not set — derived from DATABASE_URL. " +
        "Add AUTH_SECRET to your environment variables for explicit control."
    );
  }
}

// AUTH_URL / NEXTAUTH_URL tells NextAuth where the app is hosted so it can
// construct callback URLs and validate requests.  On Vercel, VERCEL_URL is
// always injected automatically — use it as a zero-config fallback.
if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
  if (process.env.VERCEL_URL) {
    process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
  }
} else if (process.env.AUTH_URL && !process.env.AUTH_URL.startsWith("http")) {
  // If AUTH_URL is set but missing the protocol, add it
  process.env.AUTH_URL = `https://${process.env.AUTH_URL}`;
  console.warn(
    "[auth] AUTH_URL was missing https:// protocol — auto-corrected. " +
      "Please update your environment variable to include the full URL for clarity."
  );
}

// Stable cookie name — must never change after launch because it is used
// as the JWT encryption salt. Using a prefix-free name keeps it identical
// across local (http) and production (https) environments.
const COOKIE_NAME = "authjs.session-token";

/** Derive a unique @username from an OAuth email address.
 *  Apple "Hide My Email" generates addresses like `a1b2c3@privaterelay.appleid.com` —
 *  those are not human-readable, so fall back to a simple "user" base. */
async function generateUniqueUsername(email: string): Promise<string> {
  const isPrivateRelay = email.endsWith("@privaterelay.appleid.com");
  const base = isPrivateRelay
    ? "user"
    : email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "user";
  let username = base;
  let n = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    n++;
    username = `${base}${n}`;
  }
  return username;
}

/** Derive a display name from an email when the OAuth provider didn't supply one.
 *  Apple only sends the user's real name on the very first sign-in. */
function deriveNameFromEmail(email: string): string {
  if (email.endsWith("@privaterelay.appleid.com")) return "Royal Member";
  const local = email.split("@")[0].replace(/[._-]+/g, " ");
  return local
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim() || "Royal Member";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV !== "production",
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
    error: "/signin", // send NextAuth errors to our page (?error=...) instead of raw JSON
  },
  cookies: {
    sessionToken: {
      name: COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: (credentials.email as string).toLowerCase() },
          });

          if (!user || !user.passwordHash) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatarUrl,
            username: user.username,
          };
        } catch (err) {
          // DB errors must not propagate — NextAuth treats thrown errors from
          // authorize() as a Configuration error and shows a JSON error page.
          console.error("[authorize]", err);
          return null;
        }
      },
    }),

    // Apple Sign In — enabled when APPLE_CLIENT_ID + APPLE_CLIENT_SECRET are set
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? [
          Apple({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    // Google Sign In — enabled when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    /** Create a DB user record on first OAuth sign-in. */
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user.email) return false;

      const normalizedEmail = user.email.toLowerCase();

      try {
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Waitlist gate — only block NEW OAuth users (existing accounts can always sign in).
        // Controlled by WAITLIST_GATE_ENABLED env var (set to "true" to enable).
        if (process.env.WAITLIST_GATE_ENABLED === "true" && !existing) {
          const approved = await prisma.waitlistUser.findFirst({
            where: {
              email: normalizedEmail,
              status: { in: ["APPROVED", "INVITED", "ACTIVATED"] },
            },
          });
          if (!approved) {
            // Redirect to /waitlist with ?gated=1 so the page can show the right message
            return "/waitlist?gated=1";
          }
        }

        if (!existing) {
          const username = await generateUniqueUsername(normalizedEmail);
          // Apple only sends the real name on the FIRST sign-in; fall back
          // to a human-readable name derived from the email rather than "User".
          const displayName = user.name?.trim() || deriveNameFromEmail(normalizedEmail);
          await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: displayName,
              username,
              avatarUrl: user.image ?? null,
              passwordHash: null,
            },
          });
          try {
            await sendWelcomeEmail(normalizedEmail);
          } catch {
            // Welcome email failure must not block sign-in
          }
        }
        // Existing users: their profile is already set — don't overwrite it.
        return true;
      } catch (err) {
        console.error("[signIn callback]", err);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "credentials") {
          token.id = user.id;
          token.username = (user as { username?: string }).username ?? "";
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { onboardingStep: true },
            });
            token.onboardingStep = dbUser?.onboardingStep ?? null;
          } catch {
            token.onboardingStep = null;
          }
        } else if (user.email) {
          // OAuth: look up the record we just created/found
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email.toLowerCase() },
            });
            token.id = dbUser?.id ?? "";
            token.username = dbUser?.username ?? "";
            token.onboardingStep = dbUser?.onboardingStep ?? null;
          } catch {
            token.id = "";
            token.username = "";
            token.onboardingStep = null;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.onboardingStep = (token.onboardingStep as string | null) ?? null;
      }
      return session;
    },
  },
});
