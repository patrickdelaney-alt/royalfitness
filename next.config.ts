import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling these server-only packages.
  // They must be loaded as native Node modules at runtime in Vercel
  // serverless functions — bundling them can cause module-not-found
  // or adapter-initialisation errors that surface as blank pages.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-neon",
    "@prisma/adapter-pg",
    "@neondatabase/serverless",
  ],
};

export default nextConfig;
