-- Initial schema migration for Cloudflare D1 / SQLite
-- Translated from prisma/schema.prisma

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "email"        TEXT NOT NULL,
  "phone"        TEXT,
  "passwordHash" TEXT NOT NULL,
  "role"         TEXT NOT NULL DEFAULT 'MENTEE',
  "status"       TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"    TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"    TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User" ("phone");

-- ---------------------------------------------------------------------------
-- MemberReflection
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MemberReflection" (
  "id"                        TEXT PRIMARY KEY NOT NULL,
  "userId"                    TEXT NOT NULL,
  "introduction"              TEXT,
  "proudestAchievement"       TEXT,
  "guidingValues"             TEXT,
  "standFor"                  TEXT,
  "admiredPerson"             TEXT,
  "meaningPurpose"            TEXT,
  "dreamMission"              TEXT,
  "societalAspiration"        TEXT,
  "othersDescribeYou"         TEXT,
  "valuedQualities"           TEXT NOT NULL DEFAULT '[]',
  "energizingPeople"          TEXT,
  "differentBeliefsApproach"  TEXT,
  "confidentialityImportance" INTEGER,
  "supportWays"               TEXT NOT NULL DEFAULT '[]',
  "contributions"             TEXT,
  "leadershipLoneliness"      TEXT,
  "supportNeeded"             TEXT,
  "sharingTopics"             TEXT,
  "rememberedFor"             TEXT,
  "additionalNotes"           TEXT,
  "gentleCommitment"          TEXT,
  "completedAt"               TEXT,
  "createdAt"                 TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"                 TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MemberReflection_userId_key" ON "MemberReflection" ("userId");
CREATE INDEX IF NOT EXISTS "MemberReflection_userId_idx" ON "MemberReflection" ("userId");

-- ---------------------------------------------------------------------------
-- Profile
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Profile" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName"  TEXT NOT NULL,
  "avatar"    TEXT,
  "bio"       TEXT,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" ON "Profile" ("userId");
CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile" ("userId");

-- ---------------------------------------------------------------------------
-- MentorProfile
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MentorProfile" (
  "id"                     TEXT PRIMARY KEY NOT NULL,
  "userId"                 TEXT NOT NULL,
  "company"                TEXT,
  "title"                  TEXT,
  "expertise"              TEXT NOT NULL DEFAULT '[]',
  "yearsExp"               INTEGER,
  "maxMentees"             INTEGER NOT NULL DEFAULT 5,
  "linkedInUrl"            TEXT,
  "city"                   TEXT,
  "industry"               TEXT,
  "seniorityLevel"         TEXT,
  "interests"              TEXT NOT NULL DEFAULT '[]',
  "isEliteFounder100"      INTEGER NOT NULL DEFAULT 0,
  "thoughtLeadershipScore" INTEGER NOT NULL DEFAULT 0,
  "creditsBalance"         INTEGER NOT NULL DEFAULT 0,
  "offersFreeMentorship"   INTEGER NOT NULL DEFAULT 0,
  "professionalHeadline"   TEXT,
  "professionalSummary"    TEXT,
  "threeWords"             TEXT NOT NULL DEFAULT '[]',
  "areasOfExpertise"       TEXT NOT NULL DEFAULT '[]',
  "industriesWorked"       TEXT NOT NULL DEFAULT '[]',
  "yearsOfExperienceRange" TEXT,
  "whyMentor"              TEXT,
  "preferredMenteeTypes"   TEXT NOT NULL DEFAULT '[]',
  "challengesCanHelp"      TEXT NOT NULL DEFAULT '[]',
  "mentoringStyle"         TEXT NOT NULL DEFAULT '[]',
  "sessionExpectations"    TEXT,
  "menteeExpectations"     TEXT,
  "achievements"           TEXT,
  "certifications"         TEXT,
  "personalInterests"      TEXT NOT NULL DEFAULT '[]',
  "influentialQuote"       TEXT,
  "preferredFormats"       TEXT NOT NULL DEFAULT '[]',
  "languages"              TEXT NOT NULL DEFAULT '[]',
  "completeSentence"       TEXT,
  "welcomeMessage"         TEXT,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MentorProfile_userId_key" ON "MentorProfile" ("userId");
