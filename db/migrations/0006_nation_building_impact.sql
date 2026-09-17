-- Nation Building & Impact Score: structured contribution entries + auto-awarded badges

CREATE TABLE IF NOT EXISTS "NationBuildingEntry" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "mentorId"     TEXT NOT NULL,
  "category"     TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "quantity"     INTEGER NOT NULL DEFAULT 0,
  "eventDate"    TEXT,
  "location"     TEXT,
  "testimonial"  TEXT,
  "evidenceUrls" TEXT NOT NULL DEFAULT '[]',
  "mentorshipId" TEXT,
  "source"       TEXT NOT NULL DEFAULT 'MANUAL',
  "externalRef"  TEXT,
  "verified"     INTEGER NOT NULL DEFAULT 0,
  "verifiedAt"   TEXT,
  "verifiedBy"   TEXT,
  "adminNotes"   TEXT,
  "createdAt"    TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt"    TEXT NOT NULL,
  FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "NationBuildingEntry_mentorId_idx" ON "NationBuildingEntry" ("mentorId");
CREATE INDEX IF NOT EXISTS "NationBuildingEntry_category_idx" ON "NationBuildingEntry" ("category");
CREATE UNIQUE INDEX IF NOT EXISTS "NationBuildingEntry_mentorId_source_externalRef_key"
  ON "NationBuildingEntry" ("mentorId", "source", "externalRef");

CREATE TABLE IF NOT EXISTS "MentorNationBuildingBadge" (
  "id"       TEXT PRIMARY KEY NOT NULL,
  "mentorId" TEXT NOT NULL,
  "badge"    TEXT NOT NULL,
  "earnedAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MentorNationBuildingBadge_mentorId_badge_key"
  ON "MentorNationBuildingBadge" ("mentorId", "badge");
CREATE INDEX IF NOT EXISTS "MentorNationBuildingBadge_mentorId_idx" ON "MentorNationBuildingBadge" ("mentorId");
