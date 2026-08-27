import { prisma } from './prisma.js';

/**
 * Checks whether the configured database accepts a minimal query. Callers should
 * expose only the boolean result, not the underlying connection error.
 */
export const isDatabaseAvailable = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};
