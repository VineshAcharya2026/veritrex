/**
 * Prisma-compatible D1 ORM for TrustHire.
 * Self-contained query layer used via `import { prisma } from "@/lib/prisma"`.
 */

import { getDb, type D1Database } from "@/lib/db/client";
import {
  boolFromDb,
  boolToDb,
  createId,
  mapRow,
  nowIso,
  parseJsonArray,
  parseJsonObject,
  stringifyJsonArray,
  stringifyJsonObject,
} from "@/lib/db/helpers";

// ---------------------------------------------------------------------------
// Model metadata
// ---------------------------------------------------------------------------

type ModelName =
  | "user"
  | "profile"
  | "mentorProfile"
  | "menteeProfile"
  | "memberReflection"
  | "mentorship"
  | "mentorshipSession"
  | "sessionRating"
  | "reliabilityStrike"
  | "trustScoreRecord"
  | "cheatFlag"
  | "userEndorsement"
  | "mentorSkill"
  | "creditLedger"
  | "mentorshipRating"
  | "mentorshipOutcome"
  | "mentorContent"
  | "feedPost"
  | "feedLike"
  | "feedComment"
  | "feedBookmark"
  | "messageThread"
  | "message"
  | "innerCircleApplication"
  | "nationBuildingEntry"
  | "mentorNationBuildingBadge"
  | "loginEvent"
  | "auditLog"
  | "blacklist"
  | "platformConfig"
  | "notification";

type ModelMeta = {
  table: string;
  arrayFields: string[];
  boolFields: string[];
  jsonFields: string[];
  floatFields: string[];
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
  uniqueKeys: Record<string, string[]>;
};

