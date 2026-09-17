import { NextResponse } from "next/server";

const DEPRECATED_MSG =
  "Legacy mentorship ratings are retired. Rate sessions at /dashboard/session/{sessionId}/rate after each completed session.";

/** @deprecated Use session-based rating flow instead. */
export async function GET() {
  return NextResponse.json(
    { error: DEPRECATED_MSG, pending: [] },
    { status: 410 }
  );
}

/** @deprecated Use POST /api/sessions/[sessionId]/rate instead. */
export async function POST() {
  return NextResponse.json({ error: DEPRECATED_MSG }, { status: 410 });
}