CREATE INDEX IF NOT EXISTS "MentorProfile_userId_idx" ON "MentorProfile" ("userId");

-- ---------------------------------------------------------------------------
-- MenteeProfile
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MenteeProfile" (
  "id"                     TEXT PRIMARY KEY NOT NULL,
  "userId"                 TEXT NOT NULL,
  "currentRole"            TEXT,
  "goals"                  TEXT,
  "desiredSkills"          TEXT NOT NULL DEFAULT '[]',
  "country"                TEXT,
  "city"                   TEXT,
  "currentStatus"          TEXT,
  "highestQualification"   TEXT,
  "currentInstitution"     TEXT,
  "currentDesignation"     TEXT,
  "yearsOfExperience"      TEXT,
  "preferredIndustry"      TEXT,
  "careerGoal"             TEXT,
  "guidanceAreas"          TEXT NOT NULL DEFAULT '[]',
  "skillsToDevelo"         TEXT NOT NULL DEFAULT '[]',
  "preferredMentorProfile" TEXT,
  "preferredModes"         TEXT NOT NULL DEFAULT '[]',
  "languages"              TEXT NOT NULL DEFAULT '[]',
  "biggestChallenge"       TEXT,
  "successDefinition"      TEXT,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MenteeProfile_userId_key" ON "MenteeProfile" ("userId");
CREATE INDEX IF NOT EXISTS "MenteeProfile_userId_idx" ON "MenteeProfile" ("userId");

