export type SessionCalendarEvent = {
  uid: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  meetingUrl?: string | null;
  organizerEmail: string;
  attendeeEmails: string[];
};

export const DEFAULT_SESSION_DURATION_MINUTES = 60;
export const DEFAULT_SESSION_TIMEZONE = "Asia/Kolkata";
