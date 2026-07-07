import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardCredits } from "@/lib/credits";

const schema = z.object({
  amount: z.number().int(),
  reason: z.string().min(1),
  isEliteFounder100: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { mentorProfile: true },
  });
  if (!user || user.role !== "MENTOR" || !user.mentorProfile) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  if (parsed.data.amount !== 0) {
    await awardCredits(
      user.id,
      parsed.data.amount,
      "ADMIN_ADJUSTMENT",
      parsed.data.reason
    );
  }

  if (parsed.data.isEliteFounder100 !== undefined) {
    await prisma.mentorProfile.update({
      where: { id: user.mentorProfile.id },
      data: { isEliteFounder100: parsed.data.isEliteFounder100 },
    });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { id: user.mentorProfile.id },
  });

  return NextResponse.json(profile);
}
