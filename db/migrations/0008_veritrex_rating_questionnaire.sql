-- VERITREX post-session rating questionnaire: 6+6 dimensions, fresh start

-- Wipe legacy ratings (old 5/4-question schema is incompatible)
DELETE FROM "SessionRating";

-- Recreate table with VERITREX columns (SQLite-safe; data already cleared)
DROP TABLE IF EXISTS "SessionRating";

CREATE TABLE "SessionRating" (
  "id"                    TEXT PRIMARY KEY NOT NULL,
  "sessionId"             TEXT NOT NULL,
  "raterId"               TEXT NOT NULL,
  "ratedUserId"           TEXT NOT NULL,
  "raterRole"             TEXT NOT NULL,
  "impact"                INTEGER,
  "productivity"          INTEGER,
  "goalAchievement"       INTEGER,
  "realisticLearningPath" INTEGER,
  "approach"              INTEGER,
  "mannersRespect"        INTEGER,
  "preparedness"          INTEGER,
  "taskCompletion"        INTEGER,
  "sessionGoals"          INTEGER,
  "implementation"        INTEGER,
  "growth"                INTEGER,
  "respectBehavior"       INTEGER,
  "weightedScore"         REAL NOT NULL,
  "isUnilateral"          INTEGER NOT NULL DEFAULT 0,
  "createdAt"             TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("sessionId") REFERENCES "MentorshipSession" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("raterId") REFERENCES "User" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("ratedUserId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "SessionRating_sessionId_raterId_key" ON "SessionRating" ("sessionId", "raterId");
CREATE INDEX "SessionRating_sessionId_idx" ON "SessionRating" ("sessionId");
CREATE INDEX "SessionRating_raterId_idx" ON "SessionRating" ("raterId");
CREATE INDEX "SessionRating_ratedUserId_idx" ON "SessionRating" ("ratedUserId");
