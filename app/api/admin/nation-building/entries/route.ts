import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "pending";
  const where =
    status === "all" ? { source: "MANUAL" } : { source: "MANUAL", verified: false };

  const entries = await prisma.nationBuildingEntry.findMany({
    where,
    include: {
      mentor: { include: { profile: true, mentorProfile: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}
