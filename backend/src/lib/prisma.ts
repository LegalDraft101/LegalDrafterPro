import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

// Cache one client per Node process to prevent duplicate connection pools during reloads.
globalForPrisma.prisma = prisma;

export default prisma;
