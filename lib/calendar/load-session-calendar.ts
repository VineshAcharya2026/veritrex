import { prisma } from "@/lib/prisma";
import {
  buildSessionCalendarEvent,
  calendarLinksForSession,
  defaultSessionTitle,
  icsForSession,
  DEFAULT_SESSION_DURATION_MINUTES,
} from "@/lib/calendar/session-event";
import { DEFAULT_SESSION_TIMEZONE } from "@/lib/calendar/types";
import { createId } from "@/lib/db/helpers";

export async function loadSessionForCalendar(sessionId: string, userId: string) {
  const row = await prisma.mentorshipSession.findUnique({
    where: { id: sessionId },
    include: {
      mentorship: {
        include: {
          mentor: { include: { profile: true } },
          mentee: { include: { profile: true } },
        },
      },
    },
  });

  if (!row?.mentorship) return null;

  const { mentorship } = row;
  if (mentorship.mentorId !== userId && mentorship.menteeId !== userId) {
    return null;
  }

  const mentorName = mentorship.mentor.profile
    ? `${mentorship.mentor.profile.firstName} ${mentorship.mentor.profile.lastName}`.trim()
    : mentorship.mentor.email;
  const menteeName = mentorship.mentee.profile
    ? `${mentorship.mentee.profile.firstName} ${mentorship.mentee.profile.lastName}`.trim()
    : mentorship.mentee.email;

  const durationMinutes = row.durationMinutes ?? DEFAULT_SESSION_DURATION_MINUTES;
  const title =
    row.title?.trim() ||
    defaultSessionTitle(mentorName, menteeName);
  const calendarUid = row.calendarUid ?? row.id;

  const event = buildSessionCalendarEvent({
    sessionId: row.id,
    calendarUid,
    title,
    scheduledAt: new Date(row.scheduledAt),
    durationMinutes,
    meetingUrl: row.meetingUrl,
    mentorName,
    menteeName,
    mentorEmail: mentorship.mentor.email,
    menteeEmail: mentorship.mentee.email,
  });

  return {
    session: row,
    mentorship,
    event,
    links: calendarLinksForSession(event, row.id),
    ics: icsForSession(event),
    mentorName,
    menteeName,
  };
}

export function newCalendarUid(): string {
  return createId();
}

export { DEFAULT_SESSION_TIMEZONE, DEFAULT_SESSION_DURATION_MINUTES };
