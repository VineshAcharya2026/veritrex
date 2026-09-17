/**
 * Seed Cloudflare D1 with demo users and sample data.
 *
 * Usage:
 *   node scripts/seed-d1.mjs --local
 *   node scripts/seed-d1.mjs --remote
 */
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const remote = process.argv.includes("--remote");
const flag = remote ? "--remote" : "--local";

function id() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 14);
  return `c${ts}${rand}`;
}

function esc(value) {
  return String(value).replace(/'/g, "''");
}

async function main() {
  const hash = await bcrypt.hash("Password123!", 12);
  const now = new Date().toISOString();

  const adminId = id();
  const mentorUserId = id();
  const menteeUserId = id();
  const adminProfileId = id();
  const mentorProfileId = id();
  const mentorMentorProfileId = id();
  const menteeProfileId = id();
  const menteeMentorProfileId = id();
  const mentorshipId = id();

  const sql = `
DELETE FROM "MentorSkill";
DELETE FROM "Mentorship";
DELETE FROM "MentorProfile";
DELETE FROM "MenteeProfile";
DELETE FROM "Profile";
DELETE FROM "PlatformConfig";
DELETE FROM "User";

INSERT INTO "PlatformConfig" ("id", "key", "value") VALUES ('${id()}', 'default_max_mentees', '5');

INSERT INTO "User" ("id", "email", "passwordHash", "role", "status", "createdAt", "updatedAt")
VALUES
  ('${adminId}', 'superadmin@veritra.com', '${esc(hash)}', 'SUPER_ADMIN', 'ACTIVE', '${now}', '${now}'),
  ('${mentorUserId}', 'mentor@veritra.com', '${esc(hash)}', 'MENTOR', 'ACTIVE', '${now}', '${now}'),
  ('${menteeUserId}', 'mentee@veritra.com', '${esc(hash)}', 'MENTEE', 'ACTIVE', '${now}', '${now}');

INSERT INTO "Profile" ("id", "userId", "firstName", "lastName")
VALUES
  ('${adminProfileId}', '${adminId}', 'Super', 'Admin'),
  ('${mentorProfileId}', '${mentorUserId}', 'Raj', 'Sharma'),
  ('${menteeProfileId}', '${menteeUserId}', 'Priya', 'Patel');

INSERT INTO "MentorProfile" (
  "id", "userId", "company", "title", "expertise", "yearsExp", "maxMentees",
  "city", "industry", "seniorityLevel", "interests", "isEliteFounder100",
  "thoughtLeadershipScore", "creditsBalance", "offersFreeMentorship"
) VALUES (
  '${mentorMentorProfileId}', '${mentorUserId}', 'Veritra', 'Staff Engineer',
  '["React","TypeScript","Leadership","System Design"]', 12, 5,
  'Mumbai', 'Technology', 'SENIOR', '["Leadership","Entrepreneurship"]', 1,
  42, 25, 1
);

INSERT INTO "MenteeProfile" ("id", "userId", "currentRole", "goals", "desiredSkills")
VALUES (
  '${menteeMentorProfileId}', '${menteeUserId}', 'Junior Developer',
  'Transition to senior frontend role within 12 months',
  '["React","TypeScript","System Design"]'
);

INSERT INTO "MentorSkill" ("id", "mentorId", "skill", "masteryLevel", "createdAt", "updatedAt")
VALUES
  ('${id()}', '${mentorMentorProfileId}', 'Leadership', 5, '${now}', '${now}'),
  ('${id()}', '${mentorMentorProfileId}', 'System Design', 4, '${now}', '${now}'),
  ('${id()}', '${mentorMentorProfileId}', 'React', 5, '${now}', '${now}');

INSERT INTO "Mentorship" ("id", "mentorId", "menteeId", "status", "createdAt", "updatedAt")
VALUES ('${mentorshipId}', '${mentorUserId}', '${menteeUserId}', 'ACTIVE', '${now}', '${now}');

INSERT INTO "MentorshipSession" ("id", "mentorshipId", "scheduledAt", "createdAt", "updatedAt")
VALUES ('${id()}', '${mentorshipId}', '${new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()}', '${now}', '${now}');
`;

  const tempFile = join(root, ".seed-d1-temp.sql");
  writeFileSync(tempFile, sql, "utf8");

  try {
    // Use node + wrangler.js so Windows paths containing "&" don't break npx
    const wranglerJs = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
    execSync(
      `node "${wranglerJs}" d1 execute trusthire-db ${flag} --file="${tempFile}"`,
      { cwd: root, stdio: "inherit", shell: true }
    );
    console.log("\nD1 seed complete.");
    console.log("Super Admin: superadmin@veritra.com / Password123!");
    console.log("Mentor: mentor@veritra.com / Password123!");
    console.log("Mentee: mentee@veritra.com / Password123!");
  } finally {
    unlinkSync(tempFile);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
