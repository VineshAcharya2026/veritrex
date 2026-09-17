/** Domain types mirroring Prisma enums — used across app without @prisma/client. */

export type Role = "SUPER_ADMIN" | "MENTOR" | "MENTEE";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "FROZEN" | "DELETED";
export type MentorshipStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "REJECTED";
export type SeniorityLevel = "MID" | "SENIOR" | "EXECUTIVE" | "FOUNDER";
export type CreditType =
  | "MENTORSHIP_COMPLETED"
  | "RATING_BONUS"
  | "NATION_BUILDING_OUTCOME"
  | "FREE_MENTORSHIP"
  | "CONTENT_PUBLISHED"
  | "ADMIN_ADJUSTMENT";
export type OutcomeType =
  | "PLACED"
  | "PROMOTED"
  | "STARTED_VENTURE"
  | "CHANGED_INDUSTRY"
  | "CHANGED_JOB";
export type NationBuildingCategory =
  | "FREE_MENTORING"
  | "UNDERPRIVILEGED_MENTEES"
  | "CAREER_GROWTH"
  | "JOBS_REFERRALS"
  | "STARTUP_SUCCESS"
  | "GROUP_MENTORING"
  | "MASTERCLASSES"
  | "COMMUNITY_SERVICE"
  | "VOLUNTEER_HOURS"
  | "IMPACT_STORY";
export type NationBuildingSource = "MANUAL" | "PLATFORM";
export type NationBuildingBadge =
  | "COMMUNITY_MENTOR"
  | "CAREER_CATALYST"
  | "STARTUP_ENABLER"
  | "EDUCATION_CHAMPION"
  | "OPPORTUNITY_CREATOR"
  | "NATION_BUILDER";
export type ContentType = "POST" | "PODCAST" | "VIDEO" | "IMAGE";
export type ReactionType = "LIKE" | "CELEBRATE" | "SUPPORT" | "LOVE" | "INSIGHTFUL";
export type InnerCircleStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SessionOutcome =
  | "COMPLETED"
  | "MENTOR_NO_SHOW"
  | "MENTEE_NO_SHOW"
  | "MUTUAL_CANCEL"
  | "LATE_CANCEL";
export type TrustTier = "EMERGING" | "ESTABLISHED" | "RECOGNISED" | "DISTINGUISHED";
export type MenteeCurrentStatus =
  | "STUDENT"
  | "GRADUATE"
  | "PROFESSIONAL"
  | "ENTREPRENEUR"
  | "CAREER_BREAK"
  | "CAREER_SWITCHER";
export type MentoringFormat = "VIDEO" | "AUDIO" | "CHAT" | "GROUP" | "ASYNC";
export type StrikeReason = "NO_SHOW" | "LATE_CANCEL";
export type LeadershipLoneliness = "FREQUENTLY" | "OCCASIONALLY" | "RARELY" | "NEVER";
export type GentleCommitment = "YES_REFLECTS_INTENTIONS" | "STILL_EXPLORING";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
