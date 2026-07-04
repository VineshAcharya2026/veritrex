import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const flags = await prisma.cheatFlag.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const enriched = await Promise.all(
    flags.map(async (flag) => {
      const [mentor, mentee] = await Promise.all([
        prisma.user.findUnique({
          where: { id: flag.mentorUserId },
          include: { profile: { select: { firstName: true, lastName: true } } },
        }),
        prisma.user.findUnique({
          where: { id: flag.menteeUserId },
          include: { profile: { select: { firstName: true, lastName: true } } },
        }),
      ]);

      return {
        ...flag,
        mentorName: mentor?.profile
          ? `${mentor.profile.firstName} ${mentor.profile.lastName}`
          : mentor?.email ?? "Unknown",
        menteeName: mentee?.profile
          ? `${mentee.profile.firstName} ${mentee.profile.lastName}`
          : mentee?.email ?? "Unknown",
      };
    })
  );

  return NextResponse.json(enriched);
}