-- ---------------------------------------------------------------------------
-- Mentorship
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Mentorship" (
  "id"                   TEXT PRIMARY KEY NOT NULL,
  "mentorId"             TEXT NOT NULL,
  "menteeId"             TEXT NOT NULL,
  "status"               TEXT NOT NULL DEFAULT 'PENDING',
  "message"              TEXT,
  "isFreeOrConcessional" INTEGER NOT NULL DEFAULT 0,
  "createdAt"            TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"            TEXT NOT NULL,
  FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("menteeId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Mentorship_mentorId_menteeId_key" ON "Mentorship" ("mentorId", "menteeId");
CREATE INDEX IF NOT EXISTS "Mentorship_mentorId_idx" ON "Mentorship" ("mentorId");
CREATE INDEX IF NOT EXISTS "Mentorship_menteeId_idx" ON "Mentorship" ("menteeId");

-- ---------------------------------------------------------------------------
-- MentorshipSession
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MentorshipSession" (
  "id"              TEXT PRIMARY KEY NOT NULL,
  "mentorshipId"    TEXT NOT NULL,
  "scheduledAt"     TEXT NOT NULL,
  "completedAt"     TEXT,
  "outcome"         TEXT,
  "outcomeLoggedBy" TEXT,
  "createdAt"       TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"       TEXT NOT NULL,
  FOREIGN KEY ("mentorshipId") REFERENCES "Mentorship" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "MentorshipSession_mentorshipId_idx" ON "MentorshipSession" ("mentorshipId");

-- ---------------------------------------------------------------------------
-- SessionRating
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SessionRating" (
  "id"                TEXT PRIMARY KEY NOT NULL,
  "sessionId"         TEXT NOT NULL,
  "raterId"           TEXT NOT NULL,
  "ratedUserId"       TEXT NOT NULL,
  "raterRole"         TEXT NOT NULL,
  "knowledge"         INTEGER,
  "actionability"     INTEGER,
  "preparation"       INTEGER,
  "clarity"           INTEGER,
  "responsiveness"    INTEGER,
  "goalClarity"       INTEGER,
  "menteePreparation" INTEGER,
  "engagement"        INTEGER,
  "followThrough"     INTEGER,
  "weightedScore"     REAL NOT NULL,
  "isUnilateral"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("sessionId") REFERENCES "MentorshipSession" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("raterId") REFERENCES "User" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("ratedUserId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SessionRating_sessionId_raterId_key" ON "SessionRating" ("sessionId", "raterId");
CREATE INDEX IF NOT EXISTS "SessionRating_sessionId_idx" ON "SessionRating" ("sessionId");
CREATE INDEX IF NOT EXISTS "SessionRating_raterId_idx" ON "SessionRating" ("raterId");
CREATE INDEX IF NOT EXISTS "SessionRating_ratedUserId_idx" ON "SessionRating" ("ratedUserId");

-- ---------------------------------------------------------------------------
-- ReliabilityStrike
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ReliabilityStrike" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "reason"    TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("sessionId") REFERENCES "MentorshipSession" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ReliabilityStrike_userId_idx" ON "ReliabilityStrike" ("userId");
CREATE INDEX IF NOT EXISTS "ReliabilityStrike_sessionId_idx" ON "ReliabilityStrike" ("sessionId");

-- ---------------------------------------------------------------------------
-- TrustScoreRecord
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "TrustScoreRecord" (
  "id"                  TEXT PRIMARY KEY NOT NULL,
  "userId"              TEXT NOT NULL,
  "verificationScore"   REAL NOT NULL DEFAULT 0,
  "ratingScore"         REAL NOT NULL DEFAULT 0,
  "activityScore"       REAL NOT NULL DEFAULT 0,
  "outcomeScore"        REAL NOT NULL DEFAULT 0,
  "endorsementScore"    REAL NOT NULL DEFAULT 0,
  "totalScore"          REAL NOT NULL DEFAULT 0,
  "tier"                TEXT NOT NULL DEFAULT 'EMERGING',
  "tierPromotionCycles" INTEGER NOT NULL DEFAULT 0,
  "tierDemotionWarned"  INTEGER NOT NULL DEFAULT 0,
  "updatedAt"           TEXT NOT NULL,
  "createdAt"           TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustScoreRecord_userId_key" ON "TrustScoreRecord" ("userId");
CREATE INDEX IF NOT EXISTS "TrustScoreRecord_userId_idx" ON "TrustScoreRecord" ("userId");

-- ---------------------------------------------------------------------------
-- CheatFlag
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "CheatFlag" (
  "id"             TEXT PRIMARY KEY NOT NULL,
  "mentorUserId"   TEXT NOT NULL,
  "menteeUserId"   TEXT NOT NULL,
  "reason"         TEXT NOT NULL,
  "pairAvgScore"   REAL,
  "othersAvgScore" REAL,
  "sessionCount"   INTEGER,
  "reviewed"       INTEGER NOT NULL DEFAULT 0,
  "adminNotes"     TEXT,
  "createdAt"      TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "CheatFlag_mentorUserId_idx" ON "CheatFlag" ("mentorUserId");
CREATE INDEX IF NOT EXISTS "CheatFlag_menteeUserId_idx" ON "CheatFlag" ("menteeUserId");

-- ---------------------------------------------------------------------------
-- MentorSkill
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MentorSkill" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "mentorId"     TEXT NOT NULL,
  "skill"        TEXT NOT NULL,
  "masteryLevel" INTEGER NOT NULL DEFAULT 1,
  "createdAt"    TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"    TEXT NOT NULL,
  FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MentorSkill_mentorId_skill_key" ON "MentorSkill" ("mentorId", "skill");
CREATE INDEX IF NOT EXISTS "MentorSkill_mentorId_idx" ON "MentorSkill" ("mentorId");

-- ---------------------------------------------------------------------------
-- CreditLedger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "CreditLedger" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "mentorId"     TEXT NOT NULL,
  "amount"       INTEGER NOT NULL,
  "type"         TEXT NOT NULL,
  "reason"       TEXT,
  "mentorshipId" TEXT,
  "createdAt"    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("mentorshipId") REFERENCES "Mentorship" ("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "CreditLedger_mentorId_idx" ON "CreditLedger" ("mentorId");
CREATE INDEX IF NOT EXISTS "CreditLedger_mentorshipId_idx" ON "CreditLedger" ("mentorshipId");

-- ---------------------------------------------------------------------------
-- MentorshipRating
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MentorshipRating" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "mentorshipId" TEXT NOT NULL,
  "mentorId"     TEXT NOT NULL,
  "menteeId"     TEXT NOT NULL,
  "rating"       INTEGER NOT NULL,
  "review"       TEXT,
  "createdAt"    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("mentorshipId") REFERENCES "Mentorship" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MentorshipRating_mentorshipId_key" ON "MentorshipRating" ("mentorshipId");
CREATE INDEX IF NOT EXISTS "MentorshipRating_mentorshipId_idx" ON "MentorshipRating" ("mentorshipId");
CREATE INDEX IF NOT EXISTS "MentorshipRating_mentorId_idx" ON "MentorshipRating" ("mentorId");

-- ---------------------------------------------------------------------------
-- MentorshipOutcome
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MentorshipOutcome" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "mentorshipId" TEXT NOT NULL,
  "mentorId"     TEXT NOT NULL,
  "outcomeType"  TEXT NOT NULL,
  "city"         TEXT,
  "industry"     TEXT,
  "notes"        TEXT,
  "verified"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"    TEXT NOT NULL,
  FOREIGN KEY ("mentorshipId") REFERENCES "Mentorship" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "MentorshipOutcome_mentorshipId_idx" ON "MentorshipOutcome" ("mentorshipId");
CREATE INDEX IF NOT EXISTS "MentorshipOutcome_mentorId_idx" ON "MentorshipOutcome" ("mentorId");

-- ---------------------------------------------------------------------------
-- MentorContent
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MentorContent" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "mentorId"    TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "fileUrl"     TEXT NOT NULL,
  "storageKey"  TEXT,
  "mimeType"    TEXT,
  "fileSize"    INTEGER,
  "publishedAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "createdAt"   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "MentorContent_mentorId_idx" ON "MentorContent" ("mentorId");

-- ---------------------------------------------------------------------------
-- InnerCircleApplication
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "InnerCircleApplication" (
  "id"                    TEXT PRIMARY KEY NOT NULL,
  "mentorId"              TEXT NOT NULL,
  "whyJoin"               TEXT,
  "whatYouBring"          TEXT,
  "nationBuildingCommit"  TEXT,
  "thoughtLeadershipRefs" TEXT,
  "gentleCommitment"      INTEGER NOT NULL DEFAULT 0,
  "status"                TEXT NOT NULL DEFAULT 'PENDING',
  "adminNotes"            TEXT,
  "submittedAt"           TEXT,
  "createdAt"             TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"             TEXT NOT NULL,
  FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "InnerCircleApplication_mentorId_key" ON "InnerCircleApplication" ("mentorId");
CREATE INDEX IF NOT EXISTS "InnerCircleApplication_mentorId_idx" ON "InnerCircleApplication" ("mentorId");

-- ---------------------------------------------------------------------------
-- LoginEvent
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "LoginEvent" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "role"      TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "LoginEvent_userId_idx" ON "LoginEvent" ("userId");

-- ---------------------------------------------------------------------------
-- AuditLog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT,
  "action"    TEXT NOT NULL,
  "entity"    TEXT NOT NULL,
  "entityId"  TEXT,
  "ipAddress" TEXT,
  "metadata"  TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("userId") REFERENCES "User" ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog" ("userId");

-- ---------------------------------------------------------------------------
-- Blacklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Blacklist" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "type"      TEXT NOT NULL,
  "value"     TEXT NOT NULL,
  "reason"    TEXT,
  "addedBy"   TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "Blacklist_value_key" ON "Blacklist" ("value");

-- ---------------------------------------------------------------------------
-- PlatformConfig
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PlatformConfig" (
  "id"    TEXT PRIMARY KEY NOT NULL,
  "key"   TEXT NOT NULL,
  "value" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformConfig_key_key" ON "PlatformConfig" ("key");

-- ---------------------------------------------------------------------------
-- Notification
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "read"      INTEGER NOT NULL DEFAULT 0,
  "type"      TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification" ("userId");
