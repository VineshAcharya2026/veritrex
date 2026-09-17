import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(4000).optional(),
  quantity: z.number().int().min(0).max(100000).optional(),
  eventDate: z.string().optional(),
  location: z.string().max(160).optional(),
  testimonial: z.string().max(4000).optional(),
  evidenceUrls: z.array(z.string()).max(10).optional(),
});

async function loadOwnManualEntry(id: string, mentorUserId: string) {
  const entry = await prisma.nationBuildingEntry.findUnique({ where: { id } });
  if (!entry || entry.mentorId !== mentorUserId) return { entry: null, forbidden: false, notFound: true };
  if (entry.source !== "MANUAL") return { entry, forbidden: true, notFound: false };
  return { entry, forbidden: false, notFound: false };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const { entry, forbidden, notFound } = await loadOwnManualEntry(id, session.user.id);
  if (notFound) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (forbidden) {
    return NextResponse.json(
      { error: "Platform-synced entries cannot be edited." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const updated = await prisma.nationBuildingEntry.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
      ...(data.eventDate !== undefined
        ? { eventDate: data.eventDate ? new Date(data.eventDate) : null }
        : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.testimonial !== undefined ? { testimonial: data.testimonial } : {}),
      ...(data.evidenceUrls !== undefined ? { evidenceUrls: data.evidenceUrls } : {}),
      // Editing a pending entry keeps it pending; editing a verified entry re-queues it.
      verified: false,
      verifiedAt: null,
      verifiedBy: null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const { forbidden, notFound } = await loadOwnManualEntry(id, session.user.id);
  if (notFound) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (forbidden) {
    return NextResponse.json(
      { error: "Platform-synced entries cannot be deleted." },
      { status: 403 }
    );
  }

  await prisma.nationBuildingEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
