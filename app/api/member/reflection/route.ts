import { NextResponse } from "next/server";
import type { GentleCommitment, LeadershipLoneliness } from "@/lib/db/types";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reflectionDraftSchema, validateReflectionSubmit } from "@/lib/validators/reflection";

type ReflectionWriteData = {
  introduction?: string;
  proudestAchievement?: string;
  guidingValues?: string;
  standFor?: string;
  admiredPerson?: string;
  meaningPurpose?: string;
  dreamMission?: string;
  societalAspiration?: string;
  othersDescribeYou?: string;
  valuedQualities?: string[];
  energizingPeople?: string;
  differentBeliefsApproach?: string;
  confidentialityImportance?: number;
  supportWays?: string[];
  contributions?: string;
  leadershipLoneliness?: LeadershipLoneliness;
  supportNeeded?: string;
  sharingTopics?: string;
  rememberedFor?: string;
  additionalNotes?: string;
  gentleCommitment?: GentleCommitment;
};

function toReflectionData(
  fields: Omit<ReturnType<typeof reflectionDraftSchema.parse>, "submit">
): ReflectionWriteData {
  return {
    introduction: fields.introduction,
    proudestAchievement: fields.proudestAchievement,
    guidingValues: fields.guidingValues,
    standFor: fields.standFor,
    admiredPerson: fields.admiredPerson,
    meaningPurpose: fields.meaningPurpose,
    dreamMission: fields.dreamMission,
    societalAspiration: fields.societalAspiration,
    othersDescribeYou: fields.othersDescribeYou,
    valuedQualities: fields.valuedQualities ?? [],
    energizingPeople: fields.energizingPeople,
    differentBeliefsApproach: fields.differentBeliefsApproach,
    confidentialityImportance: fields.confidentialityImportance ?? undefined,
    supportWays: fields.supportWays ?? [],
    contributions: fields.contributions,
    leadershipLoneliness: (fields.leadershipLoneliness as LeadershipLoneliness | null) ?? undefined,
    supportNeeded: fields.supportNeeded,
    sharingTopics: fields.sharingTopics,
    rememberedFor: fields.rememberedFor,
    additionalNotes: fields.additionalNotes,
    gentleCommitment: (fields.gentleCommitment as GentleCommitment | null) ?? undefined,
  };
}

export async function GET() {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const reflection = await prisma.memberReflection.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(reflection ?? {});
}

export async function PATCH(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const body = await request.json();
  const parsed = reflectionDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { submit, ...fields } = parsed.data;

  if (submit) {
    const validation = validateReflectionSubmit(parsed.data);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  }

  const data = toReflectionData(fields);

  const reflection = await prisma.memberReflection.upsert({
    where: { userId: session.user.id },
    create: {
      ...data,
      userId: session.user.id,
      completedAt: submit ? new Date() : null,
    },
    update: {
      ...data,
      ...(submit ? { completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json(reflection);
}
