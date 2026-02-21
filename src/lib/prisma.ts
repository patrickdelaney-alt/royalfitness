import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  // Neon serverless databases (*.neon.tech) require the HTTP-based driver to
  // work correctly inside Vercel serverless functions.  Standard pg connections
  // use TCP keep-alives that don't survive cold-start function isolation.
  if (url.includes(".neon.tech")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neon } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon");
    const sql = neon(url);
    const adapter = new PrismaNeon(sql);
    return new PrismaClient({ adapter });
  }

  // Local / standard PostgreSQL (development)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
