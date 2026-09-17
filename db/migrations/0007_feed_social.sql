-- LinkedIn-style social: reactions, comments, profile cover image

ALTER TABLE "Profile" ADD COLUMN "coverImage" TEXT;

ALTER TABLE "FeedLike" ADD COLUMN "reaction" TEXT NOT NULL DEFAULT 'LIKE';

CREATE TABLE IF NOT EXISTS "FeedComment" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "postId"    TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("postId") REFERENCES "FeedPost" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "FeedComment_postId_idx" ON "FeedComment" ("postId");
CREATE INDEX IF NOT EXISTS "FeedComment_createdAt_idx" ON "FeedComment" ("createdAt");
