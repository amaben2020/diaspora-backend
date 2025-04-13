import { eq } from 'drizzle-orm';
import { db } from '../db.ts';
import { premiumFeaturesTable } from '../schema/premiumFeatureTable.ts';

export async function applyPremiumVisibility(userId: string) {
  const [premium] = await db
    .select()
    .from(premiumFeaturesTable)
    .where(eq(premiumFeaturesTable.userId, userId))
    .limit(1);

  if (!premium?.visibilityBoost) return 1; // Default visibility multiplier

  // Calculate boost based on subscription
  let boostMultiplier = 1;

  if (premium.visibilityBoost) {
    // Higher boost for active premium users
    // TODO: Ensure all paid users have this, the only differentiating factor would be when they are 24hrs in
    boostMultiplier = 3;

    // Additional boost if recently active
    if (
      premium.lastBoostedAt &&
      new Date(premium.lastBoostedAt) >
        new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) {
      boostMultiplier = 4;
    }
  }

  return boostMultiplier;
}
