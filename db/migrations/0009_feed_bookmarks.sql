-- Saved feed posts (bookmarks)

CREATE TABLE IF NOT EXISTS "FeedBookmark" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "postId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeedBookmark_postId_userId_key" ON "FeedBookmark" ("postId", "userId");
CREATE INDEX IF NOT EXISTS "FeedBookmark_userId_idx" ON "FeedBookmark" ("userId");
