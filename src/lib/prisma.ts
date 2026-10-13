import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (process.env.NODE_ENV !== "production") {
  const current = globalForPrisma.prisma as any;
  if (current && !("containerMetric" in current)) {
    try {
      current.$disconnect();
    } catch {
      // ignore
    }
    globalForPrisma.prisma = undefined;
  }
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
