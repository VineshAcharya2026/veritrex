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

  const filename = `veritrex-session-${sessionId}.ics`;
  return new NextResponse(loaded.ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
