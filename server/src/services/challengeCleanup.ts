import { prisma } from '../index.js';

/**
 * Periodically sweeps and deletes expired AuthChallenge records from the database.
 */
export async function cleanupExpiredChallenges(): Promise<number> {
  try {
    const result = await prisma.authChallenge.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    if (result.count > 0) {
      console.log(`🧹 [SWEEP] Cleaned up ${result.count} expired auth challenge(s)`);
    }
    return result.count;
  } catch (err) {
    console.error('Failed to cleanup expired challenges:', err);
    return 0;
  }
}
