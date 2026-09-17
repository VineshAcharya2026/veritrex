-- User endorsements for TrustScore endorsement ingredient

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "UserEndorsement" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "endorserId" TEXT NOT NULL,
  "endorsedId" TEXT NOT NULL,
  "createdAt"  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("endorserId") REFERENCES "User" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("endorsedId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserEndorsement_endorserId_endorsedId_key"
  ON "UserEndorsement" ("endorserId", "endorsedId");
CREATE INDEX IF NOT EXISTS "UserEndorsement_endorsedId_idx"
  ON "UserEndorsement" ("endorsedId");
