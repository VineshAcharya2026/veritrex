import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateNationBuildingBadges } from "@/lib/nation-building-badges";

const schema = z.object({
  verified: z.boolean(),
  adminNotes: z.string().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.nationBuildingEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entry = await prisma.nationBuildingEntry.update({
    where: { id },
    data: {
      verified: parsed.data.verified,
      verifiedAt: parsed.data.verified ? new Date() : null,
      verifiedBy: parsed.data.verified ? session.user.id : null,
      adminNotes: parsed.data.adminNotes ?? null,
    },
  });

  await recalculateNationBuildingBadges(existing.mentorId);

  return NextResponse.json(entry);
}
