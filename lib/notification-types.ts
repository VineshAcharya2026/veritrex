export const NOTIFICATION_TYPES = {
  MENTORSHIP: "MENTORSHIP",
  MENTORSHIP_REQUEST: "MENTORSHIP_REQUEST",
  MENTORSHIP_ACCEPTED: "MENTORSHIP_ACCEPTED",
  MENTORSHIP_REJECTED: "MENTORSHIP_REJECTED",
  ACCOUNT: "ACCOUNT",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export function displayName(
  profile: { firstName?: string | null; lastName?: string | null } | null | undefined,
  email?: string | null
): string {
  const first = profile?.firstName?.trim() ?? "";
  const last = profile?.lastName?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (email?.trim()) return email.trim();
  return "A member";
}

export function isMentorshipAcceptedNotification(
  type: string,
  message: string
): boolean {
  if (type === NOTIFICATION_TYPES.MENTORSHIP_ACCEPTED) return true;
  if (type === NOTIFICATION_TYPES.MENTORSHIP) {
    return /accepted/i.test(message);
  }
  return false;
}

export function isMentorshipNotificationType(type: string): boolean {
  return (
    type === NOTIFICATION_TYPES.MENTORSHIP ||
    type === NOTIFICATION_TYPES.MENTORSHIP_REQUEST ||
    type === NOTIFICATION_TYPES.MENTORSHIP_ACCEPTED ||
    type === NOTIFICATION_TYPES.MENTORSHIP_REJECTED
  );
}
