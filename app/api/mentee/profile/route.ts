import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSkillInput } from "@/lib/skills";
import { isMenteeOnboardingComplete } from "@/lib/mentee-onboarding";
import { optionalPhoneSchema } from "@/lib/validators/phone";

const profileSchema = z.object({
  // Identity (Profile / User)
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  preferredName: z.string().optional(),
  phone: optionalPhoneSchema,

  currentRole: z.string().optional(),
  goals: z.string().optional(),
  desiredSkills: z.string().optional(),

  // Onboarding questionnaire fields
  country: z.string().optional(),
  city: z.string().optional(),
  currentStatus: z
    .enum(["STUDENT", "GRADUATE", "PROFESSIONAL", "ENTREPRENEUR", "CAREER_BREAK", "CAREER_SWITCHER"])
    .optional()
    .nullable(),
  highestQualification: z.string().optional(),
  currentInstitution: z.string().optional(),
  currentDesignation: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  preferredIndustry: z.string().optional(),
  careerGoal: z.string().max(2000).optional(),
  guidanceAreas: z.array(z.string()).max(5).optional(),
  skillsToDevelo: z.array(z.string()).max(5).optional(),
  preferredMentorProfile: z.string().max(1000).optional(),
  preferredModes: z.array(z.enum(["VIDEO", "AUDIO", "CHAT", "GROUP", "ASYNC"])).optional(),
  languages: z.array(z.string()).optional(),
  biggestChallenge: z.string().max(2000).optional(),
  successDefinition: z.string().max(2000).optional(),
});

export async function GET() {
  const { error, session } = await requireRole("MENTEE");
  if (error || !session) return error;

  const [profile, userProfile, user] = await Promise.all([
    prisma.menteeProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  const complete = isMenteeOnboardingComplete({
    firstName: userProfile?.firstName,
    lastName: userProfile?.lastName,
    phone: user?.phone,
    ...(profile ?? {}),
  });

  return NextResponse.json({
    ...(profile ?? {}),
    firstName: userProfile?.firstName ?? "",
    lastName: userProfile?.lastName ?? "",
    preferredName: userProfile?.preferredName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    onboardingComplete: complete,
  });
}

export async function PATCH(request: Request) {
  const { error, session } = await requireRole("MENTEE");
  if (error || !session) return error;

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Reject phone that already belongs to another account (unique constraint).
  const phone = data.phone?.trim();
  if (phone) {
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone && existingPhone.id !== session.user.id) {
      return NextResponse.json({ error: "That mobile number is already in use." }, { status: 409 });
    }
  }

  const onboardingFields = {
    country: data.country,
    city: data.city,
    currentStatus: data.currentStatus ?? undefined,
    highestQualification: data.highestQualification,
    currentInstitution: data.currentInstitution,
    currentDesignation: data.currentDesignation,
    yearsOfExperience: data.yearsOfExperience,
    preferredIndustry: data.preferredIndustry,
    careerGoal: data.careerGoal,
    guidanceAreas: data.guidanceAreas,
    skillsToDevelo: data.skillsToDevelo,
    preferredMentorProfile: data.preferredMentorProfile,
    preferredModes: data.preferredModes,
    languages: data.languages,
    biggestChallenge: data.biggestChallenge,
    successDefinition: data.successDefinition,
  };

  const clean = Object.fromEntries(
    Object.entries(onboardingFields).filter(([, v]) => v !== undefined)
  );

  const profile = await prisma.$transaction(async (tx) => {
    if (phone !== undefined) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { phone: phone || null },
      });
    }

    const profileData: Record<string, unknown> = {};
    if (data.firstName !== undefined) profileData.firstName = data.firstName;
    if (data.lastName !== undefined) profileData.lastName = data.lastName;
    if (data.preferredName !== undefined) profileData.preferredName = data.preferredName || null;
    if (Object.keys(profileData).length > 0) {
      await tx.profile.update({ where: { userId: session.user.id }, data: profileData });
    }

    return tx.menteeProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        currentRole: data.currentRole,
        goals: data.goals,
        desiredSkills: parseSkillInput(data.desiredSkills),
        ...clean,
      },
      update: {
        currentRole: data.currentRole,
        goals: data.goals,
        desiredSkills: data.desiredSkills ? parseSkillInput(data.desiredSkills) : undefined,
        ...clean,
      },
    });
  });

  return NextResponse.json(profile);
}
