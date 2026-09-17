import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSkillInput } from "@/lib/skills";

function formatZodError(error: z.ZodError): string {
  const flat = error.flatten();
  const parts = [
    ...flat.formErrors,
    ...Object.entries(flat.fieldErrors).flatMap(([k, v]) =>
      (v ?? []).map((m) => `${k}: ${m}`)
    ),
  ];
  return parts.length ? parts.join("; ") : "Invalid profile data";
}

const linkedInUrlSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.trim() : val),
  z.union([
    z.literal(""),
    z
      .string()
      .url("Enter a valid LinkedIn URL (https://...)")
      .refine(
        (u) => /^https?:\/\//i.test(u),
        "LinkedIn URL must start with http:// or https://"
      ),
  ])
);

const skillSchema = z.object({
  skill: z.string().min(1),
  masteryLevel: z.number().int().min(1).max(5),
});

const schema = z.object({
  company: z.string().optional(),
  title: z.string().optional(),
  expertise: z.string().optional(),
  yearsExp: z.number().optional(),
  maxMentees: z.number().optional(),
  linkedInUrl: linkedInUrlSchema.optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
  seniorityLevel: z.enum(["MID", "SENIOR", "EXECUTIVE", "FOUNDER"]).optional().nullable(),
  interests: z.string().optional(),
  offersFreeMentorship: z.boolean().optional(),
  skills: z.array(skillSchema).optional(),

  // Phase 1 questionnaire fields
  professionalHeadline: z.string().max(120).optional(),
  professionalSummary: z.string().max(2000).optional(),
  threeWords: z.array(z.string()).max(3).optional(),
  areasOfExpertise: z.array(z.string()).max(5).optional(),
  industriesWorked: z.array(z.string()).optional(),
  yearsOfExperienceRange: z.string().optional(),
  whyMentor: z.string().max(2000).optional(),
  preferredMenteeTypes: z.array(z.string()).optional(),
  challengesCanHelp: z.array(z.string()).optional(),
  mentoringStyle: z.array(z.string()).max(2).optional(),
  sessionExpectations: z.string().max(2000).optional(),
  menteeExpectations: z.string().max(2000).optional(),
  achievements: z.string().max(3000).optional(),
  certifications: z.string().max(500).optional(),
  personalInterests: z.array(z.string()).optional(),
  influentialQuote: z.string().max(1000).optional(),
  preferredFormats: z.array(z.enum(["VIDEO", "AUDIO", "CHAT", "GROUP", "ASYNC"])).optional(),
  languages: z.array(z.string()).optional(),
  completeSentence: z.string().max(500).optional(),
  welcomeMessage: z.string().max(1000).optional(),
});

export async function GET() {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      skills: { orderBy: { masteryLevel: "desc" } },
      content: { orderBy: { publishedAt: "desc" } },
      _count: { select: { content: true, ratingsReceived: true } },
    },
  });

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const questionnaireFields = {
    professionalHeadline: data.professionalHeadline,
    professionalSummary: data.professionalSummary,
    threeWords: data.threeWords,
    areasOfExpertise: data.areasOfExpertise,
    industriesWorked: data.industriesWorked,
    yearsOfExperienceRange: data.yearsOfExperienceRange,
    whyMentor: data.whyMentor,
    preferredMenteeTypes: data.preferredMenteeTypes,
    challengesCanHelp: data.challengesCanHelp,
    mentoringStyle: data.mentoringStyle,
    sessionExpectations: data.sessionExpectations,
    menteeExpectations: data.menteeExpectations,
    achievements: data.achievements,
    certifications: data.certifications,
    personalInterests: data.personalInterests,
    influentialQuote: data.influentialQuote,
    preferredFormats: data.preferredFormats,
    languages: data.languages,
    completeSentence: data.completeSentence,
    welcomeMessage: data.welcomeMessage,
  };

  // Strip undefined values so we don't overwrite with null
  const cleanQuestionnaire = Object.fromEntries(
    Object.entries(questionnaireFields).filter(([, v]) => v !== undefined)
  );

  const profile = await prisma.$transaction(async (tx) => {
    const updated = await tx.mentorProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        company: data.company,
        title: data.title,
        expertise: parseSkillInput(data.expertise),
        yearsExp: data.yearsExp,
        maxMentees: data.maxMentees ?? 5,
        linkedInUrl: data.linkedInUrl || null,
        city: data.city,
        industry: data.industry,
        seniorityLevel: data.seniorityLevel ?? undefined,
        interests: data.interests ? parseSkillInput(data.interests) : [],
        offersFreeMentorship: data.offersFreeMentorship ?? false,
        ...cleanQuestionnaire,
      },
      update: {
        company: data.company,
        title: data.title,
        expertise: data.expertise ? parseSkillInput(data.expertise) : undefined,
        yearsExp: data.yearsExp,
        maxMentees: data.maxMentees,
        linkedInUrl: data.linkedInUrl !== undefined ? data.linkedInUrl || null : undefined,
        city: data.city,
        industry: data.industry,
        seniorityLevel: data.seniorityLevel ?? undefined,
        interests: data.interests ? parseSkillInput(data.interests) : undefined,
        offersFreeMentorship: data.offersFreeMentorship,
        ...cleanQuestionnaire,
      },
    });

    if (data.skills) {
      await tx.mentorSkill.deleteMany({ where: { mentorId: updated.id } });
      if (data.skills.length > 0) {
        await tx.mentorSkill.createMany({
          data: data.skills.map((s) => ({
            mentorId: updated.id,
            skill: s.skill,
            masteryLevel: s.masteryLevel,
          })),
        });
      }
    }

    return tx.mentorProfile.findUnique({
      where: { id: updated.id },
      include: {
        skills: { orderBy: { masteryLevel: "desc" } },
        _count: { select: { content: true } },
      },
    });
  });

  return NextResponse.json(profile);
}
