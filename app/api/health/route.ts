import { NextResponse } from "next/server";
import { resolveAuthSecret } from "@/lib/auth/resolve-secret";
import { getDb } from "@/lib/db/client";
import { resolveAppUrl } from "@/lib/platform";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    d1: "error",
    auth: "error",
  };

  try {
    const db = getDb();
    const row = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    if (row?.ok === 1) checks.d1 = "ok";
  } catch {
    checks.d1 = "error";
  }

  try {
    resolveAuthSecret();
    checks.auth = "ok";
  } catch {
    checks.auth = "error";
  }

  const healthy = checks.d1 === "ok" && checks.auth === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      appUrl: resolveAppUrl(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
