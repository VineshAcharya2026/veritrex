import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  markUnilateralRatings,
  batchRecalculateTrustScores,
  detectSuspiciousPairs,
} from "@/lib/rating-engine";

export async function GET(request: Request) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const task = url.searchParams.get("task");

  if (task === "unilateral") {
    const updated = await markUnilateralRatings();
    return NextResponse.json({ task: "unilateral", updated });
  }

  if (task === "trust-scores") {
    const processed = await batchRecalculateTrustScores();
    return NextResponse.json({ task: "trust-scores", processed });
  }

  if (task === "cheating") {
    const flags = await detectSuspiciousPairs();
    return NextResponse.json({ task: "cheating", flagged: flags.length });
  }

  const [unilateral, trustScores, cheating] = await Promise.all([
    markUnilateralRatings(),
    batchRecalculateTrustScores(),
    detectSuspiciousPairs(),
  ]);

  return NextResponse.json({
    unilateralUpdated: unilateral,
    trustScoresProcessed: trustScores,
    cheatFlagsCreated: cheating.length,
  });
}
