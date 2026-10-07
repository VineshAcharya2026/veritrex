import type { SessionCalendarEvent } from "@/lib/calendar/types";

/** Google Calendar “create event” deep link (no OAuth). */
export function googleCalendarUrl(event: SessionCalendarEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dates = `${fmt(event.start)}/${fmt(event.end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details: event.description,
  });
  if (event.meetingUrl) params.set("location", event.meetingUrl);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook on the web compose link. */
export function outlookCalendarUrl(event: SessionCalendarEvent): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    body: event.description,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
  });
  if (event.meetingUrl) params.set("location", event.meetingUrl);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Yahoo Calendar (optional third provider). */
export function yahooCalendarUrl(event: SessionCalendarEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    v: "60",
    title: event.title,
    st: fmt(event.start),
    et: fmt(event.end),
    desc: event.description,
  });
  if (event.meetingUrl) params.set("in_loc", event.meetingUrl);
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

export type CalendarLinkSet = {
  google: string;
  outlook: string;
  yahoo: string;
  icsDownloadPath: string;
};

export function buildCalendarLinks(
  event: SessionCalendarEvent,
  icsDownloadPath: string
): CalendarLinkSet {
  return {
    google: googleCalendarUrl(event),
    outlook: outlookCalendarUrl(event),
    yahoo: yahooCalendarUrl(event),
    icsDownloadPath,
  };
}
