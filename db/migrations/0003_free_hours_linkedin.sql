-- Free mentorship hour cap tracking, session duration, mentee LinkedIn
ALTER TABLE MentorProfile ADD COLUMN freeMentorshipMinutesUsed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE MentorshipSession ADD COLUMN durationMinutes INTEGER;
ALTER TABLE MenteeProfile ADD COLUMN linkedInUrl TEXT;
