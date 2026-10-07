import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadSessionForCalendar } from "@/lib/calendar/load-session-calendar";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { sessionId } = await params;
  const loaded = await loadSessionForCalendar(sessionId, session.user.id);
  if (!loaded) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(loaded.links);
}
