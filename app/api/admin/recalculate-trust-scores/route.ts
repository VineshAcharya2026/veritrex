import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { batchRecalculateTrustScores } from "@/lib/rating-engine";

export async function POST() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const processed = await batchRecalculateTrustScores();
  return NextResponse.json({ processed });
}
