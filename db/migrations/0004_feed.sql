-- Community feed posts + likes

CREATE TABLE IF NOT EXISTS "FeedPost" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "authorId"   TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "body"       TEXT,
  "mediaUrl"   TEXT,
  "storageKey" TEXT,
  "mimeType"   TEXT,
  "fileSize"   INTEGER,
  "createdAt"  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "FeedPost_createdAt_idx" ON "FeedPost" ("createdAt");
CREATE INDEX IF NOT EXISTS "FeedPost_authorId_idx" ON "FeedPost" ("authorId");

CREATE TABLE IF NOT EXISTS "FeedLike" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "postId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeedLike_postId_userId_key" ON "FeedLike" ("postId", "userId");
CREATE INDEX IF NOT EXISTS "FeedLike_userId_idx" ON "FeedLike" ("userId");
