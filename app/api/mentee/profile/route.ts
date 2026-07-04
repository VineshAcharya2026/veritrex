import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSkillInput } from "@/lib/skills";

const profileSchema = z.object({
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

  const profile = await prisma.menteeProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile);
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

  const profile = await prisma.menteeProfile.upsert({
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
      desiredSkills: data.desiredSkills
        ? parseSkillInput(data.desiredSkills)
        : undefined,
      ...clean,
    },
  });

  return NextResponse.json(profile);
}
