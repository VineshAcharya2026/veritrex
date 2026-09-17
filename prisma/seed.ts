import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SKILL_NAMES = [
  "React",
  "TypeScript",
  "Leadership",
  "System Design",
  "Career Growth",
  "Interview Prep",
];

async function main() {
  const hash = await bcrypt.hash("Password123!", 12);

  await prisma.platformConfig.upsert({
    where: { key: "default_max_mentees" },
    create: { key: "default_max_mentees", value: "5" },
    update: { value: "5" },
  });

  await prisma.user.upsert({
    where: { email: "superadmin@veritra.com" },
    update: { role: "SUPER_ADMIN", status: "ACTIVE" },
    create: {
      email: "superadmin@veritra.com",
      passwordHash: hash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      profile: { create: { firstName: "Super", lastName: "Admin" } },
    },
  });

  const mentor = await prisma.user.upsert({
    where: { email: "mentor@veritra.com" },
    update: { role: "MENTOR", status: "ACTIVE" },
    create: {
      email: "mentor@veritra.com",
      phone: "+919876543210",
      passwordHash: hash,
      role: "MENTOR",
      status: "ACTIVE",
      profile: { create: { firstName: "Raj", lastName: "Sharma" } },
      mentorProfile: {
        create: {
          company: "TrustHire",
          title: "Staff Engineer",
          expertise: SKILL_NAMES.slice(0, 4),
          yearsExp: 12,
          maxMentees: 5,
          city: "Mumbai",
          industry: "Technology",
          seniorityLevel: "SENIOR",
          interests: ["Leadership", "Entrepreneurship"],
          linkedInUrl: "https://linkedin.com/in/example",
          isEliteFounder100: true,
          offersFreeMentorship: true,
          thoughtLeadershipScore: 42,
          creditsBalance: 25,
        },
      },
    },
    include: { mentorProfile: true },
  });

  if (mentor.mentorProfile) {
    await prisma.mentorProfile.update({
      where: { id: mentor.mentorProfile.id },
      data: {
        city: "Mumbai",
        industry: "Technology",
        seniorityLevel: "SENIOR",
        isEliteFounder100: true,
        offersFreeMentorship: true,
        thoughtLeadershipScore: 42,
        creditsBalance: 25,
      },
    });
    await prisma.mentorSkill.deleteMany({ where: { mentorId: mentor.mentorProfile.id } });
    await prisma.mentorSkill.createMany({
      data: [
        { mentorId: mentor.mentorProfile.id, skill: "Leadership", masteryLevel: 5 },
        { mentorId: mentor.mentorProfile.id, skill: "System Design", masteryLevel: 4 },
        { mentorId: mentor.mentorProfile.id, skill: "React", masteryLevel: 5 },
      ],
    });
  }

  const mentee = await prisma.user.upsert({
    where: { email: "mentee@veritra.com" },
    update: { role: "MENTEE", status: "ACTIVE" },
    create: {
      email: "mentee@veritra.com",
      phone: "+919876543211",
      passwordHash: hash,
      role: "MENTEE",
      status: "ACTIVE",
      profile: { create: { firstName: "Priya", lastName: "Patel" } },
      menteeProfile: {
        create: {
          currentRole: "Junior Developer",
          goals: "Transition to senior frontend role within 12 months",
          desiredSkills: ["React", "TypeScript", "System Design"],
        },
      },
    },
  });

  const existing = await prisma.mentorship.findFirst({
    where: { mentorId: mentor.id, menteeId: mentee.id },
  });
  if (!existing) {
    await prisma.mentorship.create({
      data: { mentorId: mentor.id, menteeId: mentee.id, status: "ACTIVE" },
    });
  }

  console.log("Seed complete.");
  console.log("Super Admin: superadmin@veritra.com / Password123!");
  console.log("Mentor: mentor@veritra.com / Password123!");
  console.log("Mentee: mentee@veritra.com / Password123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