const MODELS: Record<ModelName, ModelMeta> = {
  user: {
    table: "User",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: { id: ["id"], email: ["email"], phone: ["phone"] },
  },
  profile: {
    table: "Profile",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: false,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"], userId: ["userId"] },
  },
  mentorProfile: {
    table: "MentorProfile",
    arrayFields: [
      "expertise", 
      "interests",
      "threeWords",
      "areasOfExpertise",
      "industriesWorked",
      "preferredMenteeTypes",
      "challengesCanHelp",
      "mentoringStyle",
      "personalInterests",
      "preferredFormats",
      "languages",
    ],
    boolFields: ["isEliteFounder100", "offersFreeMentorship"],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: false,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"], userId: ["userId"] },
  },
  menteeProfile: {
    table: "MenteeProfile",
    arrayFields: ["desiredSkills", "guidanceAreas", "skillsToDevelo", "preferredModes", "languages"],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: false,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"], userId: ["userId"] },
  },
  memberReflection: {
    table: "MemberReflection",
    arrayFields: ["valuedQualities", "supportWays"],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: { id: ["id"], userId: ["userId"] },
  },
  mentorship: {
    table: "Mentorship",
    arrayFields: [],
    boolFields: ["isFreeOrConcessional"],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: {
      id: ["id"],
      mentorId_menteeId: ["mentorId", "menteeId"],
    },
  },
  mentorshipSession: {
    table: "MentorshipSession",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: { id: ["id"] },
  },
  sessionRating: {
    table: "SessionRating",
    arrayFields: [],
    boolFields: ["isUnilateral"],
    jsonFields: [],
    floatFields: ["weightedScore"],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: {
      id: ["id"],
      sessionId_raterId: ["sessionId", "raterId"],
    },
  },
  reliabilityStrike: {
    table: "ReliabilityStrike",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  trustScoreRecord: {
    table: "TrustScoreRecord",
    arrayFields: [],
    boolFields: ["tierDemotionWarned"],
    jsonFields: [],
    floatFields: [
      "verificationScore",
      "ratingScore",
      "activityScore",
      "outcomeScore",
      "endorsementScore",
      "totalScore",
    ],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: { id: ["id"], userId: ["userId"] },
  },
  cheatFlag: {
    table: "CheatFlag",
    arrayFields: [],
    boolFields: ["reviewed"],
    jsonFields: [],
    floatFields: ["pairAvgScore", "othersAvgScore"],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: { id: ["id"] },
  },
  userEndorsement: {
    table: "UserEndorsement",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: {
      id: ["id"],
      endorserId_endorsedId: ["endorserId", "endorsedId"],
    },
  },
  mentorSkill: {
    table: "MentorSkill",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: {
      id: ["id"],
      mentorId_skill: ["mentorId", "skill"],
    },
  },
  creditLedger: {
    table: "CreditLedger",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  mentorshipRating: {
    table: "MentorshipRating",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"], mentorshipId: ["mentorshipId"] },
  },
  mentorshipOutcome: {
    table: "MentorshipOutcome",
    arrayFields: [],
    boolFields: ["verified"],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: { id: ["id"] },
  },
  mentorContent: {
    table: "MentorContent",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  feedPost: {
    table: "FeedPost",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  feedLike: {
    table: "FeedLike",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: {
      id: ["id"],
      postId_userId: ["postId", "userId"],
    },
  },
  feedComment: {
    table: "FeedComment",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  feedBookmark: {
    table: "FeedBookmark",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: {
      id: ["id"],
      postId_userId: ["postId", "userId"],
    },
  },
  messageThread: {
    table: "MessageThread",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  message: {
    table: "Message",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  innerCircleApplication: {
    table: "InnerCircleApplication",
    arrayFields: [],
    boolFields: ["gentleCommitment"],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: { id: ["id"], mentorId: ["mentorId"] },
  },
  nationBuildingEntry: {
    table: "NationBuildingEntry",
    arrayFields: ["evidenceUrls"],
    boolFields: ["verified"],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: true,
    uniqueKeys: {
      id: ["id"],
      mentorId_source_externalRef: ["mentorId", "source", "externalRef"],
    },
  },
  mentorNationBuildingBadge: {
    table: "MentorNationBuildingBadge",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: false,
    hasUpdatedAt: false,
    uniqueKeys: {
      id: ["id"],
      mentorId_badge: ["mentorId", "badge"],
    },
  },
  loginEvent: {
    table: "LoginEvent",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  auditLog: {
    table: "AuditLog",
    arrayFields: [],
    boolFields: [],
    jsonFields: ["metadata"],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
  blacklist: {
    table: "Blacklist",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"], value: ["value"] },
  },
  platformConfig: {
    table: "PlatformConfig",
    arrayFields: [],
    boolFields: [],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: false,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"], key: ["key"] },
  },
  notification: {
    table: "Notification",
    arrayFields: [],
    boolFields: ["read"],
    jsonFields: [],
    floatFields: [],
    hasCreatedAt: true,
    hasUpdatedAt: false,
    uniqueKeys: { id: ["id"] },
  },
};

type RelationKind = "one" | "many";

type RelationDef = {
  model: ModelName;
  kind: RelationKind;
  localField: string;
  foreignField: string;
};

/** Parent model -> relation name -> definition */
const RELATIONS: Partial<Record<ModelName, Record<string, RelationDef>>> = {
  user: {
    profile: { model: "profile", kind: "one", localField: "id", foreignField: "userId" },
    mentorProfile: { model: "mentorProfile", kind: "one", localField: "id", foreignField: "userId" },
    menteeProfile: { model: "menteeProfile", kind: "one", localField: "id", foreignField: "userId" },
    memberReflection: { model: "memberReflection", kind: "one", localField: "id", foreignField: "userId" },
    trustScore: { model: "trustScoreRecord", kind: "one", localField: "id", foreignField: "userId" },
    mentorSessions: { model: "mentorship", kind: "many", localField: "id", foreignField: "mentorId" },
    menteeSessions: { model: "mentorship", kind: "many", localField: "id", foreignField: "menteeId" },
    loginEvents: { model: "loginEvent", kind: "many", localField: "id", foreignField: "userId" },
    auditLogs: { model: "auditLog", kind: "many", localField: "id", foreignField: "userId" },
    notifications: { model: "notification", kind: "many", localField: "id", foreignField: "userId" },
    ratingsGiven: { model: "sessionRating", kind: "many", localField: "id", foreignField: "raterId" },
    ratingsReceived: { model: "sessionRating", kind: "many", localField: "id", foreignField: "ratedUserId" },
    endorsementsGiven: { model: "userEndorsement", kind: "many", localField: "id", foreignField: "endorserId" },
    endorsementsReceived: { model: "userEndorsement", kind: "many", localField: "id", foreignField: "endorsedId" },
    feedPosts: { model: "feedPost", kind: "many", localField: "id", foreignField: "authorId" },
    feedLikes: { model: "feedLike", kind: "many", localField: "id", foreignField: "userId" },
    feedComments: { model: "feedComment", kind: "many", localField: "id", foreignField: "authorId" },
    feedBookmarks: { model: "feedBookmark", kind: "many", localField: "id", foreignField: "userId" },
    messageThreadsA: { model: "messageThread", kind: "many", localField: "id", foreignField: "participantAId" },
    messageThreadsB: { model: "messageThread", kind: "many", localField: "id", foreignField: "participantBId" },
    messagesSent: { model: "message", kind: "many", localField: "id", foreignField: "senderId" },
    nationBuildingEntries: { model: "nationBuildingEntry", kind: "many", localField: "id", foreignField: "mentorId" },
    nationBuildingBadges: { model: "mentorNationBuildingBadge", kind: "many", localField: "id", foreignField: "mentorId" },
  },
  profile: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
  mentorProfile: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
    skills: { model: "mentorSkill", kind: "many", localField: "id", foreignField: "mentorId" },
    content: { model: "mentorContent", kind: "many", localField: "id", foreignField: "mentorId" },
    creditLedger: { model: "creditLedger", kind: "many", localField: "id", foreignField: "mentorId" },
    ratingsReceived: { model: "mentorshipRating", kind: "many", localField: "id", foreignField: "mentorId" },
    innerCircleApplication: {
      model: "innerCircleApplication",
      kind: "one",
      localField: "id",
      foreignField: "mentorId",
    },
  },
  menteeProfile: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
  memberReflection: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
  mentorship: {
    mentor: { model: "user", kind: "one", localField: "mentorId", foreignField: "id" },
    mentee: { model: "user", kind: "one", localField: "menteeId", foreignField: "id" },
    rating: { model: "mentorshipRating", kind: "one", localField: "id", foreignField: "mentorshipId" },
    outcomes: { model: "mentorshipOutcome", kind: "many", localField: "id", foreignField: "mentorshipId" },
    creditEntries: { model: "creditLedger", kind: "many", localField: "id", foreignField: "mentorshipId" },
    sessions: { model: "mentorshipSession", kind: "many", localField: "id", foreignField: "mentorshipId" },
  },
  mentorshipSession: {
    mentorship: { model: "mentorship", kind: "one", localField: "mentorshipId", foreignField: "id" },
    ratings: { model: "sessionRating", kind: "many", localField: "id", foreignField: "sessionId" },
    strikes: { model: "reliabilityStrike", kind: "many", localField: "id", foreignField: "sessionId" },
  },
  sessionRating: {
    session: { model: "mentorshipSession", kind: "one", localField: "sessionId", foreignField: "id" },
    rater: { model: "user", kind: "one", localField: "raterId", foreignField: "id" },
    ratedUser: { model: "user", kind: "one", localField: "ratedUserId", foreignField: "id" },
  },
  reliabilityStrike: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
    session: { model: "mentorshipSession", kind: "one", localField: "sessionId", foreignField: "id" },
  },
  trustScoreRecord: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
  userEndorsement: {
    endorser: { model: "user", kind: "one", localField: "endorserId", foreignField: "id" },
    endorsed: { model: "user", kind: "one", localField: "endorsedId", foreignField: "id" },
  },
  mentorSkill: {
    mentor: { model: "mentorProfile", kind: "one", localField: "mentorId", foreignField: "id" },
  },
  creditLedger: {
    mentor: { model: "mentorProfile", kind: "one", localField: "mentorId", foreignField: "id" },
    mentorship: { model: "mentorship", kind: "one", localField: "mentorshipId", foreignField: "id" },
  },
  mentorshipRating: {
    mentorship: { model: "mentorship", kind: "one", localField: "mentorshipId", foreignField: "id" },
    mentor: { model: "mentorProfile", kind: "one", localField: "mentorId", foreignField: "id" },
  },
  mentorshipOutcome: {
    mentorship: { model: "mentorship", kind: "one", localField: "mentorshipId", foreignField: "id" },
  },
  mentorContent: {
    mentor: { model: "mentorProfile", kind: "one", localField: "mentorId", foreignField: "id" },
  },
  feedPost: {
    author: { model: "user", kind: "one", localField: "authorId", foreignField: "id" },
    likes: { model: "feedLike", kind: "many", localField: "id", foreignField: "postId" },
    comments: { model: "feedComment", kind: "many", localField: "id", foreignField: "postId" },
    bookmarks: { model: "feedBookmark", kind: "many", localField: "id", foreignField: "postId" },
  },
  feedLike: {
    post: { model: "feedPost", kind: "one", localField: "postId", foreignField: "id" },
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
  feedComment: {
    post: { model: "feedPost", kind: "one", localField: "postId", foreignField: "id" },
    author: { model: "user", kind: "one", localField: "authorId", foreignField: "id" },
  },
  feedBookmark: {
    post: { model: "feedPost", kind: "one", localField: "postId", foreignField: "id" },
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
  messageThread: {
    participantA: { model: "user", kind: "one", localField: "participantAId", foreignField: "id" },
    participantB: { model: "user", kind: "one", localField: "participantBId", foreignField: "id" },
    messages: { model: "message", kind: "many", localField: "id", foreignField: "threadId" },
  },
  message: {
    thread: { model: "messageThread", kind: "one", localField: "threadId", foreignField: "id" },
    sender: { model: "user", kind: "one", localField: "senderId", foreignField: "id" },
  },
  innerCircleApplication: {
    mentor: { model: "mentorProfile", kind: "one", localField: "mentorId", foreignField: "id" },
  },
  nationBuildingEntry: {
    mentor: { model: "user", kind: "one", localField: "mentorId", foreignField: "id" },
  },
  mentorNationBuildingBadge: {
    mentor: { model: "user", kind: "one", localField: "mentorId", foreignField: "id" },
  },
  loginEvent: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
  auditLog: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
  notification: {
    user: { model: "user", kind: "one", localField: "userId", foreignField: "id" },
  },
};

const COUNT_RELATIONS: Partial<Record<ModelName, Record<string, RelationDef>>> = {
  user: {
    loginEvents: { model: "loginEvent", kind: "many", localField: "id", foreignField: "userId" },
    auditLogs: { model: "auditLog", kind: "many", localField: "id", foreignField: "userId" },
  },
  mentorProfile: {
    content: { model: "mentorContent", kind: "many", localField: "id", foreignField: "mentorId" },
    ratingsReceived: { model: "mentorshipRating", kind: "many", localField: "id", foreignField: "mentorId" },
  },
  mentorshipSession: {
    strikes: { model: "reliabilityStrike", kind: "many", localField: "id", foreignField: "sessionId" },
  },
  feedPost: {
    likes: { model: "feedLike", kind: "many", localField: "id", foreignField: "postId" },
    comments: { model: "feedComment", kind: "many", localField: "id", foreignField: "postId" },
    bookmarks: { model: "feedBookmark", kind: "many", localField: "id", foreignField: "postId" },
  },
};

const NESTED_CREATES: Partial<Record<ModelName, Record<string, ModelName>>> = {
  user: {
    profile: "profile",
    mentorProfile: "mentorProfile",
    menteeProfile: "menteeProfile",
    memberReflection: "memberReflection",
  },
};

const NESTED_UPDATES: Partial<Record<ModelName, Record<string, { model: ModelName; linkField: string }>>> = {
  user: {
    profile: { model: "profile", linkField: "userId" },
    mentorProfile: { model: "mentorProfile", linkField: "userId" },
    menteeProfile: { model: "menteeProfile", linkField: "userId" },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Row = Record<string, unknown> & { id?: string };
type WhereInput = Record<string, unknown>;
type OrderByInput = Record<string, unknown> | Record<string, unknown>[];
type QueryOpts = {
  where?: WhereInput;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: OrderByInput;
  take?: number;
  skip?: number;
  distinct?: string[];
};

function qIdent(name: string): string {
  return `"${name}"`;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
}

function deserializeRow(model: ModelName, row: Row): Row {
  const meta = MODELS[model];
  const out = mapRow(row, meta.arrayFields, meta.boolFields);
  for (const field of meta.jsonFields) {
    out[field] = parseJsonObject(out[field] as string);
  }
  return out;
}

function serializeField(model: ModelName, field: string, value: unknown): unknown {
  const meta = MODELS[model];
  if (meta.arrayFields.includes(field)) return stringifyJsonArray(value);
  if (meta.boolFields.includes(field)) return boolToDb(value as boolean);
  if (meta.jsonFields.includes(field)) return stringifyJsonObject(value);
  if (value instanceof Date) return toIso(value);
  return value;
}

function allColumns(model: ModelName): string[] {
  // Derived from unique keys + common fields — expanded at runtime from row keys when needed
  const known: Record<ModelName, string[]> = {
    user: ["id", "email", "phone", "passwordHash", "role", "status", "createdAt", "updatedAt"],
    profile: ["id", "userId", "firstName", "lastName", "preferredName", "avatar", "coverImage", "bio"],
    mentorProfile: [
      "id", "userId", "company", "title", "expertise", "yearsExp", "maxMentees", "linkedInUrl",
      "city", "industry", "seniorityLevel", "interests", "isEliteFounder100", "thoughtLeadershipScore",
      "creditsBalance", "offersFreeMentorship", "freeMentorshipMinutesUsed", "professionalHeadline", "professionalSummary",
      "threeWords", "areasOfExpertise", "industriesWorked", "yearsOfExperienceRange", "whyMentor",
      "preferredMenteeTypes", "challengesCanHelp", "mentoringStyle", "sessionExpectations",
      "menteeExpectations", "achievements", "certifications", "personalInterests", "influentialQuote",
      "preferredFormats", "languages", "completeSentence", "welcomeMessage",
    ],
    menteeProfile: [
      "id", "userId", "currentRole", "goals", "desiredSkills", "country", "city", "currentStatus",
      "highestQualification", "currentInstitution", "currentDesignation", "yearsOfExperience",
      "preferredIndustry", "careerGoal", "guidanceAreas", "skillsToDevelo", "preferredMentorProfile",
      "preferredModes", "languages", "biggestChallenge", "successDefinition", "linkedInUrl",
    ],
    memberReflection: [
      "id", "userId", "introduction", "proudestAchievement", "guidingValues", "standFor",
      "admiredPerson", "meaningPurpose", "dreamMission", "societalAspiration", "othersDescribeYou",
      "valuedQualities", "energizingPeople", "differentBeliefsApproach", "confidentialityImportance",
      "supportWays", "contributions", "leadershipLoneliness", "supportNeeded", "sharingTopics",
      "rememberedFor", "additionalNotes", "gentleCommitment", "completedAt", "createdAt", "updatedAt",
    ],
    mentorship: [
      "id", "mentorId", "menteeId", "status", "message", "isFreeOrConcessional", "createdAt", "updatedAt",
    ],
    mentorshipSession: [
      "id", "mentorshipId", "scheduledAt", "completedAt", "outcome", "outcomeLoggedBy", "durationMinutes", "createdAt", "updatedAt",
    ],
    sessionRating: [
      "id", "sessionId", "raterId", "ratedUserId", "raterRole",
      "impact", "productivity", "goalAchievement", "realisticLearningPath", "approach", "mannersRespect",
      "preparedness", "taskCompletion", "sessionGoals", "implementation", "growth", "respectBehavior",
      "weightedScore", "isUnilateral", "createdAt",
    ],
    reliabilityStrike: ["id", "userId", "sessionId", "reason", "createdAt"],
    trustScoreRecord: [
      "id", "userId", "verificationScore", "ratingScore", "activityScore", "outcomeScore",
      "endorsementScore", "totalScore", "tier", "tierPromotionCycles", "tierDemotionWarned",
      "updatedAt", "createdAt",
    ],
    cheatFlag: [
      "id", "mentorUserId", "menteeUserId", "reason", "pairAvgScore", "othersAvgScore",
      "sessionCount", "reviewed", "adminNotes", "createdAt", "updatedAt",
    ],
    userEndorsement: ["id", "endorserId", "endorsedId", "createdAt"],
    mentorSkill: ["id", "mentorId", "skill", "masteryLevel", "createdAt", "updatedAt"],
    creditLedger: ["id", "mentorId", "amount", "type", "reason", "mentorshipId", "createdAt"],
    mentorshipRating: ["id", "mentorshipId", "mentorId", "menteeId", "rating", "review", "createdAt"],
    mentorshipOutcome: [
      "id", "mentorshipId", "mentorId", "outcomeType", "city", "industry", "notes", "verified",
      "createdAt", "updatedAt",
    ],
    mentorContent: [
      "id", "mentorId", "type", "title", "description", "fileUrl", "storageKey", "mimeType",
      "fileSize", "publishedAt", "createdAt",
    ],
    feedPost: [
      "id", "authorId", "type", "title", "body", "mediaUrl", "storageKey", "mimeType", "fileSize", "createdAt",
    ],
    feedLike: ["id", "postId", "userId", "reaction", "createdAt"],
    feedComment: ["id", "postId", "authorId", "body", "createdAt"],
    feedBookmark: ["id", "postId", "userId", "createdAt"],
    messageThread: ["id", "participantAId", "participantBId", "lastMessageAt", "createdAt"],
    message: ["id", "threadId", "senderId", "body", "readAt", "createdAt"],
    innerCircleApplication: [
      "id", "mentorId", "whyJoin", "whatYouBring", "nationBuildingCommit", "thoughtLeadershipRefs",
      "gentleCommitment", "status", "adminNotes", "submittedAt", "createdAt", "updatedAt",
    ],
    nationBuildingEntry: [
      "id", "mentorId", "category", "title", "description", "quantity", "eventDate", "location",
      "testimonial", "evidenceUrls", "mentorshipId", "source", "externalRef", "verified",
      "verifiedAt", "verifiedBy", "adminNotes", "createdAt", "updatedAt",
    ],
    mentorNationBuildingBadge: ["id", "mentorId", "badge", "earnedAt"],
    loginEvent: ["id", "userId", "email", "role", "ipAddress", "userAgent", "createdAt"],
    auditLog: ["id", "userId", "action", "entity", "entityId", "ipAddress", "metadata", "createdAt"],
    blacklist: ["id", "type", "value", "reason", "addedBy", "createdAt"],
    platformConfig: ["id", "key", "value"],
    notification: ["id", "userId", "message", "read", "type", "createdAt"],
  };
  return known[model];
}

// ---------------------------------------------------------------------------
// WHERE builder
// ---------------------------------------------------------------------------

type WhereBuild = { sql: string; params: unknown[] };

function buildFieldFilter(
  model: ModelName,
  alias: string,
  field: string,
  filter: unknown,
  params: unknown[]
): string {
  // Empty alias = unqualified column (UPDATE/DELETE without table alias)
  const col = alias ? `${alias}.${qIdent(field)}` : qIdent(field);

  if (filter === null || filter === undefined) return "";
  if (typeof filter !== "object" || Array.isArray(filter) || filter instanceof Date) {
    params.push(serializeField(model, field, filter));
    return `${col} = ?`;
  }

  const f = filter as Record<string, unknown>;

  if ("equals" in f) {
    const mode = f.mode as string | undefined;
    if (mode === "insensitive" && typeof f.equals === "string") {
      params.push(String(f.equals).toLowerCase());
      return `LOWER(${col}) = ?`;
    }
    params.push(serializeField(model, field, f.equals));
    return `${col} = ?`;
  }
  if ("not" in f) {
    if (f.not === null) return `${col} IS NOT NULL`;
    if (typeof f.not === "object" && f.not !== null) {
      const inner = buildFieldFilter(model, alias, field, f.not, params);
      return inner ? `NOT (${inner})` : "";
    }
    params.push(serializeField(model, field, f.not));
    return `${col} != ?`;
  }
  if ("in" in f && Array.isArray(f.in)) {
    const vals = f.in as unknown[];
    if (vals.length === 0) return "0 = 1";
    params.push(...vals.map((v) => serializeField(model, field, v)));
    return `${col} IN (${vals.map(() => "?").join(", ")})`;
  }
  if ("contains" in f && typeof f.contains === "string") {
    const needle = f.mode === "insensitive" ? f.contains.toLowerCase() : f.contains;
    params.push(`%${needle}%`);
    return f.mode === "insensitive"
      ? `LOWER(${col}) LIKE ?`
      : `${col} LIKE ?`;
  }
  if ("gt" in f) {
    params.push(f.gt instanceof Date ? toIso(f.gt) : f.gt);
    return `${col} > ?`;
  }
  if ("gte" in f) {
    params.push(f.gte instanceof Date ? toIso(f.gte) : f.gte);
    return `${col} >= ?`;
  }
  if ("lt" in f) {
    params.push(f.lt instanceof Date ? toIso(f.lt) : f.lt);
    return `${col} < ?`;
  }
  if ("lte" in f) {
    params.push(f.lte instanceof Date ? toIso(f.lte) : f.lte);
    return `${col} <= ?`;
  }
  if ("hasSome" in f && Array.isArray(f.hasSome)) {
    const items = (f.hasSome as unknown[]).map((v) => String(v).toLowerCase());
    if (items.length === 0) return "0 = 1";
    const checks = items.map((item) => {
      params.push(`%"${item}"%`);
      return `LOWER(${col}) LIKE ?`;
    });
    // fallback for json array values without quotes in storage
    for (const item of items) {
      params.push(`%${item}%`);
      checks.push(`LOWER(${col}) LIKE ?`);
    }
    return `(${checks.join(" OR ")})`;
  }

  return "";
}

function buildRelationExists(
  parentModel: ModelName,
  parentAlias: string,
  relName: string,
  relFilter: Record<string, unknown>,
  params: unknown[],
  negate = false,
  quantifier: "some" | "none" | "every" | "plain" = "plain"
): string {
  const rel = RELATIONS[parentModel]?.[relName];
  if (!rel) return "";

  const childMeta = MODELS[rel.model];
  const childAlias = `r_${relName}`;
  const link =
    rel.kind === "many"
      ? `${childAlias}.${qIdent(rel.foreignField)} = ${parentAlias}.${qIdent(rel.localField)}`
      : `${childAlias}.${qIdent(rel.foreignField)} = ${parentAlias}.${qIdent(rel.localField)}`;

  let inner = "";
  const modeKeys = ["some", "none", "every"] as const;
  let actualFilter = relFilter;
  let mode: typeof quantifier = quantifier;

  for (const key of modeKeys) {
    if (key in relFilter) {
      mode = key;
      actualFilter = relFilter[key] as Record<string, unknown>;
      break;
    }
  }

  if (mode === "some" && Object.keys(actualFilter).length === 0) {
    inner = "1 = 1";
  } else {
    inner = buildWhere(rel.model, actualFilter, childAlias, params).sql || "1 = 1";
  }

  const exists = `EXISTS (SELECT 1 FROM ${qIdent(childMeta.table)} ${childAlias} WHERE ${link} AND (${inner}))`;

  if (mode === "none" || negate) return `NOT ${exists}`;
  if (mode === "every") {
    const notMatch = buildWhere(rel.model, actualFilter, childAlias, params).sql || "1 = 1";
    return `NOT EXISTS (SELECT 1 FROM ${qIdent(childMeta.table)} ${childAlias} WHERE ${link} AND NOT (${notMatch}))`;
  }
  return exists;
}

function buildWhere(
  model: ModelName,
  where: WhereInput | undefined,
  alias: string,
  params: unknown[]
): WhereBuild {
  if (!where || Object.keys(where).length === 0) return { sql: "1 = 1", params };

  const parts: string[] = [];

  if ("AND" in where && Array.isArray(where.AND)) {
    const andParts = (where.AND as WhereInput[])
      .map((w) => buildWhere(model, w, alias, params).sql)
      .filter(Boolean);
    if (andParts.length) parts.push(`(${andParts.join(" AND ")})`);
  }

  if ("OR" in where && Array.isArray(where.OR)) {
    const orParts = (where.OR as WhereInput[])
      .map((w) => buildWhere(model, w, alias, params).sql)
      .filter(Boolean);
    if (orParts.length) parts.push(`(${orParts.join(" OR ")})`);
  }

  for (const [key, value] of Object.entries(where)) {
    if (key === "AND" || key === "OR") continue;

    const rel = RELATIONS[model]?.[key];
    if (rel && typeof value === "object" && value !== null && !Array.isArray(value)) {
      const relVal = value as Record<string, unknown>;
      if ("some" in relVal || "none" in relVal || "every" in relVal) {
        const clause = buildRelationExists(model, alias, key, relVal, params, false, "plain");
        if (clause) parts.push(clause);
      } else {
        const clause = buildRelationExists(model, alias, key, relVal, params);
        if (clause) parts.push(clause);
      }
      continue;
    }

    const clause = buildFieldFilter(model, alias, key, value, params);
    if (clause) parts.push(clause);
  }

  return { sql: parts.length ? parts.join(" AND ") : "1 = 1", params };
}

function resolveUniqueWhere(
  model: ModelName,
  where: WhereInput,
  alias = "t0"
): WhereBuild {
  const params: unknown[] = [];
  const meta = MODELS[model];

  for (const [key, fields] of Object.entries(meta.uniqueKeys)) {
    if (key in where) {
      const val = where[key];
      if (fields.length === 1) {
        return buildWhere(model, { [fields[0]]: val }, alias, params);
      }
      if (typeof val === "object" && val !== null) {
        const obj = val as Record<string, unknown>;
        const w: WhereInput = {};
        for (const f of fields) w[f] = obj[f];
        return buildWhere(model, w, alias, params);
      }
    }
  }

  return buildWhere(model, where, alias, params);
}

// ---------------------------------------------------------------------------
// ORDER BY
// ---------------------------------------------------------------------------

function buildOrderBy(model: ModelName, orderBy: OrderByInput | undefined, alias: string): string {
  if (!orderBy) return "";
  const items = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts: string[] = [];
  for (const item of items) {
    for (const [field, dir] of Object.entries(item)) {
      if (field === "_count" && typeof dir === "object" && dir !== null) {
        for (const [countField, countDir] of Object.entries(dir as Record<string, string>)) {
          parts.push(`COUNT(${alias}.${qIdent(countField)}) ${countDir === "desc" ? "DESC" : "ASC"}`);
        }
      } else {
        parts.push(`${alias}.${qIdent(field)} ${dir === "desc" ? "DESC" : "ASC"}`);
      }
    }
  }
  return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
}

// ---------------------------------------------------------------------------
// SELECT projection
// ---------------------------------------------------------------------------

function applySelect(row: Row, select?: Record<string, unknown>): Row {
  if (!select) return row;
  const out: Row = {};
  for (const [key, val] of Object.entries(select)) {
    if (val === true) out[key] = row[key];
    else if (typeof val === "object" && val !== null && key in row) {
      out[key] = row[key];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Include / relation loading
// ---------------------------------------------------------------------------

async function loadIncludes(
  db: D1Database,
  model: ModelName,
  rows: Row[],
  include?: Record<string, unknown>
): Promise<Row[]> {
  if (!include || rows.length === 0) return rows;

  const result = rows.map((r) => ({ ...r }));

  for (const [relName, relOpts] of Object.entries(include)) {
    if (relName === "_count") {
      await loadCounts(db, model, result, relOpts as Record<string, boolean>);
      continue;
    }

    const rel = RELATIONS[model]?.[relName];
    if (!rel) continue;

    const opts =
      relOpts === true
        ? {}
        : (relOpts as {
            where?: WhereInput;
            include?: Record<string, unknown>;
            select?: Record<string, unknown>;
            orderBy?: OrderByInput;
            take?: number;
          });

    const parentIds = result.map((r) => r[rel.localField] as string).filter(Boolean);

    if (rel.kind === "one") {
      const childWhere: WhereInput = {
        [rel.foreignField]: { in: parentIds },
        ...(opts.where ?? {}),
      };
      // Ensure join key survives select projection (e.g. Mentorship.id for mentorshipId)
      const selectWithJoin =
        opts.select && typeof opts.select === "object"
          ? { ...opts.select, [rel.foreignField]: true }
          : opts.select;
      const children = await queryMany(db, rel.model, {
        where: childWhere,
        include: opts.include,
        select: selectWithJoin,
        orderBy: opts.orderBy,
        take: opts.take,
      });
      const byFk = new Map(children.map((c) => [c[rel.foreignField] as string, c]));
      for (const row of result) {
        const key = row[rel.localField] as string;
        let child = byFk.get(key) ?? null;
        if (child && opts.include) {
          const [loaded] = await loadIncludes(db, rel.model, [child], opts.include);
          child = loaded;
        }
        row[relName] = child;
      }
    } else {
      for (const row of result) {
        const childWhere: WhereInput = {
          [rel.foreignField]: row[rel.localField],
          ...(opts.where ?? {}),
        };
        let children = await queryMany(db, rel.model, {
          where: childWhere,
          include: opts.include,
          select: opts.select,
          orderBy: opts.orderBy,
          take: opts.take,
        });
        if (opts.include) {
          children = await loadIncludes(db, rel.model, children, opts.include);
        }
        row[relName] = children;
      }
    }
  }

  return result;
}

async function loadCounts(
  db: D1Database,
  model: ModelName,
  rows: Row[],
  select: Record<string, boolean>
): Promise<void> {
  const countRels = COUNT_RELATIONS[model];
  if (!countRels) return;

  for (const row of rows) {
    const counts: Record<string, number> = {};
    for (const [name, enabled] of Object.entries(select)) {
      if (!enabled) continue;
      const rel = countRels[name];
      if (!rel) continue;
      const childMeta = MODELS[rel.model];
      const parentVal = row[rel.localField];
      const res = await db
        .prepare(
          `SELECT COUNT(*) as c FROM ${qIdent(childMeta.table)} WHERE ${qIdent(rel.foreignField)} = ?`
        )
        .bind(parentVal)
        .first<{ c: number }>();
      counts[name] = res?.c ?? 0;
    }
    row._count = counts;
  }
}

// ---------------------------------------------------------------------------
// Core query
// ---------------------------------------------------------------------------

async function queryMany(
  db: D1Database,
  model: ModelName,
  opts: QueryOpts = {}
): Promise<Row[]> {
  const meta = MODELS[model];
  const alias = "t0";
  const params: unknown[] = [];
  const where = buildWhere(model, opts.where, alias, params);

  let columns = "*";
  if (opts.select) {
    const cols = Object.entries(opts.select)
      .filter(([, v]) => v === true)
      .map(([k]) => `${alias}.${qIdent(k)}`);
    if (cols.length) columns = cols.join(", ");
  }

  let sql = `SELECT ${opts.distinct ? "DISTINCT " : ""}${columns} FROM ${qIdent(meta.table)} ${alias} WHERE ${where.sql}`;
  sql += buildOrderBy(model, opts.orderBy, alias);
  if (opts.skip) sql += ` OFFSET ${opts.skip}`;
  if (opts.take) sql += ` LIMIT ${opts.take}`;

  const result = await db.prepare(sql).bind(...params).all<Row>();
  let rows = (result.results ?? []).map((r) => deserializeRow(model, r));

  if (opts.select) {
    rows = rows.map((r) => applySelect(r, opts.select));
  }

  if (opts.include) {
    rows = await loadIncludes(db, model, rows, opts.include);
  }

  return rows;
}

async function queryFirst(db: D1Database, model: ModelName, opts: QueryOpts = {}): Promise<Row | null> {
  const rows = await queryMany(db, model, { ...opts, take: 1 });
  return rows[0] ?? null;
}

async function queryUnique(db: D1Database, model: ModelName, opts: QueryOpts = {}): Promise<Row | null> {
  const meta = MODELS[model];
  const alias = "t0";
  const where = resolveUniqueWhere(model, opts.where ?? {});
  let sql = `SELECT * FROM ${qIdent(meta.table)} ${alias} WHERE ${where.sql} LIMIT 1`;
  const result = await db.prepare(sql).bind(...where.params).first<Row>();
  if (!result) return null;
  let row = deserializeRow(model, result);
  if (opts.select) row = applySelect(row, opts.select);
  if (opts.include) {
    const [loaded] = await loadIncludes(db, model, [row], opts.include);
    return loaded;
  }
  return row;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function prepareCreateData(model: ModelName, data: Record<string, unknown>): Record<string, unknown> {
  const meta = MODELS[model];
  const out: Record<string, unknown> = {};
  const cols = allColumns(model);

  for (const [key, value] of Object.entries(data)) {
    if (NESTED_CREATES[model]?.[key]) continue;
    if (value === undefined) continue;
    if (cols.includes(key)) out[key] = serializeField(model, key, value);
  }

  if (!out.id) out.id = createId();
  if (meta.hasCreatedAt && !out.createdAt) out.createdAt = nowIso();
  if (meta.hasUpdatedAt && !out.updatedAt) out.updatedAt = nowIso();

  return out;
}

async function runCreate(
  db: D1Database,
  model: ModelName,
  data: Record<string, unknown>,
  opts: { include?: Record<string, unknown>; select?: Record<string, unknown> } = {}
): Promise<Row> {
  const meta = MODELS[model];
  const row = prepareCreateData(model, data);
  const keys = Object.keys(row);
  const placeholders = keys.map(() => "?").join(", ");
  const sql = `INSERT INTO ${qIdent(meta.table)} (${keys.map(qIdent).join(", ")}) VALUES (${placeholders})`;
  await db.prepare(sql).bind(...keys.map((k) => row[k])).run();

  // Nested creates
  const nested = NESTED_CREATES[model];
  if (nested) {
    for (const [relName, childModel] of Object.entries(nested)) {
      const payload = data[relName] as { create?: Record<string, unknown> } | undefined;
      if (payload?.create) {
        const linkField =
          Object.values(RELATIONS[model] ?? {}).find((r) => r.model === childModel)?.foreignField ??
          "userId";
        await runCreate(db, childModel, { ...payload.create, [linkField]: row.id });
      }
    }
  }

  const created = await queryUnique(db, model, { where: { id: row.id as string }, ...opts });
  return created!;
}

async function runUpdate(
  db: D1Database,
  model: ModelName,
  where: WhereInput,
  data: Record<string, unknown>,
  opts: { include?: Record<string, unknown>; select?: Record<string, unknown> } = {}
): Promise<Row> {
  const meta = MODELS[model];
  const existing = await queryUnique(db, model, { where });
  if (!existing) throw new Error(`Record not found for update on ${model}`);

  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (NESTED_UPDATES[model]?.[key]) continue;
    if (value === undefined) continue;

    if (typeof value === "object" && value !== null && "increment" in (value as Record<string, unknown>)) {
      const inc = (value as { increment: number }).increment;
      sets.push(`${qIdent(key)} = ${qIdent(key)} + ?`);
      params.push(inc);
      continue;
    }

    sets.push(`${qIdent(key)} = ?`);
    params.push(serializeField(model, key, value));
  }

  if (meta.hasUpdatedAt) {
    sets.push(`${qIdent("updatedAt")} = ?`);
    params.push(nowIso());
  }

  if (sets.length) {
    // UPDATE has no table alias — use unqualified WHERE columns
    const w = resolveUniqueWhere(model, where, "");
    const sql = `UPDATE ${qIdent(meta.table)} SET ${sets.join(", ")} WHERE ${w.sql}`;
    await db.prepare(sql).bind(...params, ...w.params).run();
  }

  // Nested updates
  const nested = NESTED_UPDATES[model];
  if (nested) {
    for (const [relName, cfg] of Object.entries(nested)) {
      const payload = data[relName] as { update?: Record<string, unknown> } | undefined;
      if (payload?.update) {
        await runUpdate(db, cfg.model, { [cfg.linkField]: existing.id }, payload.update);
      }
    }
  }

  const id = existing.id as string;
  return (await queryUnique(db, model, { where: { id }, ...opts }))!;
}

async function runUpsert(
  db: D1Database,
  model: ModelName,
  args: { where: WhereInput; create: Record<string, unknown>; update: Record<string, unknown>; include?: Record<string, unknown>; select?: Record<string, unknown> }
): Promise<Row> {
  const existing = await queryUnique(db, model, { where: args.where });
  if (existing) {
    return runUpdate(db, model, args.where, args.update, args);
  }
  const createData = { ...args.create };
  // Merge unique where fields into create
  const w = args.where;
  for (const fields of Object.values(MODELS[model].uniqueKeys)) {
    if (fields.length === 1 && w[fields[0]] !== undefined) {
      createData[fields[0]] = w[fields[0]];
    }
  }
  for (const [key, val] of Object.entries(w)) {
    if (MODELS[model].uniqueKeys[key] && typeof val === "object" && val !== null) {
      Object.assign(createData, val);
    }
  }
  return runCreate(db, model, createData, args);
}

async function runDelete(db: D1Database, model: ModelName, where: WhereInput): Promise<Row> {
  const existing = await queryUnique(db, model, { where });
  if (!existing) throw new Error(`Record not found for delete on ${model}`);
  const w = resolveUniqueWhere(model, where, "");
  await db
    .prepare(`DELETE FROM ${qIdent(MODELS[model].table)} WHERE ${w.sql}`)
    .bind(...w.params)
    .run();
  return existing;
}

async function runDeleteMany(db: D1Database, model: ModelName, where?: WhereInput): Promise<{ count: number }> {
  const params: unknown[] = [];
  const w = buildWhere(model, where, "", params);
  const result = await db
    .prepare(`DELETE FROM ${qIdent(MODELS[model].table)} WHERE ${w.sql}`)
    .bind(...params)
    .run();
  return { count: result.meta?.changes ?? 0 };
}

async function runCreateMany(
  db: D1Database,
  model: ModelName,
  data: Record<string, unknown>[]
): Promise<{ count: number }> {
  let count = 0;
  for (const item of data) {
    await runCreate(db, model, item);
    count++;
  }
  return { count };
}

async function runUpdateMany(
  db: D1Database,
  model: ModelName,
  args: { where?: WhereInput; data: Record<string, unknown> }
): Promise<{ count: number }> {
  const meta = MODELS[model];
  const params: unknown[] = [];
  const w = buildWhere(model, args.where, "", params);

  const sets: string[] = [];
  const setParams: unknown[] = [];
  for (const [key, value] of Object.entries(args.data)) {
    if (value === undefined) continue;
    if (typeof value === "object" && value !== null && "increment" in (value as Record<string, unknown>)) {
      sets.push(`${qIdent(key)} = ${qIdent(key)} + ?`);
      setParams.push((value as { increment: number }).increment);
    } else {
      sets.push(`${qIdent(key)} = ?`);
      setParams.push(serializeField(model, key, value));
    }
  }
  if (meta.hasUpdatedAt) {
    sets.push(`${qIdent("updatedAt")} = ?`);
    setParams.push(nowIso());
  }
  if (!sets.length) return { count: 0 };

  const result = await db
    .prepare(`UPDATE ${qIdent(meta.table)} SET ${sets.join(", ")} WHERE ${w.sql}`)
    .bind(...setParams, ...params)
    .run();
  return { count: result.meta?.changes ?? 0 };
}

async function runCount(db: D1Database, model: ModelName, where?: WhereInput): Promise<number> {
  const alias = "t0";
  const params: unknown[] = [];
  const w = buildWhere(model, where, alias, params);
  const res = await db
    .prepare(`SELECT COUNT(*) as c FROM ${qIdent(MODELS[model].table)} ${alias} WHERE ${w.sql}`)
    .bind(...params)
    .first<{ c: number }>();
  return res?.c ?? 0;
}

async function runAggregate(
  db: D1Database,
  model: ModelName,
  args: { where?: WhereInput; _avg?: Record<string, boolean>; _sum?: Record<string, boolean>; _count?: boolean | Record<string, boolean> }
): Promise<Record<string, unknown>> {
  const alias = "t0";
  const params: unknown[] = [];
  const w = buildWhere(model, args.where, alias, params);
  const selects: string[] = [];

  if (args._avg) {
    for (const [field, enabled] of Object.entries(args._avg)) {
      if (enabled) selects.push(`AVG(${alias}.${qIdent(field)}) as avg_${field}`);
    }
  }
  if (args._sum) {
    for (const [field, enabled] of Object.entries(args._sum)) {
      if (enabled) selects.push(`SUM(${alias}.${qIdent(field)}) as sum_${field}`);
    }
  }
  if (args._count) {
    selects.push(`COUNT(*) as cnt`);
  }
  if (!selects.length) selects.push("COUNT(*) as cnt");

  const row = await db
    .prepare(`SELECT ${selects.join(", ")} FROM ${qIdent(MODELS[model].table)} ${alias} WHERE ${w.sql}`)
    .bind(...params)
    .first<Record<string, unknown>>();

  const out: Record<string, unknown> = {};
  if (args._avg) {
    out._avg = {};
    for (const [field, enabled] of Object.entries(args._avg)) {
      if (enabled) (out._avg as Record<string, unknown>)[field] = row?.[`avg_${field}`] ?? null;
    }
  }
  if (args._sum) {
    out._sum = {};
    for (const [field, enabled] of Object.entries(args._sum)) {
      if (enabled) (out._sum as Record<string, unknown>)[field] = row?.[`sum_${field}`] ?? null;
    }
  }
  if (args._count) {
    out._count = row?.cnt ?? 0;
  }
  return out;
}

async function runGroupBy(
  db: D1Database,
  model: ModelName,
  args: {
    by: string[];
    where?: WhereInput;
    _count?: Record<string, boolean>;
    orderBy?: OrderByInput;
  }
): Promise<Row[]> {
  const meta = MODELS[model];
  const alias = "t0";
  const params: unknown[] = [];
  const w = buildWhere(model, args.where, alias, params);

  const groupCols = args.by.map((b) => `${alias}.${qIdent(b)}`).join(", ");
  const countField =
    args._count && Object.keys(args._count).find((k) => args._count![k])
      ? Object.keys(args._count).find((k) => args._count![k])!
      : "id";

  let sql = `SELECT ${groupCols}, COUNT(${alias}.${qIdent(countField)}) as _count_id FROM ${qIdent(meta.table)} ${alias} WHERE ${w.sql} GROUP BY ${groupCols}`;
  if (args.orderBy) {
    const items = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
    for (const item of items) {
      if ("_count" in item && typeof item._count === "object" && item._count !== null) {
        const dir = Object.values(item._count as Record<string, string>)[0];
        sql += ` ORDER BY _count_id ${dir === "desc" ? "DESC" : "ASC"}`;
      } else {
        sql += buildOrderBy(model, item, alias);
      }
    }
  }

  const result = await db.prepare(sql).bind(...params).all<Row>();
  return (result.results ?? []).map((r) => {
    const row: Row = {};
    for (const b of args.by) row[b] = r[b];
    row._count = { [countField]: r._count_id as number };
    return row;
  });
}

async function runDistinctMany(
  db: D1Database,
  model: ModelName,
  opts: QueryOpts
): Promise<Row[]> {
  if (!opts.distinct?.length) return queryMany(db, model, opts);
  const meta = MODELS[model];
  const alias = "t0";
  const params: unknown[] = [];
  const w = buildWhere(model, opts.where, alias, params);
  const distinctCols = opts.distinct.map((d) => `${alias}.${qIdent(d)}`).join(", ");

  let sql = `SELECT ${distinctCols} FROM ${qIdent(meta.table)} ${alias} WHERE ${w.sql} GROUP BY ${distinctCols}`;
  if (opts.take) sql += ` LIMIT ${opts.take}`;

  const result = await db.prepare(sql).bind(...params).all<Row>();
  let rows = (result.results ?? []).map((r) => deserializeRow(model, r));
  if (opts.select) rows = rows.map((r) => applySelect(r, opts.select));
  return rows;
}

// ---------------------------------------------------------------------------
// Model delegate
// ---------------------------------------------------------------------------

function createModelDelegate(db: D1Database, model: ModelName) {
  return {
    findUnique: (args: QueryOpts & { where: WhereInput }): Promise<any> =>
      queryUnique(db, model, args),
    findFirst: (args: QueryOpts = {}): Promise<any> => queryFirst(db, model, args),
    findMany: (args: QueryOpts = {}): Promise<any[]> =>
      args.distinct ? runDistinctMany(db, model, args) : queryMany(db, model, args),
    create: (args: {
      data: Record<string, unknown>;
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }): Promise<any> => runCreate(db, model, args.data, args),
    update: (args: {
      where: WhereInput;
      data: Record<string, unknown>;
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }): Promise<any> => runUpdate(db, model, args.where, args.data, args),
    upsert: (args: {
      where: WhereInput;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }): Promise<any> => runUpsert(db, model, args),
    delete: (args: { where: WhereInput }): Promise<any> => runDelete(db, model, args.where),
    deleteMany: (args: { where?: WhereInput } = {}): Promise<{ count: number }> =>
      runDeleteMany(db, model, args.where),
    createMany: (args: { data: Record<string, unknown>[] }): Promise<{ count: number }> =>
      runCreateMany(db, model, args.data),
    updateMany: (args: { where?: WhereInput; data: Record<string, unknown> }): Promise<{ count: number }> =>
      runUpdateMany(db, model, args),
    count: (args: { where?: WhereInput } = {}): Promise<number> => runCount(db, model, args.where),
    aggregate: (args: {
      where?: WhereInput;
      _avg?: Record<string, boolean>;
      _sum?: Record<string, boolean>;
      _count?: boolean | Record<string, boolean>;
    }): Promise<any> => runAggregate(db, model, args),
    groupBy: (args: {
      by: string[];
      where?: WhereInput;
      _count?: Record<string, boolean>;
      orderBy?: OrderByInput;
    }): Promise<any[]> => runGroupBy(db, model, args),
  };
}

// ---------------------------------------------------------------------------
// Database client
// ---------------------------------------------------------------------------

type ModelDelegate = ReturnType<typeof createModelDelegate>;

type DbClientBase = Record<ModelName, ModelDelegate> & {
  $transaction: <T>(fn: (tx: DbClient) => Promise<T>) => Promise<T>;
  $queryRaw: <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
  $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<number>;
};

export type DbClient = DbClientBase;

export function createDb(database?: D1Database): DbClient {
  const conn = database ?? getDb();

  const models = {} as Record<ModelName, ModelDelegate>;
  for (const name of Object.keys(MODELS) as ModelName[]) {
    models[name] = createModelDelegate(conn, name);
  }

  const client: DbClient = {
    ...models,
    $transaction: async <T>(fn: (tx: DbClient) => Promise<T>): Promise<T> => {
      // D1 batch does not support interactive transactions; run sequentially.
      const tx = createDb(conn);
      return fn(tx);
    },
    $queryRaw: async <T = unknown>(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): Promise<T> => {
      let sql = strings[0] ?? "";
      for (let i = 0; i < values.length; i++) {
        sql += "?" + (strings[i + 1] ?? "");
      }
      const result = await conn.prepare(sql).bind(...values).all();
      return (result.results ?? []) as T;
    },
    $executeRaw: async (
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): Promise<number> => {
      let sql = strings[0] ?? "";
      for (let i = 0; i < values.length; i++) {
        sql += "?" + (strings[i + 1] ?? "");
      }
      const result = await conn.prepare(sql).bind(...values).run();
      return result.meta?.changes ?? 0;
    },
  };

  return client;
}

let dbSingleton: DbClient | undefined;

function getDbClient(): DbClient {
  if (!dbSingleton) {
    dbSingleton = createDb();
  }
  return dbSingleton;
}

export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    const client = getDbClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
