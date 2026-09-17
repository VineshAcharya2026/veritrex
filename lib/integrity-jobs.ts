import {
  markUnilateralRatings,
  batchRecalculateTrustScores,
  detectSuspiciousPairs,
} from "@/lib/rating-engine";
import { backfillNationBuildingEntries } from "@/lib/nation-building-sync";

export type IntegrityJobsResult = {
  unilateralUpdated: number;
  trustScoresProcessed: number;
  cheatFlagsCreated: number;
  nationBuildingMentorsProcessed: number;
};

/**
 * Run integrity jobs in a safe order.
 * Unilateral flags must be written before TrustScore batch recalculation.
 */
export async function runIntegrityJobs(): Promise<IntegrityJobsResult> {
  const unilateralUpdated = await markUnilateralRatings();
  const trustScoresProcessed = await batchRecalculateTrustScores();
  const cheating = await detectSuspiciousPairs();
  const nationBuilding = await backfillNationBuildingEntries();

  return {
    unilateralUpdated,
    trustScoresProcessed,
    cheatFlagsCreated: cheating.length,
    nationBuildingMentorsProcessed: nationBuilding.mentorsProcessed,
  };
}
