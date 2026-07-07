import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNotes: z.string().optional(),
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

  const application = await prisma.innerCircleApplication.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
    },
  });

  return NextResponse.json(application);
}
