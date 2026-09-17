import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

import { buildMentorWhere, parseMentorFilters } from "@/lib/filters";



export async function GET(request: Request) {

  const { error, session } = await requireRole("MENTEE");

  if (error || !session) return error;



  const filters = parseMentorFilters(new URL(request.url).searchParams);

  filters.excludeUserId = session.user.id;



  const mentors = await prisma.user.findMany({

    where: buildMentorWhere(filters),

    include: {

      profile: true,

      mentorProfile: true,

      trustScore: { select: { tier: true } },

      mentorSessions: { where: { status: "ACTIVE" }, select: { id: true } },

    },

    orderBy: { createdAt: "desc" },

  });



  return NextResponse.json(

    mentors.map((m) => ({

      id: m.id,

      email: m.email,

      name: m.profile ? `${m.profile.firstName} ${m.profile.lastName}` : m.email,

      avatar: m.profile?.avatar ?? null,

      tier: m.trustScore?.tier ?? "EMERGING",

      profile: m.mentorProfile,

      activeMentees: m.mentorSessions.length,

    }))

  );

}

