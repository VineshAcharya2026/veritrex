import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const applications = await prisma.memberReflection.findMany({
    where: { reviewStatus: { not: null } },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(applications);
}
