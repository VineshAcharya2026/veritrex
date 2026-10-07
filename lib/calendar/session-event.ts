import { resolveAppUrl } from "@/lib/platform";
import {
  DEFAULT_SESSION_DURATION_MINUTES,
  type SessionCalendarEvent,
} from "@/lib/calendar/types";
import { buildCalendarLinks, type CalendarLinkSet } from "@/lib/calendar/add-links";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { deliverEmail } from "@/lib/email";
import { BRAND } from "@/lib/brand";

export function sessionEndTime(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export function defaultSessionTitle(mentorName: string, menteeName: string): string {
  return `Veritrex mentorship — ${mentorName} & ${menteeName}`;
}

export function buildSessionCalendarEvent(input: {
  sessionId: string;
  calendarUid: string;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl?: string | null;
  mentorName: string;
  menteeName: string;
  mentorEmail: string;
  menteeEmail: string;
}): SessionCalendarEvent {
  const start = input.scheduledAt;
  const end = sessionEndTime(start, input.durationMinutes);
  const when = start.toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  const description = [
    `${input.title}`,
    ``,
    `When: ${when} (Asia/Kolkata)`,
    `Duration: ${input.durationMinutes} minutes`,
    input.meetingUrl ? `Join: ${input.meetingUrl}` : "",
    ``,
    `Manage on Veritrex: ${resolveAppUrl()}/dashboard`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    uid: input.calendarUid,
    title: input.title,
    description,
    start,
    end,
    meetingUrl: input.meetingUrl,
    organizerEmail: BRAND.email,
    attendeeEmails: [input.mentorEmail, input.menteeEmail],
  };
}

export function calendarPathsForSession(sessionId: string) {
  return `/api/sessions/${sessionId}/calendar`;
}

export function calendarLinksForSession(
  event: SessionCalendarEvent,
  sessionId: string
): CalendarLinkSet {
  const path = calendarPathsForSession(sessionId);
  const icsDownloadPath = `${resolveAppUrl()}${path}`;
  return buildCalendarLinks(event, icsDownloadPath);
}

export function icsForSession(event: SessionCalendarEvent): string {
  return buildIcsCalendar(event);
}

export async function sendSessionScheduledEmails(input: {
  event: SessionCalendarEvent;
  links: CalendarLinkSet;
  mentorEmail: string;
  menteeEmail: string;
  scheduledByName: string;
}): Promise<void> {
  const { event, links } = input;
  const when = event.start.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const button = (href: string, label: string) =>
    `<p style="margin:8px 0"><a href="${href}" style="display:inline-block;padding:10px 16px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:6px">${label}</a></p>`;

  const html = [
    `<p>Your Veritrex mentorship session is scheduled for <strong>${when}</strong> (Asia/Kolkata).</p>`,
    `<p>Scheduled by ${input.scheduledByName}.</p>`,
    event.meetingUrl ? `<p><strong>Meeting link:</strong> <a href="${event.meetingUrl}">${event.meetingUrl}</a></p>` : "",
    `<p><strong>Add to your calendar:</strong></p>`,
    button(links.google, "Google Calendar"),
    button(links.outlook, "Outlook"),
    button(links.icsDownloadPath, "Download .ics (Apple & others)"),
    `<p style="color:#666;font-size:13px">You can also open Veritrex to view upcoming sessions.</p>`,
  ].join("");

  const subject = `Mentorship session scheduled: ${event.title}`;
  await deliverEmail(input.mentorEmail, subject, html);
  await deliverEmail(input.menteeEmail, subject, html);
}

export { DEFAULT_SESSION_DURATION_MINUTES };
