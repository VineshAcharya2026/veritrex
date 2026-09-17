import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { runIntegrityJobs } from "@/lib/integrity-jobs";

/** Admin-only integrity jobs (same work as GET /api/cron without exposing CRON_SECRET). */
export async function POST() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const result = await runIntegrityJobs();
  return NextResponse.json(result);
}
