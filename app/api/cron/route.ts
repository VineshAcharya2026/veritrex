import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { runIntegrityJobs } from "@/lib/integrity-jobs";
import {
  markUnilateralRatings,
  batchRecalculateTrustScores,
  detectSuspiciousPairs,
} from "@/lib/rating-engine";
import { backfillNationBuildingEntries } from "@/lib/nation-building-sync";

function cronAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!cronAuthorized(authHeader)) {
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

  if (task === "nation-building") {
    const result = await backfillNationBuildingEntries();
    return NextResponse.json({ task: "nation-building", ...result });
  }

  const result = await runIntegrityJobs();
  return NextResponse.json(result);
}
