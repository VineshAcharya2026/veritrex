-- Lightweight 1:1 messaging MVP

CREATE TABLE IF NOT EXISTS "MessageThread" (
  "id"             TEXT PRIMARY KEY NOT NULL,
  "participantAId" TEXT NOT NULL,
  "participantBId" TEXT NOT NULL,
  "lastMessageAt"  TEXT NOT NULL DEFAULT (datetime('now')),
  "createdAt"      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("participantAId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("participantBId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessageThread_participants_key"
  ON "MessageThread" (
    CASE WHEN "participantAId" < "participantBId" THEN "participantAId" ELSE "participantBId" END,
    CASE WHEN "participantAId" < "participantBId" THEN "participantBId" ELSE "participantAId" END
  );

CREATE INDEX IF NOT EXISTS "MessageThread_participantAId_idx" ON "MessageThread" ("participantAId");
CREATE INDEX IF NOT EXISTS "MessageThread_participantBId_idx" ON "MessageThread" ("participantBId");

CREATE TABLE IF NOT EXISTS "Message" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "threadId"  TEXT NOT NULL,
  "senderId"  TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "readAt"    TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE,
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Message_threadId_idx" ON "Message" ("threadId");
CREATE INDEX IF NOT EXISTS "Message_threadId_createdAt_idx" ON "Message" ("threadId", "createdAt");
