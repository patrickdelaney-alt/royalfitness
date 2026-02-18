import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// NextAuth v5 beta.30 reads AUTH_SECRET directly from process.env in several
// internal code paths (JWT signing, cookie encryption) regardless of what is
// passed to the `secret` config option.  Polyfill it from NEXTAUTH_SECRET so
// environments that were configured with the v4 variable name keep working.
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}

// Stable cookie name — must never change after launch because it is used
// as the JWT encryption salt. Using a prefix-free name keeps it identical
// across local (http) and production (https) environments.
const COOKIE_NAME = "authjs.session-token";

/** Derive a unique @username from an OAuth email address. */
async function generateUniqueUsername(email: string): Promise<string> {
  const base =
    email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "user";
  let username = base;
  let n = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    n++;
    username = `${base}${n}`;
  }
  return username;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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
            where: { email: credentials.email as string },
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
    ...(process.env.APPLE_CLIENT_ID
      ? [
          Apple({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    // Google Sign In — enabled when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set
    ...(process.env.GOOGLE_CLIENT_ID
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

      try {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!existing) {
          const username = await generateUniqueUsername(user.email);
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? "User",
              username,
              avatarUrl: user.image ?? null,
              passwordHash: null,
            },
          });
        }
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
        } else if (user.email) {
          // OAuth: look up the record we just created/found
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
            });
            token.id = dbUser?.id ?? "";
            token.username = dbUser?.username ?? "";
          } catch {
            token.id = "";
            token.username = "";
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
});
